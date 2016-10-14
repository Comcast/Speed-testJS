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
function xhr(method, url, timeout, callbackComplete, callbackProgress,callbackAbort,
callbackTimeout,callbackError){
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
  this.callbackComplete = callbackComplete;
  this.callbackProgress = callbackProgress;
  this.callbackAbort = callbackAbort;
  this.callbackTimeout = callbackTimeout;
  this.callbackError = callbackError;
};
/**
 * Initiate the request
 */
xhr.prototype._initiateRequest = function(){
  if (this._request === null ||
     typeof this._request === 'undefined') {
     this._request = new XMLHttpRequest();
     // Handle lifecycle events on wrapped request
     this._request.onloadstart = this._handleLoadstart.bind(this);
     this._request.onload = this._handleLoad.bind(this);
     this._request.onabort = this._handleAbort.bind(this);
     this._request.ontimout = this._handleTimeout.bind(this);
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
  xhr.prototype.start = function(size, id) {
    this._initiateRequest();
    this.id = id;
    this.transferSize = size;
    // Set values for request and initiate
    this._request.timeout = this.timeout;
    this._request.open(this.method, this.url, true);
    if(this.method==='POST') {
      this._request.send(getRandomString(size));
    }
    else{
      this._request.send(null);
    }
  };
/**
* Mark the start time of the request
*/
  xhr.prototype._handleLoadstart = function() {
    this.startTime = Date.now();
    this.prevTime = Date.now();
  };
/**
* Handle eror event
*/
xhr.prototype._handleError = function() {
   // TODO: Demeter would be mad...
   var request = this._testRequest._request;
   var err = {
     statusText: this._request.statusText,
     status: this._request.status
   };

 };

  /**
    * Handle the timeout event on the wrapped request
    */
   xhr.prototype._handleTimeout = function(response) {
     this.endTime = Date.now();
     this.totalTime = this.endTime - this.startTime;
     this.bandwidth = ((response.loaded * 8) / 1000000) / (this.totalTime / 1000);
     //package results
     var result = {};
     result.latency = this.totalTime;
     result.bandwidth = this.bandwidth;
     result.id = this.id;
     this.callbackTimeout(result);
};
  /**
    * Handle the abort event on the wrapped request
    */
   xhr.prototype._handleAbort = function(response) {
     this.endTime = Date.now();
     this.totalTime = this.endTime - this.startTime;
     this.bandwidth = ((response.loaded * 8) / 1000000) / (this.totalTime / 1000);
     //package results
     var result = {};
     result.latency = this.totalTime;
     result.bandwidth = this.bandwidth;
     result.id = this.id;
     this.callbackAbort(result);

};
/**
 * Handle the load event on the wrapped request
 */
xhr.prototype._handleOnReadyStateChange = function () {
  if(this._request.readyState === 4 && this._request.status === 200) {
            var result = {};
            result.latency = Date.now() - this.prevTime;
            result.bandwidth = ((this._request.response.length * 8) / 1000000)/(result.latency/1000);
        }
};

/**
 * Handle the load event on the wrapped request
 */
xhr.prototype._handleLoad = function (response) {
  if (this._request.status >= 200 && this._request.status < 300) {
    //this.markEnd();
    this.totalTime = Date.now() - this.prevTime;
    var result = {};
    result.latency = this.totalTime;
    result.bandwidth = ((response.loaded - this.prevLoad) * 8 / 1000000) / ((Date.now() - this.prevTime) / 1000);
    result.id = this.id;
    this.callbackComplete(result);
    //this.trigger('complete', ((this.size - this.prevLoad) * 8 / 1000000) / ((Date.now() - this.prevTime) / 1000),this._id);
  } else {
    //this.trigger('error', response);
  }
};

/**
  * Handle onProgress
  */
 xhr.prototype._handleOnProgressDownload = function (response) {

   if (this.progressCount > 0) {
       if ((response.timeStamp - this.prevTime > 100)) {
         //TODO onprogress event is not firing
         var result = {};
         result.duration = ((response.timeStamp - this.prevTime) / 1000);
         result.bandwidth = ((response.loaded - this.prevLoad) * 8 / 1000000) / result.duration;
         result.id = this.id;
         this.callbackProgress(result);
         this.prevTime = response.timeStamp;
         this.prevLoad = response.loaded;
       }
   }
   this.progressCount++;

 };

 /**
   * Handle onProgress
   */
  xhr.prototype._handleOnProgressUpload = function (response) {

    if (this.progressCount > 0) {
        if ((response.timeStamp - this.prevTime > 100)) {
          //TODO onprogress event is not firing
          var result = {};
          result.duration = ((response.timeStamp - this.prevTime) / 1000);
          result.bandwidth = ((response.loaded - this.prevLoad) * 8 / 1000000) / result.duration;
          result.id = this.id;
          this.callbackProgress(result);
          this.prevTime = response.timeStamp;
          this.prevLoad = response.loaded;
        }
    }
    this.progressCount++;

  };

  /**
   * Latency testing based on httpRequests
   **/
  function DownloadConcurrent(url, type, concurrentRuns, timeout, startSize,callbackComplete, callbackProgress,callbackAbort,
  callbackTimeout,callbackError) {
    this.url = url;
    this.type = type;
    this.concurrentRuns = concurrentRuns;
    this.timeout = timeout;
    this.startSize = startSize;
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
    this.beginTime = 0;


};
/**
* Start the test
*/
  DownloadConcurrent.prototype.run = function() {
    this._beginTime = Date.now();
    if (this.type === 'GET') {
      for (var g = 1; g <= this.concurrentRuns; g++) {
        this._testIndex++;
        this._activeTests.push(this._testIndex);
        this['arrayResults'+this._testIndex] = [];
        var reqeust = new window.xhr('GET',this.url,this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
        this.onTestAbort.bind(this),this.onTestTimeout.bind(this),this.onTestError.bind(this));
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
    //http://stackoverflow.com/questions/2749244/javascript-setinterval-and-this-solution
        //TODO verify this works in all browsers
        var self = this;
        this.interval = setInterval(function () {
          self._monitor();
        }, 100);

  }

  /**
   * Monitor testSeries.. finish testSeries by testTime... increase size or check for timeouts
   */
  DownloadConcurrent.prototype._monitor = function () {
    //stop testSeries
    if (((Date.now() - this._beginTime)) > this._testTime) {
      clearInterval(this.interval);
      this.running = false;
      this.cancel();
      //this.trigger('complete', this._results);
    }


  };

  /**
  * onError method
  * @return abort object
  */
  DownloadConcurrent.prototype.onTestError = function(result){
    this.clientCallbackError(result);
  };
  /**
  * onAbort method
  * @return abort object
  */
  DownloadConcurrent.prototype.onTestAbort = function(result){
    this.clientCallbackAbort(result);
  };
  /**
  * onTimeout method
  * @return abort object
  */
  DownloadConcurrent.prototype.onTestTimeout = function(result){
    this.clientCallbackTimeout(result);
  };
/**
* onComplete method
* @return array of latencies
*/
DownloadConcurrent.prototype.onTestComplete = function(result){
 this._results.push(result);
 this.clientCallbackProgress(result);
 if(this._testIndex!==this.iterations){
   this.start();
 }
 else{
   this.clientCallbackComplete(this._results);
 }
};

/**
* onProgress method
* @return single latency result
*/
DownloadConcurrent.prototype.onTestProgress = function(result){
 this.clientCallbackProgress(result);
};


 /**
  * Latency testing based on httpRequests
  **/
 function LatencyXmlHttpRequests(url, iterations, timeout, callbackComplete, callbackProgress,callbackAbort,
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
   LatencyXmlHttpRequests.prototype.start = function() {
     this._test = new window.xhr('GET',this.url,this.timeout, this.onTestComplete.bind(this), this.onTestProgress.bind(this),
     this.onTestAbort.bind(this),this.onTestTimeout.bind(this),this.onTestError.bind(this));
     this._testIndex++;
     this._test.start(0,this._testIndex);
   };
   /**
   * onError method
   * @return abort object
   */
   LatencyXmlHttpRequests.prototype.onTestError = function(result){
     this.clientCallbackError(result);
   };
   /**
   * onAbort method
   * @return abort object
   */
   LatencyXmlHttpRequests.prototype.onTestAbort = function(result){
     this.clientCallbackAbort(result);
   };
   /**
   * onTimeout method
   * @return abort object
   */
   LatencyXmlHttpRequests.prototype.onTestTimeout = function(result){
     this.clientCallbackTimeout(result);
   };
/**
* onComplete method
* @return array of latencies
*/
LatencyXmlHttpRequests.prototype.onTestComplete = function(result){
  this._results.push(result);
  this.clientCallbackProgress(result);
  if(this._testIndex!==this.iterations){
    this.start();
  }
  else{
    this.clientCallbackComplete(this._results);
  }
};

/**
* onProgress method
* @return single latency result
*/
LatencyXmlHttpRequests.prototype.onTestProgress = function(result){
  this.clientCallbackProgress(result);
};

  /**
   * Create a random string of N Mb in length
   * @param int size of payload in Mb
   * @returns randomized payload size
   */

  function getRandomString (size) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]\{}|;:,./<>?', //random data prevents gzip effect
      result = '';
    for (var index = 0; index < size; index++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get a WebSocket
   * @param string url
   **/
  function getWebSocket(url){
    return new WebSocket(url);
  }
  /**
   * ExecuteLatencyTest
   * @param string url
   * @param int number of tests to run
   **/
  function ExecuteLatencyTest(url, numberOfTests){
    var webSocket = getWebSocket(url);
    var latencyResults = [];
    var isRunning = false;
    webSocket.onopen = function () {
      var currentTest = 1;
      var repeater = setInterval(function () {
        if (currentTest <= numberOfTests) {
          if(!isRunning) {
            checkLatency();
            currentTest++;
          }
        }
        else {
          clearInterval(repeater);
          console.log(latencyResults);
          webSocket.close();
        }
      }, 50);
      function checkLatency() {
        isRunning=true;
        var obj = { 'data': Date.now().toString(), 'flag': 'latency' };
        webSocket.send(JSON.stringify(obj), { mask: true });
        webSocket.onmessage = function (event) {
          //event data is the timestamp send to the webSocket endpoint in send event
          var finaltime = Date.now() - parseInt(event.data);
          latencyResults.push(finaltime);
          isRunning=false;

        };
      }
    };
    webSocket.onerror = function (event) {
      console.log(event);
    };
  }
  /**
   * ExecuteDownload
   * @param string url
   **/
  function ExecuteDownload(url){
    var ws = getWebSocket(url);
    console.log('starttime download :', new Date().getTime());
    ws.onopen = function () {
      ws.send(JSON.stringify({ 'data': 'image750buffer', 'flag': 'download' }));
    };

    ws.onmessage = function (evt) {
      console.log('duration: ' + (Date.now() - parseFloat(JSON.parse(evt.data).startTIME)));

      var duration = new Date().getTime() - parseFloat(JSON.parse(evt.data).startTIME);
      console.log('finalvalue', duration);
      var time = duration / 1000;
      // 			Bytes to Megabytes conversion and round of the integer
      var filesize = ((1118012*8) / 1000000).toFixed(3);
      console.log('File size in MB:', filesize);
      console.log('Download speed in MegaBytes/sec', (filesize / time).toFixed(2));
      //console.log('Download speed in Megabits/sec', ((filesize / time) * 8).toFixed(2));

    };
  }


  // EXPORTS
  window.ExecuteLatencyTest = ExecuteLatencyTest;
  window.ExecuteDownload = ExecuteDownload;
  window.xhr = xhr;
  window.LatencyXmlHttpRequests = LatencyXmlHttpRequests;

})();
