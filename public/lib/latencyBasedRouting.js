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
     * function performs latency based routing.
     * @param location - pass the location to get the list available servers.
     * @param url - end point for getting the server information.
     * @param testServerTimeout - timeout for the test server request.
     * @param latencyTimeout - timeout for latency based routing.
     * @param callbackComplete - callback function for test suite complete event.
     * @param callbackError - callback function for test suite error event.
     */
    function latencyBasedRouting(location, url, testServerTimeout, latencyTimeout, callbackComplete, callbackError) {
        this.location = location;
        this.url = url;
        this.clientCallbackComplete = callbackComplete;
        this.clientCallbackError = callbackError;
        this.latencyHttpTestRequest = [];
        this.numServersResponded = 0;
        this.trackingServerInfo = [];
        this.testServerTimeout = testServerTimeout;
        this.latencyBasedRoutingTimeout = latencyTimeout;
    }

    /**
     * onError method
     * @param result
     * @return error object
     */
    latencyBasedRouting.prototype.onError = function (result) {
        this.clientCallbackError(result);
    };

    /**
     * Function getNearestServer returns all the available servers in a particular location
     */
    latencyBasedRouting.prototype.getNearestServer = function () {
        var self = this;
        var dataUrl = this.url + '?location=' + this.location + '&r=' + Math.random();
        var request = new XMLHttpRequest();
        request.onreadystatechange = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                var data;
                try {
                    data = JSON.parse(request.responseText);
                }
                catch (err) {
                    self.clientCallbackError('no server information');
                    return;
                }
                if (data instanceof Array && data.length > 0) {
                    self.performLatencyBasedRouting(JSON.parse(request.responseText));
                } else {
                    self.clientCallbackError('no server information');
                }
            }
        };
        var requestTimeout;
        requestTimeout = setTimeout(request.abort.bind(request), this.testServerTimeout);
        request.abort = function () {
            self.clientCallbackError('no server information');
            clearTimeout(requestTimeout);
        };
        request.open('GET', dataUrl, true);
        request.send(null);
    };

    /**
     * Wrapper that calls selectServer to run the httpLatencyTest and creates a serverData object
     * tracking different server parameters.
     * @param data object contains server the information
     */
    latencyBasedRouting.prototype.performLatencyBasedRouting = function (data) {
        this.beginTime = Date.now();
        var self = this;
        this.interval = setInterval(function () {
            self.monitor();
        }, 100);
        var serverInfo;
        for (var i = 0; i < data.length; i++) {
            serverInfo = data[i];
            var serverData = {
                'IPv4Address': serverInfo.IPv4Address,
                'IPv6Address': serverInfo.IPv6Address,
                'Fqdn': serverInfo.Fqdn,
                'Location': serverInfo.Location,
                'Sitename': serverInfo.Sitename,
                'latencyResult': 0
            };
            var url = 'http://' + serverInfo.IPv4Address + '/latency';
            self.selectServer(url, serverData);
        }

    };

    /**
     * Function selectServer performs the latency test against all the servers
     * and retunrs the server information with lowest latency to the client
     * @param url to perform latency test
     * @param data which contains server information {IPv4Address, IPv6Address, Fqdn}
     */
    latencyBasedRouting.prototype.selectServer = function (url, data) {
        var self = this;
        //latencyHttpOnComplete
        var latencyHttpOnComplete = function (result) {
            var latencySum = result.reduce(function (a, b) {
                return a.time + b.time;
            });
            data.latencyResult = latencySum;
            self.trackingServerInfo.push(data);
            self.numServersResponded++;
            if (self.numServersResponded === 3) {
                clearInterval(self.interval);
                // once we get the response from at least three server we abort all
                // other latency request for rest of the servers
                for (var i = 0; i < self.latencyHttpTestRequest.length; i++) {
                    self.latencyHttpTestRequest[i].abortAll();
                }

                self.trackingServerInfo = self.trackingServerInfo.sort(function (a, b) {
                    return +a.latencyResult - +b.latencyResult;
                });

                self.clientCallbackComplete(self.trackingServerInfo[0]);
            }

        };
        // creating latencyHttpTestSuite object for each server
        var latencyHttpTestSuite = new window.latencyHttpTest(url, 2, 3000, latencyHttpOnComplete, latencyHttpOnProgress,
            latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError);
        latencyHttpTestSuite.start();
        // pushing latencyHttpTestSuite for each server into an array
        self.latencyHttpTestRequest.push(latencyHttpTestSuite);
    };

    latencyBasedRouting.prototype.monitor = function () {

        if (Date.now() - this.beginTime > this.latencyBasedRoutingTimeout) {
            clearInterval(this.interval);
            if (this.trackingServerInfo && this.trackingServerInfo.length) {

                this.trackingServerInfo = this.trackingServerInfo.sort(function (a, b) {
                    return +a.latencyResult - +b.latencyResult;
                });

                this.clientCallbackComplete(this.trackingServerInfo[0]);
            } else {
                this.clientCallbackError('no server available');
            }
        }
    };

    function latencyHttpOnProgress() {
    }

    function latencyHttpOnAbort(result) {
        console.dir(result);
    }

    function latencyHttpOnTimeout(result) {
        console.dir(result);
    }

    function latencyHttpOnError(result) {
        console.dir(result);
    }

    window.latencyBasedRouting = latencyBasedRouting;

})();
