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
     * upload testing based on httpRequests
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
    function uploadHttpConcurrentProgress(urls,  type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackAbort,
                                            callbackTimeout, callbackError, size, progressIntervalupload, maxuploadSize,
                                            maxConcurrentRuns, monitorInterval) {
        this.urls = urls;
        this.size = size;
        this.type = type;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        this.progressIntervalupload = progressIntervalupload;
        this.maxuploadSize = 10000000;
        this.maxConcurrentRuns = maxConcurrentRuns;
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
      //initializing the random data used for testing upload
      this._payload = null;

    }

    /**
     * onError method
     * @return error object
     */
    uploadHttpConcurrentProgress.prototype.onTestError = function (result) {
      console.log('onTestError');
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
    uploadHttpConcurrentProgress.prototype.onTestAbort = function (result) {
      console.log('onTestAbort');
      this._storeResults(result);
        this.totalBytes = this.totalBytes + result.loaded;
    };
    /**
     * onTimeout method
     * @return timeout object
     */
    uploadHttpConcurrentProgress.prototype.onTestTimeout = function () {
      console.log('onTestProgress');
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
    uploadHttpConcurrentProgress.prototype.onTestComplete = function (result) {
      console.log('onTestComplete');
        if (!this._running) {
            return;
        }

        //store results
        this._storeResults(result);
        this._activeTests.pop(result.id-1);
        //checking if we can continue with the test
        if ((Date.now() - this._beginTime) < this.testLength) {
            this.totalBytes = this.totalBytes + result.loaded;
          /*
          if(((this.testLength - result.time) * result.loaded / result.time) > this.size) {
                this.size = (this.testLength - result.time) * result.loaded / result.time;
            };
            */
          //this.size = this.size *2;
          this.concurrentRuns = this.concurrentRuns*2;
        }
        if(this.size>this.maxuploadSize){
            this.size = this.maxuploadSize;
        }
        if(this.concurrentRuns > 10){
          this._payload = this._payload + this._payload + this._payload+ this._payload + this._payload;
            this.concurrentRuns = 1;
        }
        if(this._activeTests.length<20) {
          this.start();
        }
    };



    /**
     * onProgress method
     */
    uploadHttpConcurrentProgress.prototype.onTestProgress = function (result) {
      console.log('onTestProgress');
        if (!this._running) {
            return;
        }
        this.totalBytes = this.totalBytes + result.loaded;
        this._storeResults(result);

    };

    /**
     * Start the test
     */
    uploadHttpConcurrentProgress.prototype.start = function () {
      var request;
      if (!this._running) {
            return;
        }

        for (var p = 1; p <= this.concurrentRuns; p++) {
            this._testIndex++;
            this['arrayResults' + this._testIndex] = [];
            request = new window.xmlHttpRequest('POST', this.urls[0], this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
              this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
            this._activeTests.push({
                xhr: request,
                testRun: this._testIndex
            });

            if (this._payload === null) {
              this._payload = getRandomString(this.size);
            }else {

              if(this._payload.size!==this.size){

                    this._payload = getRandomString(this.size);


              }
            }

            request.start(this.size, this._testIndex, this._payload);
        }


    };

  function getRandomString(size){

      var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
      var randomstring = '';
      for (var i=0; i<size; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum,rnum+1);
      }
      return randomstring;

  }


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



    /**
     * Cancel the test
     */
    uploadHttpConcurrentProgress.prototype.abortAll = function () {

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
    uploadHttpConcurrentProgress.prototype._storeResults = function (result) {
        this.results.push(result);
    };

    uploadHttpConcurrentProgress.prototype._calculateResults = function(){
      var intervalBandwidth=0;
      var totalLoaded = 0;
      var totalTime = 0;
      var intervalCounter = 0;
      this.resultsCount++;
      if(this.results.length>0) {

        for (var i = 0; i < this.results.length; i++) {
          if (this.results[i].timeStamp > (Date.now() - this.monitorInterval)) {
            intervalBandwidth = intervalBandwidth + parseFloat(this.results[i].bandwidth);
            totalLoaded = totalLoaded + this.results[i].chunckLoaded;
            totalTime = totalTime + this.results[i].totalTime;
            intervalCounter++;
          }
        }

        if(!isNaN(intervalBandwidth/intervalCounter)) {

          var transferSizeMbs = (totalLoaded * 8) / 1000000;
          var transferDurationSeconds = this.monitorInterval/1000;
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
            this.finalResults.push(singleMovingAverage);
            this.clientCallbackProgress(singleMovingAverage);
          }

        }

      }
    };


    /**
     * Monitor testSeries
     */
    uploadHttpConcurrentProgress.prototype._monitor = function () {

      console.log('interval: ' + (Date.now() - this._beginTime));
      this._calculateResults();
        //check for end of test
        if ((Date.now() - this._beginTime) > (this.testLength)) {

            this._running = false;
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
    uploadHttpConcurrentProgress.prototype.initiateTest = function(){
      this._testIndex = 0;
        this.finalResults.length=0;
        this._running = true;
        this.interval = null;
        this.totalBytes = 0;
      this.interval = setInterval(function () {
        self._monitor();
      }, 100);
        this.start();
        var self = this;

    };

    window.uploadHttpConcurrentProgress = uploadHttpConcurrentProgress;
})();