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
   * DownloadProbe test to get sizes for download testing
   * @param string server endpoint for upload testing
   * @param boolean whether  latency conditions
   * @param integer length of the testLength
   * @param integer size of the download request
   * @param function callback function for test suite complete event
   * @param function callback function for test suite error event
   **/
   function downloadProbeTest(url, dataUrl,lowLatency, timeout,size, callbackComplete,callbackError) {
     this.dataUrl = dataUrl;
     this.probeTestUrl = url+ '?bufferSize=' + size + '&time=0&sendBinary=true&lowLatency=' + lowLatency;
     this.lowLatency = lowLatency;
     this.timeout = timeout;
     this.size = size;
     //id of request
     this._testIndex = 0;
     //array holding active tests
     this._activeTests = [];
      //boolean on whether test  suite is running or not
     this._running = true;
     this.clientCallbackComplete = callbackComplete;
     this.clientCallbackError = callbackError;
     //probe timeout call
     this.probeTimeout = 1000;
     //monitor interval
     this.interval=null;
   }

   /**
   * Execute the request
   */
   downloadProbeTest.prototype.start = function () {
     this._test = new window.xmlHttpRequest('GET', this.probeTestUrl+ '&r=' + Math.random(), this.timeout, this.onTestComplete.bind(this),
     this.onTestProgress.bind(this),this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
     this._testIndex++;
     this._running=true;
     this._test.start(0, this._testIndex);
     this._activeTests.push({
       xhr: this._test,
       testRun: this._testIndex
     });
     var self = this;
     this.interval = setInterval(function () {
       self._monitor();
     }, 100);
   };

   /**
   * onError method
   * @param error object
   */
   downloadProbeTest.prototype.onTestError = function (result) {
     clearInterval(this.interval);
     this.clientCallbackError(result);
   };

   /**
   * onAbort method
   * @param abort object
   */
   downloadProbeTest.prototype.onTestAbort = function (result) {
     clearInterval(this.interval);
       if(this._running){
            this.clientCallbackError(result);
        }
   };

   /**
   * onTimeout method
   * @param timeout object
   */
   downloadProbeTest.prototype.onTestTimeout = function (result) {
     clearInterval(this.interval);
     this.clientCallbackError(result);
   };

   /**
   * onComplete method
   * @param probe object
   */
   downloadProbeTest.prototype.onTestComplete = function (result) {
      clearInterval(this.interval);
      var self =this;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            self._running=false;
            var data = JSON.parse(xhr.responseText);
            self.clientCallbackComplete(data);
          }
      };
      var requestTimeout;
      requestTimeout = setTimeout(xhr.abort.bind(xhr), this.probeTimeout);
      xhr.abort = function(){
       self.clientCallbackError(result);
       clearTimeout(requestTimeout);
      };
       xhr.open('GET', this.dataUrl+ '?bufferSize=' + this.size + '&time='+result.time+'&sendBinary=false&lowLatency=' + this.lowLatency+'&r=' + Math.random(), true);
       xhr.send(null);
   };

   /**
   * onProgress method
   * @param  result
   */
   downloadProbeTest.prototype.onTestProgress = function(result){ // jshint ignore:line
        //process result if you want to use this function
   };

   /**
   * Cancel the test
   */
     downloadProbeTest.prototype.abortAll = function() {
       this._running = false;
       for(var i=0;i<this._activeTests.length;i++){
         if (typeof(this._activeTests[i])!== 'undefined') {
           this._activeTests[i].xhr._request.abort();
         }
       }
     };

    /**
     * Monitor testSeries
     */
    downloadProbeTest.prototype._monitor = function () {
      if ((Date.now() - this._beginTime) > (this.timeout)) {
        this.clientCallbackError('probe timed out.');
        clearInterval(this.interval);
        this.abortAll();
      }
    };

   window.downloadProbeTest = downloadProbeTest;

 })();

