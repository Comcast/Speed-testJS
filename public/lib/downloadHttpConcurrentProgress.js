/*
 * *
 *  Copyright 2014 Comcast Cable Communications Management, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */

(function () {
    'use strict';
    /**
     * download testing based on httpRequests
     * @param string server endpoint for upload testing
     * @param string post or get request
     * @param integer number of concurrentRuns
     * @param integer timeout of the request
     * @param integer length of the testLength
     * @param integer when to calculate moving average
     * @param function callback function for test suite complete event
     * @param function callback function for test suite progress event
     * @param function callback function for test suite abort event
     * @param function callback function for test suite timeout event
     * @param function callback function for test suite error event
     **/
    function downloadHttpConcurrentProgress(url, type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackAbort,
                                            callbackTimeout, callbackError, size, probeTimeTimeout, progressIntervalDownload, maxDownloadSize) {
        this.size = size;
        this.url = url;
        this.type = type;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        this.probeTimeTimeout = probeTimeTimeout;
        this.progressIntervalDownload = progressIntervalDownload;
        this.maxDownloadSize = maxDownloadSize;
        //unique id or test
        this._testIndex = 0;
        //array holding active tests
        this._activeTests = [];
        this.clientCallbackComplete = callbackComplete;
        this.clientCallbackProgress = callbackProgress;
        this.clientCallbackAbort = callbackAbort;
        this.clientCallbackTimeout = callbackTimeout;
        this.clientCallbackError = callbackError;
        //start time of test suite
        this._beginTime = Date.now();
        //boolean on whether test  suite is running or not
        this._running = true;
        //array holding  results
        this.finalResults = [];
        //object holding all test progress measurements
        this._progressResults = {};
        //count of progress events
        this._progressCount = 0;
        //flag on whether to collect measurements-All request need to be running at the same time
        this._collectMovingAverages = false;
        //monitor interval
        this.interval = null;
        //probing flag
        this.isProbing = true;
        //total probe bytes
        this.probeTotalBytes = 0;
        //low bandwidth
        this.lowProbeBandwidth = 40;
        //high bandwidth
        this.highProbeBandwidth = 300;

    }

    /**
     * onError method
     * @return error object
     */
    downloadHttpConcurrentProgress.prototype.onTestError = function (result) {
        if (this._running) {
            this.clientCallbackError(result);
            clearInterval(this.interval);
            this._running = false;
        }
    };
    /**
     * onAbort method
     * @return abort object
     */
    downloadHttpConcurrentProgress.prototype.onTestAbort = function (result) {
      if(this.isProbing){
        this.probeTotalBytes = this.probeTotalBytes + result.loaded;
      }

    };
    /**
     * onTimeout method
     * @return timeout object
     */
    downloadHttpConcurrentProgress.prototype.onTestTimeout = function () {
        if(this._running) {
            if ((Date.now() - this._beginTime) > this.testLength) {
                clearInterval(this.interval);
                if (this.finalResults && this.finalResults.length) {
                    this.clientCallbackComplete(this.finalResults);
                } else {
                    this.clientCallbackError('no measurements obtained');
                }
                this._running = false;
            }

        }
    };

    /**
     * onComplete method
     */
    downloadHttpConcurrentProgress.prototype.onTestComplete = function (result) {

        if (!this._running) {
            return;
        }
        this._collectMovingAverages = false;
        //cancel remaining tests
        this.abortAll();
        //reset Active Tests array
        this._activeTests.length =0;
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
          if(this.isProbing) {
            this.abortAll();
            try{
              if(result.time>0) {
                this.probeTotalBytes = this.probeTotalBytes + result.loaded;
                this.size = (this.probeTimeTimeout - result.time) * result.loaded / result.time;
              }
            }catch(error){// jshint ignore:line

            }

          }
          else{
            if((this.timeout * result.loaded/result.time)< this.size) {
              this.size = this.timeout * result.loaded / result.time;
            }
          }
          if(this.size>this.maxDownloadSize){
            this.size = this.maxDownloadSize;
          }
          this.start();
        }

    };

    /**
     * onProgress method
     */
    downloadHttpConcurrentProgress.prototype.onTestProgress = function (result) {
        if (!this._running) {
            return;
        }

        if(this.isProbing){
          this.probeTotalBytes = this.probeTotalBytes + result.loaded;
        }

        if(!this._collectMovingAverages){
            return;
        }
        //update progress count
        this._progressCount++;
        //populate array
        this._progressResults['arrayProgressResults' + result.id].push(result.bandwidth);
        //calculate moving average
        if (this._progressCount % this.movingAverage === 0) {
            this.calculateStats();
        }
    };

    /**
     * calculateStats method
     */
    downloadHttpConcurrentProgress.prototype.calculateStats = function () {
        //loop thru active tests to calculate totalMovingAverage
        var totalMovingAverage = 0;
        for (var i = 0; i < this.concurrentRuns; i++) {
            // get array size and loop thru size of moving average series or array length
            var id = this._testIndex -i;
            var arrayData = 'arrayProgressResults' + id;
            var lastElem = Math.min(this._progressResults[arrayData].length, this.movingAverage);
            if (lastElem > 0) {
                var singleMovingAverage = 0;
                for (var j = 1; j <= lastElem; j++) {
                    if (isFinite(this._progressResults[arrayData][this._progressResults[arrayData].length - j])) {
                        singleMovingAverage = singleMovingAverage + this._progressResults[arrayData][this._progressResults[arrayData].length - j];
                    }
                }
                singleMovingAverage = singleMovingAverage / lastElem;
                totalMovingAverage = totalMovingAverage + singleMovingAverage;
            }

        }
            this.clientCallbackProgress(totalMovingAverage);
            this.finalResults.push(totalMovingAverage);
    };

    /**
     * Start the test
     */
    downloadHttpConcurrentProgress.prototype.start = function () {
      if (!this._running) {
            return;
        }
        if (this.type === 'GET') {
            for (var g = 1; g <= this.concurrentRuns; g++) {
                this._testIndex++;
                this['arrayResults' + this._testIndex] = [];
                this._progressResults['arrayProgressResults' + this._testIndex] = [];
                var request = new window.xmlHttpRequest('GET', this.url+ this.size +  '&r=' + Math.random(), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
                    this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this),this.progressIntervalDownload);
                this._activeTests.push({
                    xhr: request,
                    testRun: this._testIndex
                });
                request.start(0, this._testIndex);
            }
            this._collectMovingAverages = true;
        }
    };

    /**
     * Cancel the test
     */
    downloadHttpConcurrentProgress.prototype.abortAll = function () {

        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
    };

    /**
     * Monitor testSeries
     */
    downloadHttpConcurrentProgress.prototype._monitor = function () {
      //check for end of test
      if ((Date.now() - this._beginTime) > (this.testLength)) {
        this._running = false;
        this._collectMovingAverages = false;
        clearInterval(this.interval);
        if (this.finalResults && this.finalResults.length) {
          this.clientCallbackComplete(this.finalResults);
        } else {
          this.clientCallbackError('no measurements obtained');
        }
        this.abortAll();
      }
      //check for end of probing
      if ((Date.now() - this._beginTime) > (this.probeTimeTimeout) && this.isProbing) {
        this.isProbing = false;
        this.abortAll();
        //TODO check on better way to get testing size
        this.size = ((this.testLength - this.probeTimeTimeout) * this.probeTotalBytes) / (this.probeTimeTimeout * this.concurrentRuns);
        var probeResults = (this.finalResults.sort(function (a, b) {
          return +b - +a;
        }));
        var lastElem = Math.min(probeResults.length, 10);
        var topResults = probeResults.slice(0, lastElem);
        var probeBandwidth = topResults.reduce(function (a, b) {
            return a + b;
          }) / lastElem;
        if (probeBandwidth <= this.lowProbeBandwidth) {
          this.progressIntervalDownload = 10;
          this.concurrentRuns = 1;
        } else if (probeBandwidth > this.lowProbeBandwidth && probeBandwidth <= this.highProbeBandwidth) {
          this.progressIntervalDownload = 50;
          this.concurrentRuns = 6;
        }
        this.finalResults.length = 0;
        if (this.size > this.maxDownloadSize) {
          this.size = this.maxDownloadSize;
        }
        this.start();
      }
    };

    /**
     * reset test variables
     */
    downloadHttpConcurrentProgress.prototype.initiateTest = function(){
        this._testIndex = 0;
        this.finalResults.length=0;
        this._activeTests.length=0;
        this._progressResults = {};
        this._progressCount = 0;
        this._running = true;
        this.interval = null;
        this.isProbing = true;
        this.probeTotalBytes = 0;
        this.start();
        var self = this;
        this.interval = setInterval(function () {
          self._monitor();
        }, 100);
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();