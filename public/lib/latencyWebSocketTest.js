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
  function latencyWebSocketTest(url, type, size, iterations, timeout, callbackComplete, callbackProgress, callbackError) {
    this.url = url;
    this.type = type;
    this.size = size;
    this.iterations = iterations;
    this.timeout = timeout;
    this._test = null;
    this._testIndex = 0;
    this._results = [];
    this._beginTime=null;
    this.interval = null;
    this._running = true;
    this.clientCallbackComplete = callbackComplete;
    this.clientCallbackProgress = callbackProgress;
    this.clientCallbackError = callbackError;
  }

  /**
   * Execute the request
   */
  latencyWebSocketTest.prototype.start = function () {
    this._test = new window.webSocket(this.url, this.type, this.size, this.onTestComplete.bind(this),
        this.onTestError.bind(this));
    this._testIndex++;
    this._test.start();
  };

  /**
   * onError method
   * @return abort object
   */
  latencyWebSocketTest.prototype.onTestError = function (result) {
    if(this._running) {
      clearInterval(this.interval);
      this._running = false;
      this.clientCallbackError(result);
    }
  };

  /**
   * onComplete method
   * @return array of latencies
   */
  latencyWebSocketTest.prototype.onTestComplete = function (result) {
    this._results.push(result);
    this.clientCallbackProgress(result);
    if (this._testIndex < this.iterations) {
      this._testIndex++;
      this._test.sendMessage();
    }
    else {
      this._running = false;
      clearInterval(this.interval);
      this._test.close();
      this.clientCallbackComplete(this._results);

    }
  };

  /**
   * Monitor testSeries
   */
  latencyWebSocketTest.prototype._monitor = function () {
    if ((Date.now() - this._beginTime) > (this.timeout) &&(this._testIndex===1)) {
      clearInterval(this.interval);
      this._running = false;
      this.clientCallbackError('webSocketTimeout.');
      this._test.close();
    }
  };


  /**
   * init test suite
   */
  latencyWebSocketTest.prototype.initiateTest = function () {
    this._testIndex = 0;
    this._results.length = 0;
    this.start();
    this._beginTime = Date.now();
    this._running = true;
    this.interval = null;
    var self = this;
    this.interval = setInterval(function () {
      self._monitor();
    }, 100);
  };

  window.latencyWebSocketTest = latencyWebSocketTest;
})();
