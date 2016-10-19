(function() {
  'use strict';

  function calculateStats(data, callbackResults, callbackError) {
    this.data = data;
    this.clientCallbackResults = callbackResults;
    this.clientCallbackError = callbackError;
  }

  calculateStats.prototype.onError = function(results) {
    this.clientCallbackError(result);
  }

  calculateStats.prototype.performCalculations = function() {
    var url = '/calculator';
    var request = new XMLHttpRequest();
    var self = this;
    request.open('POST', url, true);
    request.setRequestHeader('Content-Type', 'application/json');
    request.onreadystatechange = function () {
      if (request.readyState === 4 && request.status === 200) {
        var meanValue = (JSON.parse(request.responseText)).stats.mean;
        self.clientCallbackResults(meanValue);
      }
    }
    request.send(JSON.stringify(this.data));
  }

  window.calculateStats = calculateStats;
})();
