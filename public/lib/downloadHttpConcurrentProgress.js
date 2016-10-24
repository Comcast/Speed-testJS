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
                                            callbackTimeout, callbackError) {
        this.url = url;
        this.type = type;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        //unique id or test
        this._testIndex = 0;
        //array holding all results
        this._results = [];
        //array holding active tests
        this._activeTests = [];
        this._resultsHolder = {};
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
    }

    /**
     * onError method
     * @return error object
     */
    downloadHttpConcurrentProgress.prototype.onTestError = function (result) {
        if (this._running) {
            this.clientCallbackError(result);
            this._running = false;
        }
    };
    /**
     * onAbort method
     * @return abort object
     */
    downloadHttpConcurrentProgress.prototype.onTestAbort = function (result) {
        if (this._running) {
            this.clientCallbackAbort(result);
            this._running = false;
        }
    };
    /**
     * onTimeout method
     * @return timeout object
     */
    downloadHttpConcurrentProgress.prototype.onTestTimeout = function (result) {
        if (this._running) {
            this.clientCallbackTimeout(result);
            this._running = false;
        }
    };

    /**
     * onComplete method
     */
    downloadHttpConcurrentProgress.prototype.onTestComplete = function (result) {

        if (!this._running) {
            return;
        }
        //pushing results to an array
        this._results.push(result);

        this['arrayResults' + result.id];
        //remove requests from active test array
        this._activeTests.pop(result.id, 1);
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
            if (this._activeTests.length === 0 && this._running) {
                var singleMovingAverage = 0;
                for (var j = 1; j <= this.concurrentRuns; j++) {
                    singleMovingAverage += this._results[(this._results.length - j)].bandwidth;
                }
                this.finalResults.push(singleMovingAverage);
                this.clientCallbackProgress(singleMovingAverage);
                this.start();
            }
        }
        else {
            var total = 0;
            this._running = false;
            if (this.finalResults && this.finalResults.length) {
                this.clientCallbackComplete(this.finalResults);
            } else {
                this.clientCallbackError('no measurements obtained');
            }
            for (var i = 0; i < this._activeTests.length; i++) {
                if (typeof(this._activeTests[i]) !== 'undefined') {
                    this._activeTests[i].xhr._request.abort();
                }

            }
        }
    };

    /**
     * onProgress method
     */
    downloadHttpConcurrentProgress.prototype.onTestProgress = function (result) {
        //update progress count
        this._progressCount++;
        //populate array
        this._progressResults['arrayProgressResults' + result.id].push(result.bandwidth);

        //calculate moving average
        if (this._progressCount % this.movingAverage === 0) {
            //check if all test still running
            if (this._activeTests.length === this.concurrentRuns) {
                //loop thru active tests to calculate totalMovingAverage
                var totalMovingAverage = 0;
                for (var i = 0; i < this._activeTests.length; i++) {
                    if (typeof(this._activeTests[i]) !== 'undefined') {
                        // get array size and loop thru size of moving average series or array length
                        var lastElem = Math.min(this._progressResults['arrayProgressResults' + this._activeTests[i].testRun].length, this.movingAverage);
                        if (lastElem > 0) {
                            var singleMovingAverage = 0;
                            for (var j = 1; j <= lastElem; j++) {
                                if (isFinite(this._progressResults['arrayProgressResults' + this._activeTests[i].testRun][this._progressResults['arrayProgressResults' + this._activeTests[i].testRun].length - j])) {
                                    singleMovingAverage = singleMovingAverage + this._progressResults['arrayProgressResults' + this._activeTests[i].testRun][this._progressResults['arrayProgressResults' + this._activeTests[i].testRun].length - j];

                                }
                            }
                            singleMovingAverage = singleMovingAverage / lastElem;
                        }

                        totalMovingAverage = totalMovingAverage + singleMovingAverage;
                    }

                }
                this.clientCallbackProgress(totalMovingAverage);
                this.finalResults.push(totalMovingAverage);
            }
        }
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
                this._progressResults['arrayProgressResults' + this._testIndex] = new Array();
                var request = new window.xmlHttpRequest('GET', [this.url, '?', Date.now()].join(''), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
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
        this._running = false;
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
    };

    window.downloadHttpConcurrentProgress = downloadHttpConcurrentProgress;
})();