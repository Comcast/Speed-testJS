(function() {
  'use strict';
  /**
   * Latency testing based on httpRequests
   **/
  function latencyWebSocketTest(url, type, size, iterations, timeout, callbackComplete, callbackProgress,callbackError) {
    this.url = url;
    this.type = type;
    this.size = size;
    this.iterations = iterations;
    this.timeout = timeout;
    this._test = null;
    this._testIndex = 0;
    this._results = [];
    this.clientCallbackComplete = callbackComplete;
    this.clientCallbackProgress = callbackProgress;
    this.clientCallbackError = callbackError;

  };

  /**
  * Execute the request
  */
    latencyWebSocketTest.prototype.start = function() {
      this._test = new window.webSocket(this.url,this.type,this.size, this.onTestComplete.bind(this),
      this.onTestError.bind(this));
      this._testIndex++;
      this._test.start();
    };
    /**
    * onError method
    * @return abort object
    */
    latencyWebSocketTest.prototype.onTestError = function(result){
      this.clientCallbackError(result);
    };

    /**
    * onComplete method
    * @return array of latencies
    */
    latencyWebSocketTest.prototype.onTestComplete = function(result){
     this._results.push(result);
     this.clientCallbackProgress(result);
     if(this._testIndex<this.iterations){
       this.start();
     }
     else{
       this.clientCallbackComplete(this._results);

     }
    };

window.latencyWebSocketTest = latencyWebSocketTest;
})();
