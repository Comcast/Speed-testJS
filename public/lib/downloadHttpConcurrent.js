(function() {
  'use strict';
  /**
   * Latency testing based on httpRequests
   **/
  function downloadHttpConcurrent(url, type, concurrentRuns, timeout, testLength,callbackComplete, callbackProgress,callbackAbort,
  callbackTimeout,callbackError) {
    this.url = url;
    this.type = type;
    this.concurrentRuns = concurrentRuns;
    this.timeout = timeout;
    this.testLength = testLength;
    this._test = null;
    this._testIndex = 0;
    this._results = [];
    this._activeTests = [];
    this._resultsHolder = {};
    this.clientCallbackComplete = callbackComplete;
    this.clientCallbackProgress = callbackProgress;
    this.clientCallbackAbort = callbackAbort;
    this.clientCallbackTimeout = callbackTimeout;
    this.clientCallbackError = callbackError;
    this._beginTime = Date.now();
    this._running = true;
    this.finalResults = [];
  };

    /**
    * onError method
    * @return abort object
    */
    downloadHttpConcurrent.prototype.onTestError = function(result){
      this.clientCallbackError(result);
    };
    /**
    * onAbort method
    * @return abort object
    */
    downloadHttpConcurrent.prototype.onTestAbort = function(result){
      this.clientCallbackAbort(result);
    };
    /**
    * onTimeout method
    * @return abort object
    */
    downloadHttpConcurrent.prototype.onTestTimeout = function(result){
      this.clientCallbackTimeout(result);
    };
    /**
    * onComplete method
    * @return array of latencies
    */
    downloadHttpConcurrent.prototype.onTestComplete = function(result){

      if(!this._running){
        return;
      }
      //pushing results to an array
      this._results.push(result);
      this['arrayResults'+result.id];
      //remove requests from active test array
      this._activeTests.pop(result.id,1);
      //checking if we can continue with the test
      if((Date.now() - this._beginTime) < this.testLength){
        if(this._activeTests.length === 0 && this._running){
          var singleMovingAverage = 0;
          for (var j = 1; j <= this.concurrentRuns; j++){
            singleMovingAverage += this._results[(this._results.length-j)].bandwidth;
          }
          this.finalResults.push(singleMovingAverage);
          this.clientCallbackProgress(singleMovingAverage);
          this.start();
        }
      }
      else {
        var total = 0;
        this._running = false;
        if (this.finalResults && this.finalResults.length) {
          //TODO use statistical calculator to calculate the end result
          for (var j = 0; j < this.finalResults.length; j++) {
            total += this.finalResults[j];
          }
          var finalValue = total / this.finalResults.length;
          this.clientCallbackComplete(finalValue);
        } else {
          this.clientCallbackError('no measurements obtained');
        }
        for(var i = 0; i < this._activeTests.length; i++){
          if (typeof(this._activeTests[i])!== 'undefined') {
            this._activeTests[i].xhr._request.abort();
          }

        }
      }
    };

    /**
    * onProgress method
    * @return single latency result
    */
    downloadHttpConcurrent.prototype.onTestProgress = function(result){
     this.clientCallbackProgress(result);
    };
    /**
    * Start the test
    */
      downloadHttpConcurrent.prototype.start = function() {
        if(!this._running){
          return;
        }
        if (this.type === 'GET') {
          for (var g = 1; g <= this.concurrentRuns; g++) {
            this._testIndex++;
            this['arrayResults'+this._testIndex] = [];
            var request = new window.xmlHttpRequest('GET',[this.url, '?', Date.now()].join(''),this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
            this.onTestAbort.bind(this),this.onTestTimeout.bind(this),this.onTestError.bind(this));
            this._activeTests.push({
              xhr: request,
              testRun: this._testIndex
            });
            request.start(0,this._testIndex);

          }
        }
        else {
          for (var p = 1; p <= this.concurrentRuns; p++) {
            this._testIndex++;
            this._activeTests.push(this._testIndex);
            this['testResults'+this._testIndex] = [];
            this.test.start(this.size, this._testIndex);
          }
        }
      }

  window.downloadHttpConcurrent = downloadHttpConcurrent;
  })();
