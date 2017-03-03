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
  * extend XMLHttpRequest
  * @param string method post or get request
  * @param stirng url address for request
  * @param integer timeout timeout for request
  * @param function callback for onloaded function
  * @param function callback for onprogress function
  */
  function xmlHttpRequest(method, url, timeout, callbackComplete, callbackProgress,callbackAbort,
  callbackTimeout,callbackError, progressIntervalDownload){
    this.method = method;
    this.url = url;
    this.timeout = timeout;
    this.startTime = null;
    this.endTime = null;
    this.bandwidth = null;
    this.latency = 0;
    this.id=null;
    this.prevTime = 0;
    this.prevLoad = 0;
    this.progressCount = 0;
    this.totalBytes = 0;
    this.currentTime = 0;
    this.progressIntervalDownload = progressIntervalDownload;
    this.progressIntervalUpload = 25;
    this.callbackComplete = callbackComplete;
    this.callbackProgress = callbackProgress;
    this.callbackAbort = callbackAbort;
    this.callbackTimeout = callbackTimeout;
    this.callbackError = callbackError;
    this.requestTimeout = null;
    this._request = null;
  }

  /**
   * Initiate the request
   */
  xmlHttpRequest.prototype._initiateRequest = function(){

      if (this._request === null ||
       typeof this._request === 'undefined') {
       this._request = new XMLHttpRequest();
       // Handle lifecycle events on wrapped request
       this._request.onloadstart = this._handleLoadstart.bind(this);
       this._request.onload = this._handleLoad.bind(this);
       this._request.onabort = this._handleAbort.bind(this);
       this._request.timout = this._handleTimeout.bind(this);
       this.requestTimeout= setTimeout(this._request.abort.bind(this._request), this.timeout);
       this._request.onerror = this._handleError.bind(this);
       this._request.onreadystatechange = this._handleOnReadyStateChange.bind(this);
       if(this.method==='GET') {
          this._request.onprogress = this._handleOnProgressDownload.bind(this);
        }
        else{
          this._request.upload.onprogress = this._handleOnProgressUpload.bind(this);
        }
     }
  };
  /**
  * Execute the request
  */
    xmlHttpRequest.prototype.start = function(size, id, payload) {
      this._initiateRequest();
      this.id = id;
      this.transferSize = size;
      this._request.open(this.method, this.url, true);
      this._request.timeout = this.timeout;
      if(this.method==='POST') {
        this._request.send(payload);
      }
      else{
        this._request.send(null);
      }

    };
  /**
  * Mark the start time of the request
  */
    xmlHttpRequest.prototype._handleLoadstart = function() {
      this.startTime = Date.now();
      this.prevTime = Date.now();
    };
  /**
  * Handle eror event
  */
  xmlHttpRequest.prototype._handleError = function() {
     var err = {
       statusText: this._request.statusText,
       status: this._request.status
     };
     this.callbackError(err);
   };
    /**
      * Handle the timeout event on the wrapped request
      */
     xmlHttpRequest.prototype._handleTimeout = function(response) {
       this.totalTime = this.endTime - this.startTime;
       var transferSizeMbs = (response.loaded * 8) / 1000000;
       var transferDurationSeconds = this.totalTime/1000;
       //package results
       var result = {};
       result.latency = this.totalTime;
       result.bandwidth = transferSizeMbs/transferDurationSeconds;
       result.id = this.id;
       this.callbackTimeout(result);
  };
    /**
      * Handle the abort event on the wrapped request
      */
     xmlHttpRequest.prototype._handleAbort = function(response) {
       clearTimeout(this.requestTimeout);
       this.totalTime = Date.now() - this.startTime;
       var transferSizeMbs = (response.loaded * 8) / 1000000;
       var transferDurationSeconds = this.totalTime/1000;
       //package results
       var result = {};
       result.timeStamp = Date.now();
       result.chunckLoaded = response.loaded - this.prevLoad;
       result.time = this.totalTime;
       result.loaded = response.loaded;
       result.timeStamp = Date.now();
       result.chunckLoaded = response.loaded - this.prevLoad;
       result.bandwidth = transferSizeMbs/transferDurationSeconds;
       result.id = this.id;
       this.callbackAbort(result);

  };
  /**
    * Close the request explicitly
    */
  xmlHttpRequest.prototype.close = function () {
      this._request.abort();
  };

  /**
   * Handle the load event on the wrapped request
   */
  xmlHttpRequest.prototype._handleOnReadyStateChange = function () {

    if(this._request.readyState === 4 && this._request.status === 200) {
              var result = {};
              result.totalTime = Date.now() - this.startTime;
              result.id = this.id;
              if(this.method==='POST'){
                var transferSizeMbs = (this.transferSize * 8) / 1000000;
                var transferDurationSeconds = result.totalTime/1000;
                result.bandwidth = transferSizeMbs/transferDurationSeconds;
                result.timeStamp = Date.now();
                result.loaded = this.transferSize;
                result.time = result.totalTime;
                result.chunckLoaded = this.transferSize - this.prevLoad;
                if(isFinite(result.bandwidth)) {
                    this.callbackComplete(result);
                }
                return;
              }

          }
    if(this._request.status > 399){
      var err = {
        statusText: this._request.statusText,
        status: this._request.status
      };
      this.callbackError(err);
      return;
    }
  };

  /**
   * Handle the load event on the wrapped request
   */
  xmlHttpRequest.prototype._handleLoad = function (response) {
      this.totalTime = Date.now() - this.startTime;
      var result = {};
      result.time = this.totalTime;
      this.totalBytes += response.loaded;
      var transferSizeMbs = response.loaded * 8 / 1000000;

      var transferDurationSeconds = this.totalTime/1000;
      result.bandwidth = transferSizeMbs / transferDurationSeconds;
      result.loaded = response.loaded;
      result.id = this.id;
      if(isFinite(result.bandwidth)) {
          if (this.method === 'GET') {
              this.callbackComplete(result);
          }
      }
  };

  /**
    * Handle onProgress
    */
   xmlHttpRequest.prototype._handleOnProgressDownload = function (response) {
        //measure bandwidth after one progress event due to rampup
        if (this.progressCount > 1) {
          var result = {};
          result.id = this.id;
          this.currentTime = Date.now();
          result.totalTime = this.currentTime - this.prevTime;
          var transferSizeMbs = ((response.loaded - this.prevLoad) * 8) / 1000000;
          if (result.totalTime > this.progressIntervalDownload) {
            var transferDurationSeconds = result.totalTime / 1000;
            result.bandwidth = transferSizeMbs / transferDurationSeconds;
            result.loaded = response.loaded;
            result.startTime = this.startTime;
            result.timeStamp = Date.now();
            result.chunckLoaded = response.loaded - this.prevLoad;
            if (isFinite(result.bandwidth)) {
              this.callbackProgress(result);
              this.prevTime = this.currentTime;
              this.prevLoad = response.loaded;
            }
          }
        }
      //increment onProgressEvent
      this.progressCount++;
   };

   /**
     * Handle onProgress
     */
   xmlHttpRequest.prototype._handleOnProgressUpload = function (response) {
       //measure bandwidth after one progress event due to rampup
       if (this.progressCount > 1) {
           var result = {};
           result.id = this.id;
           this.currentTime = Date.now();
           result.totalTime = this.currentTime - this.prevTime;
           if (result.totalTime > this.progressIntervalUpload) {
               var transferSizeMbs = ((response.loaded - this.prevLoad) * 8) / 1000000;
               var transferDurationSeconds = result.totalTime / 1000;
               result.bandwidth = transferSizeMbs / transferDurationSeconds;
             result.timeStamp = Date.now();
             result.chunckLoaded = response.loaded - this.prevLoad;
               if (isFinite(result.bandwidth)) {
                   this.callbackProgress(result);
                   this.prevTime = this.currentTime;
                   this.prevLoad = response.loaded;
               }
           }
       }
       //increment onProgressEvent
       this.progressCount++;


   };

window.xmlHttpRequest = xmlHttpRequest;

  })();
