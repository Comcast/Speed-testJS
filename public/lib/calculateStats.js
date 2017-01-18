/*
 * *
 *  Copyright 2014 Comcast Cable Communications Management, LLC
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 * /
 */

(function () {
    'use strict';

    /**
     *
     * @param data - upload or download results
     * @param callbackResults - function callback for sending the results to the client
     * @param callbackError - function callback for error event
     */
    function calculateStats(url, data, callbackResults, callbackError) {
        this.url = url;
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
        var request = new XMLHttpRequest();
        var self = this;
        request.open('POST', this.url, true);
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
