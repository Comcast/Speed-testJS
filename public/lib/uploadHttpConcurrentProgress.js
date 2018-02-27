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
     * upload testing based on httpRequests.
     * @param urls - array of url to server endpoint for upload testing.
     * @param type - post request.
     * @param concurrentRuns - number of concurrentRuns.
     * @param timeout - timeout of the request.
     * @param testLength - length of the upload test.
     * @param movingAverage - when to calculate moving average.
     * @param callbackComplete - function callback function for test suite complete event.
     * @param callbackProgress - function callback function for test suite progress event.
     * @param callbackAbort - function callback function for test suite abort event.
     * @param callbackTimeout - function callback function for test suite timeout event.
     * @param callbackError - function callback function for test suite error event.
     * @param size - initial size to start upload testing.
     * @param maxuploadSize - upload size should not exceed max upload size.
     * @param monitorInterval - monitor interval.
     */
    function uploadHttpConcurrentProgress(urls, type, concurrentRuns, timeout, testLength, movingAverage, callbackComplete, callbackProgress, callbackError, size, maxuploadSize,
                                          monitorInterval, isMicrosoftBrowser) {
        this.urls = urls;
        this.size = 50000;
        this.type = type;
        this.concurrentRuns = 4;
        this.timeout = timeout;
        this.testLength = testLength;
        this.movingAverage = movingAverage;
        this.maxuploadSize = maxuploadSize;
        this.monitorInterval = 200;
        //unique id or test
        this._testIndex = 0;
        //number of completed requestTimeout
        this.completedRequests = 0;
        //array holding active tests
        this._activeTests = [];
        this.clientCallbackComplete = callbackComplete;
        this.clientCallbackProgress = callbackProgress;
        this.clientCallbackError = callbackError;
        //start time of test suite
        this._beginTime = performance.now();
        //boolean on whether test  suite is running or not
        this._running = true;
        //array holding  results
        this.finalResults = [];
        //monitor interval
        this.interval = null;
        //total probe bytes
        this.totalBytes = 0;
        //total chunk totalBytes
        this.totalChunckBytes = 0;
        //results object array
        this.results = [];
        //results count
        this.resultsCount = 0;
        //initializing the random data used for testing upload
        this._payload = null;
        this.uploadResults = [];
        //boolean to see if the client is running the on microsoft browse
        this.isMicrosoftBrowser = isMicrosoftBrowser;
        //upload size for low bandwidth clients(microsoft browsers)
        this.lowBandwidthUploadSize = 200000;
        //upload size for high bandwidth clients(microsoft browsers)
        this.highBandwidthUploadSize = 5000000;
        //upload threshold value
        this.uploadThresholdValue = 0;
        //results object array
        this.resultsMb = [];
        // fistCheck
        this.firstCheck = false;
        //results interval bandwidth
        this.resultsIntervalMb = [];
        //interval counter
        this.intervalCounter = 0;
      }

    /**
     * onError method
     * @return error object
     */
      uploadHttpConcurrentProgress.prototype.onTestError = function(result) {// jshint ignore:line
        this.completedRequests++;
        if (this._running) {
          if ((performance.now() - this._beginTime) < this.testLength) {
            this.newRequests(1);
          }
        }

    };
    /**
     * onAbort method
     * @return abort object
     */
    uploadHttpConcurrentProgress.prototype.onTestAbort = function(result) {// jshint ignore:line

    };
    /**
     * onTimeout method
     * @return timeout object
     */
    uploadHttpConcurrentProgress.prototype.onTestTimeout = function() {

    };

    /**
     * onComplete method
     */
      uploadHttpConcurrentProgress.prototype.onTestComplete = function(result) {
        if (!this._running) {
          return;
        }
        this.completedRequests++;
        this.totalChunckBytes = this.totalChunckBytes + result.chunckLoaded;
        this._storeResults(result);
        var bandwidthMbs = ((this.totalChunckBytes * 8) / 1000000) / ((performance.now() - this._beginTime) / 1000);
        this.resultsMb.push(bandwidthMbs);
        this.resultsIntervalMb.push(bandwidthMbs);
        this.clientCallbackProgress(bandwidthMbs);
        this.newRequests(1);
      };


    /**
     * onProgress method
     */
      uploadHttpConcurrentProgress.prototype.onTestProgress = function(result) {
        if (!this._running) {
          return;
        }
        this._storeResults(result);
        this.totalChunckBytes = this.totalChunckBytes + result.chunckLoaded;
        this._storeResults(result);
        var bandwidthMbs = ((this.totalChunckBytes * 8) / 1000000) / ((performance.now() - this._beginTime) / 1000);
        this.resultsMb.push(bandwidthMbs);
        this.resultsIntervalMb.push(bandwidthMbs);
        this.clientCallbackProgress(bandwidthMbs);
      };

    /**
     * Start the test
     */
    uploadHttpConcurrentProgress.prototype.newRequests = function(number) {
      var request;
      if (!this._running) {
        return;
      }


      if (this._payload === null) {
        this._payload = getRandomData(this.size);
      } else {

        if (this._payload.size !== this.size) {
          this._payload = getRandomData(this.size);
        }
      }

      for (var p = 1; p <= number; p++) {
        this._testIndex++;
        request = new window.xmlHttpRequest('POST', this.urls[0] + '?r=' + performance.now(), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
          this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
        this._activeTests.push({
          xhr: request,
          testRun: this._testIndex
        });

        request.start(this._payload.size, this._testIndex, this._payload);
      }


    };


    /**
     * Start the test
     */
    uploadHttpConcurrentProgress.prototype.start = function() {
        var request;
        if (!this._running) {
            return;
        }

        if (this._payload === null) {
            this._payload = getRandomData(this.size);
        } else {

            if (this._payload.size !== this.size) {
                this._payload = getRandomData(this.size);
            }
        }

        for (var p = 1; p <= this.concurrentRuns; p++) {
            this._testIndex++;
            request = new window.xmlHttpRequest('POST', this.urls[0] + '?r=' + performance.now(), this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
                this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
            this._activeTests.push({
                xhr: request,
                testRun: this._testIndex
            });

            request.start(this.size, this._testIndex, this._payload);
        }


    };

    /**
     * Cancel the test
     */
    uploadHttpConcurrentProgress.prototype.abortAll = function() {
        clearInterval(this.interval);
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
              this._activeTests[i].xhr._request.abort();
              this._activeTests[i].xhr._request = null;
            }
        }
    };

    /**
     * store speedtest measurements
     * @param result
     * @private
     */
    uploadHttpConcurrentProgress.prototype._storeResults = function(result) {
      this.results.push(result);
    };

    /**
     * end of test
     */
    uploadHttpConcurrentProgress.prototype.endTest = function() {
      this._running = false;
      this.abortAll();
      var finalArray;
      if (this.resultsMb.length > 10) {
        var dataLength = this.resultsMb.length;
            var data = slicing(this.resultsMb, Math.round(dataLength * 0.75), dataLength);
            data = data.sort(numericComparator);
            var result = meanCalculator(data);
            this.clientCallbackComplete(result);
        //finalArray = this.resultsMb.slice(Math.round(this.resultsMb.length * .75), this.resultsMb.length - 1);
        //console.log(this.resultsMb);
        //console.log(finalArray);
      } else {
        this.clientCallbackError('no measurements obtained');
        return;
      }
      /*
      var sum = finalArray.reduce(function(a, b) {
        return a + b;
      });
      var avg = sum / finalArray.length;
      this.clientCallbackComplete(avg);
      */
      clearInterval(this.interval);

    };
    /**
     * Monitor testSeries
     */
    uploadHttpConcurrentProgress.prototype._monitor = function() {
      this.intervalCounter++;
      if (this.resultsIntervalMb.length > 0) {
        var sum = this.resultsIntervalMb.reduce(function(a, b) {
          return a + b;
        });
        var avg = sum / this.resultsIntervalMb.length;
        console.log('interval Bandwidth: ' + avg);
        this.resultsIntervalMb.length = 0;
      }
      console.log(this.intervalCounter + '  ' + this.completedRequests + '  ' + this._testIndex + ' '  +this.intervalCounter*4);
        if(this.completedRequests>(this.intervalCounter*4)){
          this.size = this.size*1.1;
          if(this.size>10000000){
            this.size = 10000000;
          }
          if(this.completedRequests>(this.intervalCounter*20)){
            //high bandwidth client
            this.size = 10000000;
          }

        }


      //check for end of test
      if ((performance.now() - this._beginTime) > this.testLength) {
        clearInterval(this.interval);

        this.endTest();
      }
    };

    /**
     * check to increase size and or connections
     */

    uploadHttpConcurrentProgress.prototype.shouldIncreaseSize = function() {
        if (this.isMicrosoftBrowser) {

          if (!this.isMaxUploadSize) {
            if (this.uploadResults[this.uploadResults.length - 1] > this.uploadThresholdValue) {
              //TODO need to dynamically increase the size.. may be look at the requests completed or the uploadSpeed
              this.isMaxUploadSize = true;
              //upload size used for high bandwidth clients of microsoft browsers
              this.size = this.highBandwidthUploadSize/10;
            } else {
              //upload size used for low bandwidth clients of microsoft browsers
              this.size = this.lowBandwidthUploadSize/10;
            }
          }

        } else {
          //var uploadSize = (this.testLength - result.time) * result.loaded / result.time;
          var uploadSize = (this.testLength - (performance.now() / 1000)) * this.totalChunckBytes / parseInt(performance.now() - this._beginTime);
          uploadSize = uploadSize;
          if (uploadSize > this.size) {
            this.size = uploadSize/10;
            if (this.size > this.maxuploadSize) {
              this.size = this.maxuploadSize/10;
            }
          }
        }
    }

    /**
     * reset test variables
     */
    uploadHttpConcurrentProgress.prototype.initiateTest = function() {
      this._testIndex = 0;
      this.finalResults.length = 0;
      this.uploadResults.length = 0;
      this._running = true;
      this.interval = null;
      this.totalBytes = 0;
      this.totalChunckBytes = 0;
      this._payload = null;
      this.resultsMb.length = 0;
      this.resultsIntervalMb.length = 0;
      this.firstCheck = false;
      this.intervalCounter = 0;
      this.completedRequests = 0;
      this.interval = setInterval(function() {
        self._monitor();
      }, this.monitorInterval);
      this.start();
      var self = this;

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
        blob = new Blob([result], {
          type: "application/octet-stream"
        });
      } catch (e) {
        var bb = new BlobBuilder; // jshint ignore:line
        bb.append(result);
        blob = bb.getBlob("application/octet-stream");
      }
      console.log(blob.size);
      return blob;
    }

    //TODO will be moved to a seperate file
    function slicing(data, start, end) {
      return data.slice(start, end);
    }

    function meanCalculator(arr) {
      var peakValue = arr[arr.length - 1];
      var sum = arr.reduce(function(a, b) {
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

    window.uploadHttpConcurrentProgress = uploadHttpConcurrentProgress;
  })();
