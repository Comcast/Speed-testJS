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
                                            callbackTimeout, callbackError, size, probeTime) {
        this.size = size;
        this.url = url;
        this.type = type;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        this.probeTime = probeTime;
        //unique id or test
        this._testIndex = 0;
        //array holding all results
        this._results = [];
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
        //new run size multiplier
        this.sizeMultiplier = 2;
        //total probe time
        this.probeTotalTime =0;
        //total probe bytes
        this.probeTotalBytes = 0;
        //progress interval collection
        this.progressIntervalDownload = 5;


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
        this.probeTotalTime = this.probeTotalTime + result.time;
        this.probeTotalBytes = this.probeTotalBytes + result.loaded;
      }
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
        //pushing results to an array
        this._results.push(result.bandwidth);
        //cancel remaining tests

        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
        //reset Active Tests array
        this._activeTests.length =0;
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
          //console.log(result);
          //console.log(this.finalResults.slice(this.finalResults.length-10, 10));
          //console.log('packets: ' + (parseFloat(result.loaded) - parseFloat(this.size)));
          if(this.isProbing) {
            this.probeTotalTime = this.probeTotalTime + result.time;
            this.probeTotalBytes = this.probeTotalBytes + result.loaded;
            this.size = this.probeTime * result.loaded/result.time;
          }
          else{
            this.size = this.timeout * result.loaded/result.time;
            //this.size = 532421875;
          }

          this.start();
        }
        else {
            //check this._running flag again since it may have been reset in abort
            if (this._running) {
                clearInterval(this.interval);
                this._running = false;
                if (this.finalResults && this.finalResults.length) {
                    this.clientCallbackComplete(this.finalResults);
                } else {
                    this.clientCallbackError('no measurements obtained');
                }
            }
        }
    };

    /**
     * onProgress method
     */
    downloadHttpConcurrentProgress.prototype.onTestProgress = function (result) {
        if (!this._running) {
            return;
        }
/*
      if(this._progressCount === 0  && !this.isProbing){
        this.startTimeBytes = result.startTime;
      }
      if(!this.isProbing){
        this.totalByes = this.totalByes + result.chunckLoadedMb;
        //console.log(this.totalByes);
        //console.log(this.startTimeBytes);
        //console.log('bandWidth: ' + this.totalByes/((Date.now() -parseFloat(this.startTimeBytes))/1000));
      }
      */
        if ((Date.now() - this._beginTime) > this.testLength) {
            clearInterval(this.interval);
            this.abortAll();
            if (this.finalResults && this.finalResults.length) {
                this.clientCallbackComplete(this.finalResults);
            } else {
                this.clientCallbackError('no measurements obtained');
            }
            this._running = false;
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
              this._results.push(totalMovingAverage);
            }

        }
            this.clientCallbackProgress(totalMovingAverage);
            this.finalResults.push(totalMovingAverage);
    };

    /**
     * Start the test
     */
    downloadHttpConcurrentProgress.prototype.start = function () {
      console.log('start: ' + this._running);
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
        else {
            for (var p = 1; p <= this.concurrentRuns; p++) {
                this._testIndex++;
                this._activeTests.push(this._testIndex);
                this['testResults' + this._testIndex] = [];
                this.test.start(this.size, this._testIndex);
            }
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
      if ((Date.now() - this._beginTime) > (this.probeTime ) &&this.isProbing) {
        console.log('monitorAbortProbe');
        this.isProbing=false;
        this.abortAll();
        //this.concurrentRuns = 6;
        console.log('probeTime: ' + this.probeTotalTime);
        console.log('probeBytes: ' + this.probeTotalBytes);
        console.log('probeBandwidth: ' + ((this.probeTotalBytes*8)/1000000)/(this.probeTotalTime/1000));
        this.size = this.size*10;
        console.log('testSize: ' + this.size);
        this.movingAverage =10;
        this.progressIntervalDownload = 100;
        console.log(this.finalResults.sort(function(a, b){return b - a}));
        this.finalResults.length =0;
        if(this.size>532421875){
          this.size = 532421875;
        }
        this.start();
      }
    };

    /**
     * reset test variables
     */
    downloadHttpConcurrentProgress.prototype.initiateTest = function(){
        this._testIndex = 0;
        this._results.length=0;
        this.finalResults.length=0;
        this._activeTests.length=0;
        this._progressResults = {};
        this._progressCount = 0;
        this._running = true;
        this.interval = null;
        this.isProbing = true;
        this.start();
        var self = this;
        this.interval = setInterval(function () {
          self._monitor();
        }, 100);
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();