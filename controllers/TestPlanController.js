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

'use strict';

var validateIP = require('validate-ip-node');
var os = require('os');

/**
 * Class representing a TestPlanController.
 */
class TestPlanController {

    /**
     * Create a TestPlanController.
     * @param {express.Router()} router.
     * @param {string} ipv4 - ipv4 address.
     * @param {string} ipv6 - ipv6 address.
     */
    constructor(router, ipv4, ipv6) {
        this.router = router;
        this.ipv4 = ipv4;
        this.ipv6 = ipv6;
        this.registerRoutes();
    }

    /**
     * Register the route for Express.
     */
    registerRoutes() {
        this.router.get('/testplan', this.getTestPlan.bind(this));
    }

    /**
     * endpoint to return response.
     * @param {request} req - http request.
     * @param {response} res - http response.
     */
    getTestPlan(req, res) {
        var testPlan = {};
        //to get the hostname of the operating system
        testPlan.osHostName = os.hostname();
        //flag to turn on/off the latency based routing the test
        testPlan.performLatencyRouting = false;
        //get client ip address
        var ipaddress = req.connection.remoteAddress;
        if (validateIP(ipaddress)) {
            //running locally return machine ipv4 address
            if (req.headers.host.indexOf("localhost") > -1) {
                testPlan.clientIPAddress = global.AddressIpv4;
            }
            else {
                //format ip address it is normal remove ff ie...  ::ffff:10.36.107.238
                if (ipaddress.indexOf("ff") > -1) {
                    var ipAddressArray = ipaddress.split(':');
                    for (var i = 0; i < ipAddressArray.length; i++) {
                        if (ipAddressArray[i].indexOf('.') > -1) {
                            testPlan.clientIPAddress = ipAddressArray[i];
                        }
                    }
                } else {
                    testPlan.clientIPAddress = ipaddress;
                }
            }
        }
        else {
            testPlan.clientIPAddress = 'na';
        }
        //set server base url
        testPlan.webSocketUrlIPv4 = 'ws://' + global.AddressIpv4 + ':' + global.webSocketPort;
        testPlan.webSocketPort = global.webSocketPort;
        if (global.hasAddressIpv6) {
            testPlan.hasIPv6 = true;
            testPlan.baseUrlIPv6 = '[' + global.AddressIpv6 + ']:' + global.webPort;
            testPlan.baseUrlIPv6NoPort = '[' + global.AddressIpv6 + ']';
            //TODO to investigate ipv6 address for localhost web sockets
            testPlan.webSocketUrlIPv6 = 'ws://v6-' + testPlan.osHostName + ':' + global.webSocketPort;
        } else {
            testPlan.hasIPv6 = false;
        }
        testPlan.baseUrlIPv4 = global.AddressIpv4 + ':' + global.webPort;
        testPlan.baseUrlIPv4NoPort = global.AddressIpv4;
        testPlan.port = global.webPort;
        testPlan.maxDownloadSize = global.maxDownloadBuffer;
        testPlan.maxuploadSize = global.maxUploadBuffer;
        res.json(testPlan);
    }

}

module.exports = TestPlanController;
