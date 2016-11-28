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
     * Upload Bandwidth testing based on httpRequests
     * @param string server endpoint for upload testing
     * @param string post or get request
     * @param integer number of concurrentRuns
     * @param integer timeout of the request
     * @param integer length of the testLength
     * @param function callback function for test suite complete event
     * @param function callback function for test suite progress event
     * @param function callback function for test suite abort event
     * @param function callback function for test suite timeout event
     * @param function callback function for test suite error event
     * @param integer uploadSize of the request
     */
    function uploadHttpConcurrentProgress(url, type, concurrentRuns, timeout, testLength, callbackComplete, callbackProgress,
                                  callbackError, uploadSize) {
        this.url = url;
        this.type = type;
        this.uploadSize = uploadSize;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.clientCallbackComplete = callbackComplete;
        this.clientCallbackProgress = callbackProgress;
        this.clientCallbackError = callbackError;

        this.movingAverage = 10;
        //unique id or test
        this._testIndex = 0;
        //array holding all results
        this._results = [];
        //array holding all movong results
        this._finalResults = [];
        //array holding active tests
        this._activeTests = [];
        //start time of test suite
        this._beginTime = Date.now();
        //boolean on whether test  suite is running or not
        this._running = true;
        //object holding all test progress measurements
        this._progressResults = {};
        //count of progress events
        this._progressCount = 0;
        this.testResults = [];
    }

    /**
     * onTimeout method
     * @param object error object
     * @return error object
     */
    uploadHttpConcurrentProgress.prototype.onTestTimeout = function (error) {
        if (this._running) {
            this.clientCallbackError(error);
            this._running = false;
        }
    };

    /**
     * onAbort method
     * @param object error object
     * @return error object
     */
    uploadHttpConcurrentProgress.prototype.onTestAbort = function () {
        if (this._running) {
            if ((Date.now() - this._beginTime) > this.testLength) {
                if (this._finalResults && this._finalResults.length) {
                    this.clientCallbackComplete(this._finalResults);
                } else {
                    this.clientCallbackError('no measurements obtained');
                }
            }
            this._running=false;
        }
    };

    /**
     * onError method
     * @param object error object
     * @return error object
     */
    uploadHttpConcurrentProgress.prototype.onTestError = function (error) {
        if (this._running) {
            this.clientCallbackError(error);
            this._running = false;
        }
    };
    /**
     * onComplete method
     */
    uploadHttpConcurrentProgress.prototype.onTestComplete = function (result) {
        if (!this._running) {
            return;
        }

        //pushing results to an array
        this._results.push(result);
        //cancel remaining tests
        //for (var i = 0; i < this._activeTests.length; i++) {
        //    if (typeof(this._activeTests[i]) !== 'undefined') {
        //        this._activeTests[i].xhr._request.abort();
        //    }
        //}
        //reset Active Tests array
        this._activeTests.length =0;
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
            //this._progressCount = 0;
            this.start();
        }
        else {
            //check this._running flag again since it may have been reset in abort
            if (this._running) {
                this._running = false;
                if (this._finalResults && this._finalResults.length) {
                    this.clientCallbackComplete(this._finalResults);
                } else {
                    this.clientCallbackError('no measurements obtained');
                }
            }
        }
    };

    /**
     * calculateStats method
     */
    uploadHttpConcurrentProgress.prototype.calculateStats = function () {
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
        this._finalResults.push(totalMovingAverage);
    };

    /**
     * onProgress method
     */
    uploadHttpConcurrentProgress.prototype.onTestProgress = function (result) { // jshint ignore:line

        if (!this._running) {
            return;
        }

        //update progress count
        this._progressCount++;

        this.testResults.push(result.bandwidth);
        //populate array
        this._progressResults['arrayProgressResults' + result.id].push(result.bandwidth);
        //calculate moving average
        if (this._progressCount % this.movingAverage === 0) {
            var example = this.testResults.splice(0, 11);

            var singleMovingAverage = 0;
            for (var i = 0; i < this.movingAverage; i++) {
                singleMovingAverage += example[i];
            }

            if (isFinite(singleMovingAverage)) {
                var totalMovingAverage = singleMovingAverage/this.movingAverage;
                this.clientCallbackProgress(totalMovingAverage);
                this._finalResults.push(totalMovingAverage);
            }

        }
    };

    /**
     * Start the test
     */
    uploadHttpConcurrentProgress.prototype.start = function () {
        var request;

        if (!this._running) {
            return;
        }

        if (this.type === 'GET') {
            for (var g = 1; g <= this.concurrentRuns; g++) {
                this._testIndex++;

                this['arrayResults' + this._testIndex] = [];
                this._progressResults['arrayProgressResults' + this._testIndex] = [];
                request = new window.xmlHttpRequest('POST', this.url, this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
                    this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
                this._activeTests.push({
                    xhr: request,
                    testRun: this._testIndex
                });
                request.start(0, this._testIndex);

            }
        }
        else {
            for (var p = 1; p <= this.concurrentRuns; p++) {
                this._testIndex++;
                this['arrayResults' + this._testIndex] = [];
                this._progressResults['arrayProgressResults' + this._testIndex] = [];
                request = new window.xmlHttpRequest('POST', this.url, this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
                    this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
                this._activeTests.push({
                    xhr: request,
                    testRun: this._testIndex
                });

                request.start(this.uploadSize, this._testIndex);
            }
        }
    };

    /**
     * Cancel the test
     */
    uploadHttpConcurrentProgress.prototype.abortAll = function () {
        this._running = false;
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
    };

    /**
     * init test suite
     */
    uploadHttpConcurrentProgress.prototype.initiateTest = function () {
        this._testIndex = 0;
        this._results.length = 0;
        this._finalResults.length = 0;
        this._activeTests.length = 0;
        this._progressResults = {};
        this._progressCount = 0;
        this._running = true;
        this._beginTime = Date.now();
        this.start();
    };

    window.uploadHttpConcurrentProgress = uploadHttpConcurrentProgress;
})();