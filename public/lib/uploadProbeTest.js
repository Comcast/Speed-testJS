(function () {
    'use strict';

    function uploadProbeTest(url, dataurl, lowLatency, timeout, size, callbackComplete, callbackError) {
        this.probeTestUrl = url + '?bufferSize=' + size + '&time=0&lowLatency=' + lowLatency;
        this.dataUrl = dataurl;
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
    }

    /**
     * Execute the request
     */
    uploadProbeTest.prototype.start = function () {
        this._test = new window.xmlHttpRequest('POST', this.probeTestUrl, this.timeout, this.onTestComplete.bind(this),
          this.onTestProgress.bind(this), this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
        this._testIndex++;
        this._running = true;
        this._activeTests.push({
            xhr: this._test,
            testRun: this._testIndex
        });
        this._test.start(this.size, this._testIndex, getRandomString(this.size));

    };

    /**
     * onError method
     * @param error object
     */
    uploadProbeTest.prototype.onTestError = function (result) {
        this.clientCallbackError(result);
    };

    /**
     * onAbort method
     * @param abort object
     */
    uploadProbeTest.prototype.onTestAbort = function (result) {
        if (this._running) {
            this.clientCallbackError(result);
        }
    };

    /**
     * onTimeout method
     * @param timeout object
     */
    uploadProbeTest.prototype.onTestTimeout = function (result) {
        this.clientCallbackError(result);
    };

    /**
     * onComplete method
     * @param probe object
     */
    uploadProbeTest.prototype.onTestComplete = function (result) {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                self._running = false;
                var data = xhr.responseText;
                self.clientCallbackComplete(data);
            }
        };
        var requestTimeout;
        requestTimeout = setTimeout(xhr.abort.bind(xhr), this.probeTimeout);
        xhr.abort = function(){
            self.clientCallbackError(result);
            clearTimeout(requestTimeout);
        };
        xhr.open('GET', this.dataUrl + '?bufferSize=' + this.size + '&time=' + result.totalTime + '&lowLatency=' + this.lowLatency, true);
        xhr.send(null);
    };

    /**
     * onProgress method
     * @param  result
     */
    uploadProbeTest.prototype.onTestProgress = function (result) { // jshint ignore:line
        //process result if you want to use this function
    };

    /**
     * Cancel the test
     */
    uploadProbeTest.prototype.abortAll = function () {
        this._running = false;
        for (var i = 0; i < this._activeTests.length; i++) {
            if (typeof(this._activeTests[i]) !== 'undefined') {
                this._activeTests[i].xhr._request.abort();
            }
        }
    };

    /**
     * getRandomString creates a random data used for testing the upload bandwidth.
     * @param size - creates a blob of the given size.
     * @returns {*}
     */
    function getRandomString(size) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]\{}|;:,./<>?', //random data prevents gzip effect
          result = '';
        for (var index = 0; index < size; index++) {
            var randomChars = Math.floor(Math.random() * chars.length);
            result += chars.charAt(randomChars);
        }
        var blob;
        try {
            blob = new Blob([result], {type: "application/octet-stream"});
        } catch (e) {
            var bb = new BlobBuilder; // jshint ignore:line
            bb.append(result);
            blob = bb.getBlob("application/octet-stream");
        }
        return blob;
    }

    window.uploadProbeTest = uploadProbeTest;

})();
