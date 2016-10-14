(function() {
  'use strict';
  /**
   * Latency testing based on httpRequests
   **/
  function latencyHttpTest(url, iterations, timeout, callbackComplete, callbackProgress,callbackAbort,
  callbackTimeout,callbackError) {
    this.url = url;
    this.iterations = iterations;
    this.timeout = timeout;
    this._test = null;
    this._testIndex = 0;
    this._results = [];
    this.clientCallbackComplete = callbackComplete;
    this.clientCallbackProgress = callbackProgress;
    this.clientCallbackAbort = callbackAbort;
    this.clientCallbackTimeout = callbackTimeout;
    this.clientCallbackError = callbackError;

  };
  /**
  * Execute the request
  */
    latencyHttpTest.prototype.start = function() {
      this._test = new window.xmlHttpRequest('GET',this.url,this.timeout, this.onTestComplete.bind(this),
      this.onTestAbort.bind(this),this.onTestTimeout.bind(this),this.onTestError.bind(this));
      this._testIndex++;
      this._test.start(0,this._testIndex);
    };
    /**
    * onError method
    * @return abort object
    */
    latencyHttpTest.prototype.onTestError = function(result){
      this.clientCallbackError(result);
    };
    /**
    * onAbort method
    * @return abort object
    */
    latencyHttpTest.prototype.onTestAbort = function(result){
      this.clientCallbackAbort(result);
    };
    /**
    * onTimeout method
    * @return abort object
    */
    latencyHttpTest.prototype.onTestTimeout = function(result){
      this.clientCallbackTimeout(result);
    };
  /**
  * onComplete method
  * @return array of latencies
  */
  latencyHttpTest.prototype.onTestComplete = function(result){
   this._results.push(result);
   this.clientCallbackProgress(result);
   if(this._testIndex!==this.iterations){
     this.start();
   }
   else{
     this.clientCallbackComplete(this._results);
   }
  };
window.latencyHttpTest = latencyHttpTest;
})();
