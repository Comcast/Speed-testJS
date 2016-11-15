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
   function downloadProbeTest(url, lowLatency, timeout,size, callbackComplete,callbackError) {
     this.url = url;
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
   }

   /**
   * Execute the request
   */
   downloadProbeTest.prototype.start = function () {
     var cachebuster = Date.now();
     this._test = new window.xmlHttpRequest('GET', [this.url, '&', cachebuster].join(''), this.timeout, this.onTestComplete.bind(this),
     this.onTestProgress.bind(this),this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
     this._testIndex++;
     this._running=true;
     this._test.start(0, this._testIndex);
     this._activeTests.push({
       xhr: this._test,
       testRun: this._testIndex
     });
   };

   /**
   * onError method
   * @param error object
   */
   downloadProbeTest.prototype.onTestError = function (result) {
     this.clientCallbackError(result);
   };

   /**
   * onAbort method
   * @param abort object
   */
   downloadProbeTest.prototype.onTestAbort = function (result) {
       if(this._running){
            this.clientCallbackError(result);
        }
   };

   /**
   * onTimeout method
   * @param timeout object
   */
   downloadProbeTest.prototype.onTestTimeout = function (result) {
     this.clientCallbackError(result);
   };

   /**
   * onComplete method
   * @param probe object
   */
   downloadProbeTest.prototype.onTestComplete = function (result) {
      var self =this;
      var xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            self._running=false;
            var data = JSON.parse(xhr.responseText);
            self.clientCallbackComplete(data);
          }
      };
      xhr.open('GET', '/downloadProbe?bufferSize='+this.size+'&time='+result.time+'&lowLatency=true', true);
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


   window.downloadProbeTest = downloadProbeTest;

 })();
//Example on how to call
/*
 function downloadProbeTestOnComplete(result){
   console.dir(result);
 }
 function downloadProbeTestOnError(result){
   console.dir(result);
 }

 var downloadProbeTestRun = new window.downloadProbeTest('/download?bufferSize=762939', false, 3000,762939,downloadProbeTestOnComplete,
 downloadProbeTestOnError);
 downloadProbeTestRun.start();
 setTimeout(downloadProbeTestRun.abortAll().bind(downloadProbeTestRun),10);
*/
