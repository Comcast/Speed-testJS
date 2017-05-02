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
    function uploadHttpMicrosoft(url, type, concurrentRuns, timeout, testLength, movingAverage, uiMovingAverage, callbackComplete, callbackProgress,
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

        this.movingAverage = movingAverage;
        //movingAverage to display the values in the UI
        this.uiMovingAverage = uiMovingAverage;
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
        //progressCount for tracking for UI
        this.uiProgressCount = 0;
        //flag on whether to collect measurements-All request need to be running at the same time
        this._collectMovingAverages = false;
        //initializing the random data used for testing upload
        this._payload = null;
        //monitor interval
        this.interval = null;
    }

    /**
     * onTimeout method
     * @param object error object
     * @return error object
     */
    uploadHttpMicrosoft.prototype.onTestTimeout = function (error) {
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
    uploadHttpMicrosoft.prototype.onTestAbort = function () {
        if (this._running) {
            if ((Date.now() - this._beginTime) > this.testLength) {
                if (this._finalResults && this._finalResults.length) {
                    this.clientCallbackComplete(this._finalResults);
                } else {
                    this.clientCallbackError('no measurements obtained');
                }
                this._running = false;
            }
        }
    };

    /**
     * onError method
     * @param object error object
     * @return error object
     */
    uploadHttpMicrosoft.prototype.onTestError = function (error) {
        if (this._running) {
            this.clientCallbackError(error);
            this._running = false;
        }
    };
    /**
     * onComplete method
     */
    uploadHttpMicrosoft.prototype.onTestComplete = function (result) {
        if (!this._running) {
            return;
        }
        this._collectMovingAverages = false;

        //if request complete and no progress events then report bandwidth to ui and store results
        if((this.concurrentRuns===1)&&(this._progressCount === 0)) {
            this.clientCallbackProgress(result.bandwidth);
            this._finalResults.push(result.bandwidth);
        }

        //cancel remaining tests
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
        //reset Active Tests array
        this._activeTests.length = 0;
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
            this._progressCount = 0;
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
    uploadHttpMicrosoft.prototype.calculateStats = function () {
        //loop thru active tests to calculate totalMovingAverage
        var totalMovingAverage = 0;
        for (var i = 0; i < this.concurrentRuns; i++) {
            // get array size and loop thru size of moving average series or array length
            var id = this._testIndex - i;
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

        if (this.uiProgressCount % this.uiMovingAverage === 0) {
            this.updateUi();
        }

        this._finalResults.push(totalMovingAverage);
    };

    /**
     * updateUI method
     */
    uploadHttpMicrosoft.prototype.updateUi = function () {
        var lastElem = Math.min(this._finalResults.length, this.movingAverage);
        if (lastElem > 0) {
            var singleMovingAverage = 0;
            for (var j = 1; j <= lastElem; j++) {
                singleMovingAverage = singleMovingAverage + this._finalResults[this._finalResults.length - j];

            }
            singleMovingAverage = singleMovingAverage / lastElem;
            this.clientCallbackProgress(singleMovingAverage);
        }
    };

    /**
     * onProgress method
     */
    uploadHttpMicrosoft.prototype.onTestProgress = function (result) {

        if (!this._running) {
            return;
        }

        if (!this._collectMovingAverages) {
            return;
        }

        //update progress count
        this._progressCount++;
        this.uiProgressCount++;
        //populate array
        this._progressResults['arrayProgressResults' + result.id].push(result.bandwidth);
        //calculate moving average
        if (this._progressCount % this.movingAverage === 0) {
            this.calculateStats();
        }
    };

    /**
     * Start the test
     */
    uploadHttpMicrosoft.prototype.start = function () {
        var request;

        if (!this._running) {
            return;
        }

        if (this._payload === null) {
            this._payload = getRandomData(this.uploadSize);
        } else {
            if (this._payload.size !== this.uploadSize) {
                this._payload = getRandomData(this.uploadSize);
            }
        }

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

            request.start(this.uploadSize, this._testIndex, this._payload);
        }
        this._collectMovingAverages = true;
    };

    /**
     * Cancel the test
     */
    uploadHttpMicrosoft.prototype.abortAll = function () {
        this._running = false;
        clearInterval(this.interval);
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
    };

    /**
     * Monitor testSeries
     */
    uploadHttpMicrosoft.prototype._monitor = function () {
        if ((Date.now() - this._beginTime) > (this.testLength)) {
            clearInterval(this.interval);
            this._running = false;
            this._collectMovingAverages = false;
            clearInterval(this.interval);
            if (this._finalResults && this._finalResults.length) {
                var uploadResults = this._finalResults;
                var dataLength = uploadResults.length;
                var data = slicing(uploadResults, Math.round(dataLength * 0.3), Math.round(dataLength * 0.9));
                data = data.sort(numericComparator);
                var result = meanCalculator(data);
                this.clientCallbackComplete(result);
            } else {
                this.clientCallbackError('no measurements obtained');
            }
            this.abortAll();
        }
    };

    /**
     * init test suite
     */
    uploadHttpMicrosoft.prototype.initiateTest = function () {
        this._testIndex = 0;
        this._results.length = 0;
        this._finalResults.length = 0;
        this._activeTests.length = 0;
        this._progressResults = {};
        this._progressCount = 0;
        this.uiProgressCount = 0;
        this._running = true;
        this._collectMovingAverages = false;
        this._payload = null;
        this._beginTime = Date.now();
        this.interval = null;
        this.start();
        var self = this;
        this.interval = setInterval(function () {
            self._monitor();
        }, 100);
    };

    /**
     * getRandomData creates a random data used for testing the upload bandwidth.
     * @param size - creates a blob of the given size.
     * @returns {*}
     */
    function getRandomData(size) {

        function getData() {
            return Math.random().toString();
        }

        var count = size / 2;
        var result = getData();

        while (result.length <= count) {
            result += getData();
        }

        result = result + result.substring(0, size - result.length);
        var blob;
        try {
            blob = new Blob([result], {type: "application/octet-stream"});
        } catch (e) {
            var bb = new BlobBuilder; // jshint ignore:line
            bb.append(result);
            blob = bb.getBlob("application/octet-stream");
        }
        return blob;
    }

    //TODO will be moved to a seperate file
    function slicing(data, start, end) {
        return data.slice(start, end);
    }

    function meanCalculator(arr) {
        var peakValue = arr[arr.length - 1];
        var sum = arr.reduce(function (a, b) {
            return a + b;
        }, 0);
        var mean = sum / arr.length;
        return {
            mean: mean,
            peakValue: peakValue
        };
    }

    function numericComparator(a, b) {
        return (a - b);
    }

    window.uploadHttpMicrosoft = uploadHttpMicrosoft;
})();
