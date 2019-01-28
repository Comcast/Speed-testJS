function testRunTime(startTime) {
    return timer() - startTime;
}

function timer() {
    return window.performance.now();
}

function simpleMovingAverage() {
    this.smaCount++;
    const differential = (this.curSpeed - this.smaMean) / this.smaCount
    const newMean = this.smaMean + differential;
    this.smaMean = newMean;
    return this.smaMean;
}

function calculateSpeedMbps(bytes, milliSeconds) {
    return bytes / (125 * milliSeconds);
}

function abortAllRequests() {
    for (var i = 0; i < this.activeTests.length; i++) {
        if (typeof(this.activeTests[i] !== 'undefined')) {
            this.activeTests[i].xhr._request.abort();
        }
    }
}
