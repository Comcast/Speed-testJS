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
   * Latency testing based on httpRequests
   **/
  function latencyHttpTest(url, iterations, timeout, callbackComplete, callbackProgress, callbackAbort,
                           callbackTimeout, callbackError) {
    this.url = url;
    this.iterations = iterations;
    this.timeout = timeout;
    this._test = null;
    this._testIndex = 0;
    this._results = [];
    //array holding active tests
    this._activeTests = [];
    //boolean on whether test  suite is running or not
    this._running = true;
    this.clientCallbackComplete = callbackComplete;
    this.clientCallbackProgress = callbackProgress;
    this.clientCallbackAbort = callbackAbort;
    this.clientCallbackTimeout = callbackTimeout;
    this.clientCallbackError = callbackError;

  }

  /**
   * Execute the request
   */
  latencyHttpTest.prototype.start = function () {
    var cachebuster = Math.random();
    this._test = new window.xmlHttpRequest('GET', [this.url, '?', cachebuster].join(''), this.timeout, this.onTestComplete.bind(this),this.onTestProgress.bind(this),
        this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
    this._testIndex++;
    this._test.start(0, this._testIndex);
    this._activeTests.push({
      xhr: this._test,
      testRun: this._testIndex
    });
  };

  /**
   * onError method
   * @return abort object
   */
  latencyHttpTest.prototype.onTestError = function (result) {
    if(this._running){
      result.results = this._results;
      this.clientCallbackError(result);
      this._running = false;
    }
  };

  /**
   * onAbort method
   * @return abort object
   */
  latencyHttpTest.prototype.onTestAbort = function (result) {
    if(this._running){
      result.results = this._results;
      this.clientCallbackAbort(result);
      this._running = false;
    }
  };

  /**
   * onTimeout method
   * @return abort object
   */
  latencyHttpTest.prototype.onTestTimeout = function (result) {
    if(this._running){
      result.results = this._results;
      this.clientCallbackTimeout(result);
      this._running = false;
    }
  };

  /**
   * onProgress method
   */
  latencyHttpTest.prototype.onTestProgress = function(result){ // jshint ignore:line
    //process result if you want to use this function
    //latency does not report onProgressEvents
  };
  /**
   * onComplete method
   * @return array of latencies
   */
  latencyHttpTest.prototype.onTestComplete = function (result) {
    if(!this._running){
      return;
    }
    this._results.push(result);
    this._activeTests.pop(result.id,1);
    this.clientCallbackProgress(result);
    if (this._testIndex !== this.iterations) {
      this.start();
    }
    else {
      this._running = false;
      this.clientCallbackComplete(this._results);
    }
  };

  /**
   * Cancel the test
   */
  latencyHttpTest.prototype.abortAll = function() {
    this._running = false;
    for(var i=0;i<this._activeTests.length;i++){
      if (typeof(this._activeTests[i])!== 'undefined') {
        this._activeTests[i].xhr._request.abort();
      }
    }
  };


  /**
   * init test suite
   */
  latencyHttpTest.prototype.initiateTest = function(){
    this._testIndex = 0;
    this._results.length =0;
    //array holding active tests
    this._activeTests.length=0;
    this._running = true;
    this.start();
  };

  window.latencyHttpTest = latencyHttpTest;
})();
