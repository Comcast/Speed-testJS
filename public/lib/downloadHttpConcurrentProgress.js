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
     * @param function callback function for test percentage complete
     **/
    function downloadHttpConcurrentProgress(urls,  type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackAbort,
                                            callbackTimeout, callbackError, size, progressIntervalDownload, monitorInterval, callbackPercentageComplete) {
        this.urls = urls;
        this.size = size;
        this.type = type;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        //time to capture onProgressEvent
        this.progressIntervalDownload = progressIntervalDownload;
        //time for monitor to calcualte stats
        this.monitorInterval = monitorInterval;
        //unique id or test
        this._testIndex = 0;
        //array holding active tests
        this._activeTests = [];
        this.clientCallbackComplete = callbackComplete;
        this.clientCallbackProgress = callbackProgress;
        this.clientCallbackAbort = callbackAbort;
        this.clientCallbackTimeout = callbackTimeout;
        this.clientCallbackError = callbackError;
        this.clientCallbackPercentageComplete = callbackPercentageComplete;
        //start time of test suite
        this._beginTime = Date.now();
        //boolean on whether test  suite is running or not
        this._running = true;
        //array holding  results
        this.finalResults = [];
        //monitor interval
        this.interval = null;
        //total probe bytes
        this.totalBytes = 0;
        //results object array
        this.results =[];
        //results count
        this.resultsCount = 0;
        //results to send to client
        this.downloadResults = [];
    }

    /**
     * onError method
     * @return error object
     */
    downloadHttpConcurrentProgress.prototype.onTestError = function (result) {
      if (this._running) {
         console.log('onTestErrorCalled: ' + this.downloadResults.length);
         console.log('onTestErrorCalled call time: ' + (Date.now() - this._beginTime));
         if ((Date.now() - this._beginTime) > this.testLength) {
           this.testEnd();
          }
      }
    };
    /**
     * onAbort method
     * @return abort object
     */
    downloadHttpConcurrentProgress.prototype.onTestAbort = function (result) {
      this._storeResults(result);
      this.totalBytes = this.totalBytes + result.loaded;
    };
    /**
     * onTimeout method
     * @return timeout object
     */
    downloadHttpConcurrentProgress.prototype.onTestTimeout = function () {
        if(this._running) {
            if ((Date.now() - this._beginTime) > this.testLength) {
                this.testEnd();
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
        this.start();
        };



    /**
     * onProgress method
     */
    downloadHttpConcurrentProgress.prototype.onTestProgress = function (result) {
        if (!this._running) {
            return;
        }
        //check for end of test
        if ((Date.now() - this._beginTime) > this.testLength) {
            this.endTest();
        }
        this.totalBytes = this.totalBytes + result.loaded;
        this._storeResults(result);

    };

    /**
     * Start the test
     */
    downloadHttpConcurrentProgress.prototype.start = function () {
      if (!this._running) {
            return;
      }

            for (var g = 1; g <= this.concurrentRuns; g++) {
                this._testIndex++;
                var request = new window.xmlHttpRequest('GET', this.urls[g]+ this.size +  '&r=' + Math.random(), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
                    this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this),this.progressIntervalDownload);
                this._activeTests.push({
                    xhr: request,
                    testRun: this._testIndex
                });
                request.start(0, this._testIndex);
            }

    };

    /**
     * Cancel the test
     */
    downloadHttpConcurrentProgress.prototype.abortAll = function () {
        clearInterval(this.interval);
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
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
        var intervalBandwidth = 0;
        var totalLoaded = 0;
        var totalTime = 0;
        var intervalCounter = 0;
        this.resultsCount++;

        if (this.results.length > 0) {
            for (var i = 0; i < this.results.length; i++) {
                if (this.results[i].timeStamp > (Date.now() - this.monitorInterval)) {
                    intervalBandwidth = intervalBandwidth + parseFloat(this.results[i].bandwidth);
                    totalLoaded = totalLoaded + this.results[i].chunckLoaded;
                    totalTime = totalTime + this.results[i].totalTime;
                    intervalCounter++;
                }
            }
            if (!isNaN(intervalBandwidth / intervalCounter)) {
                var transferSizeMbs = (totalLoaded * 8) / 1000000;
                var transferDurationSeconds = this.monitorInterval / 1000;
                this.finalResults.push(transferSizeMbs / transferDurationSeconds);
                var lastElem = Math.min(this.finalResults.length, this.movingAverage);
                if (lastElem > 0) {
                    var singleMovingAverage = 0;
                    for (var j = 1; j <= lastElem; j++) {
                        if (isFinite(this.finalResults[this.finalResults.length - j])) {
                            singleMovingAverage = singleMovingAverage + this.finalResults[this.finalResults.length - j];

                        }
                    }
                    singleMovingAverage = singleMovingAverage / lastElem;
                    if (singleMovingAverage > 0) {
                        this.downloadResults.push(singleMovingAverage);
                        this.clientCallbackProgress(singleMovingAverage);
                    }
                }

            }

        }
        var percentComplete = Math.round(((Date.now() - this._beginTime)/this.testLength)*100);
        this.clientCallbackPercentageComplete(percentComplete);
        //check for end of test
        if ((Date.now() - this._beginTime) > this.testLength) {
          this.endTest();
        }

    };
    /**
     * end test method
     */
     downloadHttpConcurrentProgress.prototype.endTest = function(){
       this._running = false;
       clearInterval(this.interval);
       if (this.downloadResults && this.downloadResults.length) {
           this.clientCallbackComplete(this.downloadResults);
       } else {
           this.clientCallbackError('no measurements obtained');
       }
       this.abortAll();
     }

    /**
     * reset test variables
     */
    downloadHttpConcurrentProgress.prototype.initiateTest = function(){
        this._testIndex = 0;
        this.finalResults.length=0;
        this._running = true;
        this.interval = null;
        this.downloadResults.length = 0;
        this.totalBytes = 0;
        this.start();
        var self = this;
        this.interval = setInterval(function () {
          self._monitor();
        }, this.monitorInterval);
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();
