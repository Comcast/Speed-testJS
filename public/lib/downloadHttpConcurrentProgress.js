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
    function downloadHttpConcurrentProgress(urls, url, type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackAbort,
                                            callbackTimeout, callbackError, size, probeTimeTimeout, progressIntervalDownload, maxDownloadSize,
                                            downloadLowProbeBandwidth, downHighProbeBandwidth,downLowProbeBandwidthConcurrentRuns,downHighProbeBandwidthConcurrentRuns,
                                            downloadLowProbeBandwidthProgressInterval,downHighProbeBandwidthProgressInterval) {
        this.urls = urls;
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
        this.lowProbeBandwidth = downloadLowProbeBandwidth;
        //high bandwidth
        this.highProbeBandwidth = downHighProbeBandwidth;
        //low bandwidth concurrent runs
        this.lowProbeBandwidthConcurrentRuns = downLowProbeBandwidthConcurrentRuns;
        //high bandwidth concurrent runs
        this.highProbeBandwidthConcurrentRuns = downHighProbeBandwidthConcurrentRuns;
        //low bandwidth concurrent runs
        this.lowProbeBandwidthProgressInterval = downloadLowProbeBandwidthProgressInterval;
        //high bandwidth concurrent runs
        this.highProbeBandwidthProgressInterval = downHighProbeBandwidthProgressInterval;
        //running tests
        this.runningTest = [];
        //results object array
        this.results =[];
        //results count
        this.resultsCount = 0;


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
      this._storeResults(result);
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

        //store results
        this._storeResults(result);
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
          if(this.isProbing) {
            this.probeTotalBytes = this.probeTotalBytes + result.loaded;
            if(((this.probeTimeTimeout - result.time) * result.loaded / result.time) > this.size) {
              this.size = (this.probeTimeTimeout - result.time) * result.loaded / result.time;
            };
            //todo... concurrent runs might have to be adjusted based on real time bandwidth measurements
            this.concurrentRuns = this.concurrentRuns*3;

          }
          else{
            if((this.timeout * result.loaded/result.time)> this.size) {
              this.size = this.timeout * result.loaded / result.time;
            }
          }
          if(this.size>this.maxDownloadSize){
            this.size = this.maxDownloadSize;
          }
          if(this.concurrentRuns > 30){
            this.concurrentRuns = 30;
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
        this._storeResults(result);

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
              this.runningTest.push(this._testIndex);
                var request = new window.xmlHttpRequest('GET', this.urls[g]+ this.size +  '&r=' + Math.random(), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
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
              this.runningTest.pop(this._activeTests[i].xhr.testRun);
            }
        }
    };

    /**
     * store speedtest measurements
     * @param result
     * @private
     */
    downloadHttpConcurrentProgress.prototype._storeResults = function (result) {
      this.results.push(result);
    };


    /**
     * Monitor testSeries
     */
    downloadHttpConcurrentProgress.prototype._monitor = function () {
      //console.log('interval: ' + (Date.now() - this._beginTime));
      var intervalBandwidth=0;
      var totalLoaded = 0;
      var totalTime = 0;
      var intervalCounter = 0;
      this.resultsCount++;

      if(this.results.length>0) {
        for (var i = 0; i < this.results.length; i++) {
          if (this.results[i].timeStamp > (Date.now() - 200)) {
            //console.log(this.results[i]);
            intervalBandwidth = intervalBandwidth + parseFloat(this.results[i].bandwidth);
            totalLoaded = totalLoaded + this.results[i].chunckLoaded;
            totalTime = totalTime + this.results[i].totalTime;
            intervalCounter++;
          }
        }
        if(!isNaN(intervalBandwidth/intervalCounter)) {
          //console.log('intervalBandwidth: ' + intervalBandwidth / intervalCounter);
          //console.log('intervalBandwidthLoaded: ' + ((totalLoaded * 8) / 1000000) / (100/1000));
          var transferSizeMbs = (totalLoaded * 8) / 1000000;
          var transferDurationSeconds = 200/1000;
          //console.log(transferSizeMbs + '    ' + transferDurationSeconds);
          //console.log('intervalBandwidthLoaded: ' + (transferSizeMbs / transferDurationSeconds));
          //this.clientCallbackProgress(transferSizeMbs / transferDurationSeconds);
          this.finalResults.push(transferSizeMbs / transferDurationSeconds);
          var singleMovingAverage = 0;
          var lastElem = Math.min(this.finalResults.length, this.movingAverage);
          if (lastElem > 0) {
            var singleMovingAverage = 0;
            for (var j = 1; j <= lastElem; j++) {
              if (isFinite(this.finalResults[this.finalResults.length - j])) {
                singleMovingAverage = singleMovingAverage + this.finalResults[this.finalResults.length-j];

              }
            }
            singleMovingAverage = singleMovingAverage / lastElem;
            this.clientCallbackProgress(singleMovingAverage);
          }

        }

      }
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
        }, 200);
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();