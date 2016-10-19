(function () {
    'use strict';

    /**
     *
     * @param data - upload or download results
     * @param callbackResults - function callback for sending the results to the client
     * @param callbackError - function callback for error event
     */
    function calculateStats(data, callbackResults, callbackError) {
        this.data = data;
        this.clientCallbackResults = callbackResults;
        this.clientCallbackError = callbackError;
    }

    /**
     * onError method
     * @param result
     * @return error object
     */
    calculateStats.prototype.onError = function (result) {
        this.clientCallbackError(result);
    };

    /**
     * Function performCalculations - sends results to server and gets the mean stats
     * @return result back to the client
     */
    calculateStats.prototype.performCalculations = function () {
        var url = '/calculator';
        var request = new XMLHttpRequest();
        var self = this;
        request.open('POST', url, true);
        request.setRequestHeader('Content-Type', 'application/json');
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var stats = JSON.parse(request.responseText);
                self.clientCallbackResults(stats);
            }
        };
        request.send(JSON.stringify(this.data));
    };

    window.calculateStats = calculateStats;
})();
