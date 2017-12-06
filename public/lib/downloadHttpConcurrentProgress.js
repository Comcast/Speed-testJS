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
    function downloadHttpConcurrentProgress(urls,  type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackAbort,
                                            callbackTimeout, callbackError, size, progressIntervalDownload, monitorInterval) {
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
        //todo comment these variable.. so, people can understand
        this.prevDownloadSpeed = [];
        this.prevDownloadTime = [];
        this.currentDownloadSpeed = [];
        this.currentDownloadTime = [];
        this.actualSpeedArray = [];
        this.count = 0;
        this.performCalculationsInterval = 950;
        this.timerId;
    }

    /**
     * onError method
     * @return error object
     */
    downloadHttpConcurrentProgress.prototype.onTestError = function (result) {
      if (this._running) {
         if ((Date.now() - this._beginTime) > this.testLength) {
           this.endTest();
          }
          else{
            this._running = false;
            clearInterval(this.interval);
            this.clientCallbackError(result);
            this.abortAll();
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
                this.endTest();
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

        //todo needs to be removed and think of another alternative
        if (this.count === 0) {
            this.actualStartTime = result.startTime;
        }

        this.currentDownloadSpeed[result.id-1] = result.loaded;
        this.currentDownloadTime[result.id-1] = result.totalTime;

        // if (result.totalTime > this.performCalculationsInterval) {
        //     this._monitor();
        //     this.performCalculationsInterval += 1000;
        // }

        if (result.totalTime > this.performCalculationsInterval && !this.onceCalStarted) {
            console.log('Running timeout');
            this._monitor();
            this.onceCalStarted = true;
            // this.performCalculationsInterval += 1000;
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

            for (var g = 1; g <= this.concurrentRuns; g++) {
                this.currentDownloadSpeed[this._testIndex] = 0;
                this.currentDownloadTime[this._testIndex] = 0;
                this.prevDownloadSpeed[this._testIndex] = 0;
                this.prevDownloadTime[this._testIndex] = 0;
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
        var actualTotalSpeed = 0;

        for (var i = 0; i < this.concurrentRuns; i++) {
            var sampleBandwidth = this.currentDownloadSpeed[i] - this.prevDownloadSpeed[i];
            var time = Math.abs(this.currentDownloadTime[i] - this.prevDownloadTime[i]);
            // console.log('********' + ' bytes' + i + ':' +sampleBandwidth + ' time: ' +time + ' **************');
            if (sampleBandwidth !== 0 && time !== 0) {
                //TODO change these actualSpeed names to something meaningful
                var actualSpeed = calculateSpeedMbps(sampleBandwidth, time);
                actualTotalSpeed += actualSpeed;
                this.prevDownloadSpeed[i] = this.currentDownloadSpeed[i];
                this.prevDownloadTime[i] = this.currentDownloadTime[i];
            }
            //*** Needs to be removed ***
            if (time === 0) {
                //needs to be changed to max time of this.currentDownloadSpeed

                // var serverLocations = Object.keys(this.currentDownloadTime);
                //
                // var self = this;
                //
                // console.log(serverLocations);
                // serverLocations.sort(function (a, b) {
                //     console.log('a: ' +a  + 'b: ' +b);
                //     console.log(self.currentDownloadSpeed[a]);
                //     console.log(self.currentDownloadSpeed[b]);
                //     return self.currentDownloadTime[a] - self.currentDownloadTime[b]
                // });
                //
                // console.log(Object.keys(self.currentDownloadTime).reduce(function(a, b){ return self.currentDownloadTime[a] > self.currentDownloadTime[b] ? a : b }));

                var checkTime = Date.now() - this.actualStartTime;
                this.prevDownloadTime[i] = (Date.now() - this.actualStartTime);
            }

        }

        if (i === this.concurrentRuns) {
            console.log(' actualSpeed: ' +actualTotalSpeed);
            if (!isNaN(actualTotalSpeed)) {
                this.downloadResults.push(actualTotalSpeed);
                //FIXME we don't need .toFixed(2) here.. just for running automation test
                this.actualSpeedArray.push(+actualTotalSpeed.toFixed(2));
                this.clientCallbackProgress(actualTotalSpeed);
            }
        }

        //check for end of test
        if ((Date.now() - this._beginTime) > this.testLength) {
          this.endTest();
        }

        this.timerId = setTimeout(this._monitor.bind(this), 1000);

    };

    /**
     * end test method
     */
     downloadHttpConcurrentProgress.prototype.endTest = function(){
       this._running = false;
       clearTimeout(this.timerId);
    //    clearInterval(this.interval);
       if (this.downloadResults && this.downloadResults.length) {
           var arr = this.actualSpeedArray;
           //TODO needs to remove the above line not needed
           this.actualSpeedArray = this.actualSpeedArray.slice(3, this.actualSpeedArray.length);
           console.log(this.actualSpeedArray);
           var sum = this.actualSpeedArray.reduce(function (a, b) {
               return a + b;
           }, 0);
           var mean = sum / this.actualSpeedArray.length;
           console.log('mean: ' +mean);
           this.clientCallbackComplete(this.downloadResults);
       } else {
           this.clientCallbackError('no measurements obtained');
       }
       this.abortAll();
     };

    function calculateSpeedMbps(bytes, milliSeconds) {
        return bytes / (125 * milliSeconds);
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
        // var self = this;
        // this.interval = setInterval(function () {
        //   self._monitor();
        // }, this.monitorInterval);
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();
