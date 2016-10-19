(function () {
  'use strict';
  /**
   * DownloadProbe test to get sizes for download testing
   **/
   function downloadProbeTest(url, lowLatency, timeout,callbackComplete,callbackError) {
     this.url = url;
     this.lowLatency = lowLatency;
     this.timeout = timeout;
     this._results;
     this.clientCallbackComplete = callbackComplete;
     this.clientCallbackError = callbackError;

   };

   /**
   * Execute the request
   */
   downloadProbeTest.prototype.start = function () {
     var cachebuster = Date.now();
     this._test = new window.xmlHttpRequest('GET', [this.url, '?', cachebuster].join(''), this.timeout, this.onTestComplete.bind(this),
       this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
     this._testIndex++;
     this._test.start(0, this._testIndex);
   };
   /**
   * onError method
   * @return error object
   */
   downloadProbeTest.prototype.onTestError = function (result) {
     this.clientCallbackError(result);
   };
   /**
   * onAbort method
   * @return abort object
   */
   downloadProbeTest.prototype.onTestAbort = function (result) {
     this.clientCallbackError(result);
   };
   /**
   * onTimeout method
   * @return timeout object
   */
   downloadProbeTest.prototype.onTestTimeout = function (result) {
     this.clientCallbackError(result);
   };

   /**
   * onComplete method
   * @return array of latencies
   */
   downloadProbeTest.prototype.onTestComplete = function (result) {

   };

   window.downloadProbeTest = downloadProbeTest;
 })();
