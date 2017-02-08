(function () {

    function adaptiveDownload(urls, url, size, prevDownloadSize, concurrentRuns, timeout, testLength, callbackComplete,
                              callbackProgress, callbackAbort, callbackTimeout, callbackError) {

        this.urls = urls;
        this.url = url;
        this.size = size;
        this.prevDownloadSize = prevDownloadSize;
        this.concurrentRuns = concurrentRuns;
        this.timeout = timeout;
        this.testLength = testLength;
        this.running = true;
        this.testIndex = 0;
        this.progressResults = {};
        //array holding active tests
        this.activeTests = [];
        this.trackingOnComplete = {};
        this.progressCount = 0;
        this.callbackComplete = callbackComplete;
        this.callbackProgress = callbackProgress;
        this.callbackAbort = callbackAbort;
        this.callbackTimeout = callbackTimeout;
        this.callbackError = callbackError;
        this.totalBytes = 0;
    }

    adaptiveDownload.prototype.start = function () {
        if (!this.running) {
            return;
        }

        for (var i = 0; i < this.concurrentRuns; i++) {
            this.testIndex++;
            this.progressResults['arrayProgressResults' + this.testIndex] = [];
            var request = new window.xmlHttpRequest('GET', this.urls[i] + this.size + '&r=' + Math.random(), this.timeout, this.onTestComplete.bind(this),
                this.onTestProgress.bind(this), this.onTestAbort.bind(this), this.onTestTimeout.bind(this), this.onTestError.bind(this));
            this.activeTests.push({
                xhr: request,
                testRun: this.testIndex
            });
            request.start(0, this.testIndex);
        }

    };

    adaptiveDownload.prototype.onTestComplete = function (result) {

        if (!this.running) {
            return;
        }

        if (this.running) {
            this.abortAll();
            this.timeout -= result.time;
            this.trackingOnComplete.timeout = this.timeout;
            var downloadSize = (this.timeout * result.loaded / result.time);
            //var downloadSize = this.size * 2;
            if (downloadSize > this.prevDownloadSize) {
                this.size = downloadSize;
                this.prevDownloadSize = downloadSize;
                this.trackingOnComplete.size = this.size;
                this.trackingOnComplete.prevDownloadSize = this.prevDownloadSize;
                this.trackingOnComplete.calculateResults = false;
                this.callbackComplete(this.trackingOnComplete);
                this.progressCount = 0;
            } else {
                this.abortAll();
                this.trackingOnComplete.calculateResults = true;
                this.callbackComplete(this.trackingOnComplete);
            }
        }

    };

    adaptiveDownload.prototype.onTestProgress = function (result) {
        this.progressCount++;
        this.progressResults['arrayProgressResults' + result.id].push({
            loaded: result.loaded,
            time: result.time
        });

        this.totalBytes += result.load;
        var totalBandwidth = (this.totalBytes * 8 * 1000) / (result.time * 1000000);

        if (isFinite(totalBandwidth)) {
            this.callbackProgress(totalBandwidth);
        }

    };

    adaptiveDownload.prototype.onTestError = function (result) {
        if (this.running) {
            this.callbackError(result);
            this.running = false;
        }
    };

    adaptiveDownload.prototype.onTestAbort = function () {
        if (this.running) {
            this.abortAll();
            this.trackingOnComplete.calculateResults = true;
            this.callbackComplete(this.trackingOnComplete);
            this.running = false;
        }
    };

    adaptiveDownload.prototype.onTestTimeout = function () {
        if (this.running) {
            this.abortAll();
            this.trackingOnComplete.calculateResults = true;
            this.callbackComplete(this.trackingOnComplete);
            this.running = false;
        }
    };

    adaptiveDownload.prototype.abortAll = function () {
        this.running = false;
        for (var j = 0; j < this.activeTests.length; j++) {
            if (typeof(this.activeTests[j]) !== 'undefined') {
                this.activeTests[j].xhr._request.abort();
            }
        }
    };

    adaptiveDownload.prototype.initiateTest = function () {
        this.running = true;
        this.testIndex = 0;
        this.progressResults = {};
        this.activeTests.length = 0;
        this.trackingOnComplete = {};
        this.progressCount = 0;
        this.totalBytes = 0;
        this.start();
    };

    window.adaptiveDownload = adaptiveDownload;

})();
