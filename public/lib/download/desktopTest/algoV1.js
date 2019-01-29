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

(function() {
    'use strict';
    /**
     * 
     * @param {*} urls - urls to run the download test.
     * @param {*} size - size required to run the test.
     * @param {*} threads - number of parallel http requests.
     * @param {*} duration - length of the test.
     * @param {*} intervalTimer - monitor interval to calculate download bandwidth.
     * @param {*} callbackProgress - progress event to track the test for every interval.
     * @param {*} callbackComplete - event that reports the end results.
     * @param {*} callbackError - event that reports the cause of any error.
     */
    function algoV1(urls, size, threads, duration, intervalTimer, 
            callbackProgress, callbackComplete, callbackError) {

        this.urls = urls;
        this.size = size;
        this.threads = threads;
        this.duration = duration;
        this.intervalTimer = intervalTimer;
        this.callbackProgress = callbackProgress;
        this.callbackComplete = callbackComplete;
        this.callbackError = callbackError;
    }

    algoV1.prototype.initiateTest = function() {
        this.activeTests = [];
        this.totalBytesTransferred = [];
        this.totalTime = [];
        this.prevBytesTransferred = [];
        this.prevTime = [];
        this.downloadResults = [];
        this.timedOutReqCount = 0;

        // TODO items to be removed
        this.smaCount = 0;
        this.smaMean = 0;
        // Remove above items

        this.reportUIValue = 4;
        this.desktopTest = true;    // can be removed once this is the only algorithm we are using
        this.testId = null;

        this.startTime = timer();
        this.startDownloadTest();
        this.intervalId = setInterval(this.monitor.bind(this), this.intervalTimer);
    }


    algoV1.prototype.startDownloadTest = function() {
        for (var i = 0; i < this.threads; i++) {
            this.testId = i;
            this.start();
        }
    }

    algoV1.prototype.start = function() {
        this.createRequest();
        this.initializeBucketsForEachReq();
    }

    algoV1.prototype.createRequest = function() {
        // Calling the xmlhttprequest to create the http connection.
        var request = new window.xmlHttpRequest('GET', this.urls[this.testId]+ this.size +  '&r=' + Math.random(),
        this.duration, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
        this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this),
        null, this.desktopTest);
        request.start(0, this.testId);
        this.activeTests.push({
            xhr: request,
        });
    }

    algoV1.prototype.initializeBucketsForEachReq = function() {
        // Setting timers and bytes download for each thread.
        this.totalBytesTransferred[this.testId] = 0;
        this.totalTime[this.testId] = 0;
        this.prevBytesTransferred[this.testId] = 0;
        this.prevTime[this.testId] = 0;
    }

    algoV1.prototype.onTestComplete = function(event) {
        // FUTURE - Track the number of events get completed during the test
        // Once a request is finished/completed. We try to start a new request using the same Id,
        // maintaing the number of requests same all the time.
        this.testId = event.id;
        this.start();
    }

    algoV1.prototype.onTestProgress = function(event) {
        this.totalBytesTransferred[event.id] += event.chunckLoaded;
        this.totalTime[event.id] = event.totalTime;
    }

    algoV1.prototype.onTestAbort = function() {
        // TODO we can add get the bandwdith for last interval
    }

    algoV1.prototype.onTestTimeout = function() {
        this.timedOutReqCount++;
        if (this.timedOutReqCount === this.threads) {
            this.stopTest();
        }
    }

    algoV1.prototype.onTestError = function(event) {
        this.callbackError(event)
    }

    algoV1.prototype.monitor = function() {
        if (testRunTime(this.startTime) > this.duration) {
            this.stopTest();
            return;
        }

        this.calcIntervalSpeed();
    }

    algoV1.prototype.calcIntervalSpeed = function() {
        this.curSpeed = 0
        for (var j = 0; j < this.threads; j++) {
            var bytesTransferred = this.totalBytesTransferred[j] - this.prevBytesTransferred[j];
            var time = this.totalTime[j] - this.prevTime[j];

            if (bytesTransferred !== 0 || time !== 0) {
                var speed = calculateSpeedMbps(bytesTransferred, time);
                this.curSpeed += speed;
                this.prevBytesTransferred[j] = this.totalBytesTransferred[j];
                this.prevTime[j] = this.totalTime[j];
            }

        }
        this.downloadResults.push(+this.curSpeed.toFixed(2));
        this.reportIntervalSpeed();
    }

    algoV1.prototype.reportIntervalSpeed = function() {
        if (this.downloadResults.length < this.reportUIValue) {
            this.callbackProgress(this.curSpeed);
            return;
        }
        this.callbackProgress(simpleMovingAverage.call(this));
    }

    algoV1.prototype.stopTest = function() {

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        abortAllRequests.call(this);
        this.callbackComplete({
            "downloadSpeed": this.smaMean,
            "dataPoints": this.downloadResults
        });
    }

    window.algoV1 = algoV1;

})();
