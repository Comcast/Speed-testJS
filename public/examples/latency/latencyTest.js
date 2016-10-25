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

    //setting the initialization method for latency test suite
    var oldOnload = window.onload;
    window.onload = function () {
        void (oldOnload instanceof Function && oldOnload());
        //init for test
        initTest();
    };

    //test button node will be made available through this variable
    var testButton;
    //private object to track event calls and results
    var auditTrail;
    //reference to event audit trail parent dom el
    var eventsEl;
    //test protocols
    var testProtocols;
    //reference to input elements allowing users to choose IP version for test
    var testVersions;
    //get the base url and server information from local node server to be used to run tests
    var testPlan;
    //array used to setup up ordering for test execution based on IP version
    var testRunner = [];
    //the type of test. options are upload, latency, latency
    var testType = 'latency';
    //event binding method for buttons
    function addEvent(el, ev, fn) {
        void (el.addEventListener && el.addEventListener(ev, fn, false));
        void (el.attachEvent && el.attachEvent('on' + ev, fn));
        void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
    }
    //get json with testPlan info
    function getTestPlan(func) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                //make testPlan data globally available to functions
                testPlan = JSON.parse(xhr.responseText);
                if (func) {
                    func(testPlan);
                }
            }
        }
        xhr.open('GET', '/testplan', true);
        xhr.send(null);
    }

    //callback for xmlHttp complete event
    function genericEventHandler(testName, testProtocol, version, results) {
        //store call in event audit trail
        auditTrail.push({ event: [version, testType, '-', testProtocol, ' : ', testName].join(''), results: results });
        //update field value
        if (testName === 'onComplete') {
            var arr = results.sort(function (a, b) {
                return +a.time - +b.time;
            });
            //display to end user
            document.querySelector(['.', testType, '-', testProtocol, '-', version].join('')).value = arr[0].time + 'ms';
        }
        //update the audit trail on screen
        displayAuditTrail();

        if (testName === 'onProgress') {
            return;
        }
        //if there are more tests to run
        var next = testRunner.shift();
        if (next) {
            next.initiateTest();
            return;
        }
        //if no other tests to run
        //restore ability to choose tests again
        testButton.disabled = false;

        for (var i = 0; i < testVersions.length; i++) {
            testVersions[i].disabled = (testVersions[i].value === 'IPv6' && !testPlan.hasIPv6) ? true : false;
        }
    };

    function onComplete(testProtocol, version, results) {
        genericEventHandler.call(undefined, 'onComplete', testProtocol, version, results);
    }

    //callback for xmlHttp error event
    function onError(testProtocol, version, results) {
        genericEventHandler.call(undefined, 'onError', testProtocol, version, results);
    }

    //callback for xmlHttp abort event
    function onAbort(testProtocol, version, results) {
        genericEventHandler.call(undefined, 'onAbort', testProtocol, version, results);
    }

    //callback for xmlHttp timeout event
    function onTimeout(testProtocol, version, results) {
        genericEventHandler.call(undefined, 'onTimeout', testProtocol, version, results);
    }

    //callback for xmlHttp progress event
    function onProgress(testProtocol, version, results) {
        genericEventHandler.call(undefined, 'onProgress', testProtocol, version, results);
    }

    //displays event trail from start to completion and they api results at those different points
    //creates table for displaying event audit trail
    function displayAuditTrail() {
        var arr = [];
        eventsEl.innerHTML = '';
        if (auditTrail.length) {
            arr.push('<table><tr><th></th><th>Event</th><th>Results</th></tr>');
            for (var i = 0; i < auditTrail.length; i++) {
                void (auditTrail[i].event && arr.push(
                    ['<tr>',
                        '<td>' + (i + 1) + '</td>',
                        '<td>' + auditTrail[i].event + '</td>',
                        '<td class="results">' + JSON.stringify(auditTrail[i].results) + '</td>',
                        '</tr>'].join('')));
            }
            arr.push('</table>');
            eventsEl.innerHTML = arr.join('');
        }
    }

    //basic click event binding
    function clickEventHandler(e, version) {
        var checked = {};
        var testVersionChecked;
        var testProtocolChecked;
        //reset audit trail
        //reset audit trail list
        eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
        for (var i = 0; i < testVersions.length; i++) {
            checked[testVersions[i].value] = testVersions[i].checked;
            if (testVersions[i].checked && !testVersionChecked) {
                testVersionChecked = true;
            }
        }

        for (var i = 0, el; i < testProtocols.length; i++) {
            checked[testProtocols[i].value] = testProtocols[i].checked;
            if (testProtocols[i].checked && !testProtocolChecked) {
                testProtocolChecked = true;
            }
        }

        document.querySelector('input.http.IPv4').style.display = (checked['http'] && checked['IPv4']) ? 'block' : 'none';
        document.querySelector('input.http.IPv4').value = '';
        document.querySelector('label.http.IPv4').style.display = (checked['http'] && checked['IPv4']) ? 'block' : 'none';
        document.querySelector('input.http.IPv6').style.display = (checked['http'] && checked['IPv6']) ? 'block' : 'none';
        document.querySelector('input.http.IPv6').value = '';
        document.querySelector('label.http.IPv6').style.display = (checked['http'] && checked['IPv6']) ? 'block' : 'none';
        document.querySelector('input.webSocket.IPv4').style.display = (checked['webSocket'] && checked['IPv4']) ? 'block' : 'none';
        document.querySelector('input.webSocket.IPv4').value = '';
        document.querySelector('label.webSocket.IPv4').style.display = (checked['webSocket'] && checked['IPv4']) ? 'block' : 'none';
        document.querySelector('input.webSocket.IPv6').style.display = (checked['webSocket'] && checked['IPv6']) ? 'block' : 'none';
        document.querySelector('input.webSocket.IPv6').value = '';
        document.querySelector('label.webSocket.IPv6').style.display = (checked['webSocket'] && checked['IPv6']) ? 'block' : 'none';
        testButton.disabled = !(testVersionChecked && testProtocolChecked);
    }

    //load event callback
    function initTest() {
        //get test plan and then run code
        getTestPlan(function (testPlan) {
            var testVersionChecked;
            var testProtocolChecked;
            //reference run test button dom element
            testButton = document.querySelector('.action-start');
            //reference to event trail parent element
            eventsEl = document.querySelector('.events');
            //register click event for http latency tests
            testVersions = document.querySelectorAll('input[name = "testVersion"]');

            //register click event for http latency tests
            testProtocols = document.querySelectorAll('input[name = "testProtocol"]');

            //set event audit trail text to default value
            eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
            var callback = function (version, func) {
                return function (event) {
                    func.call(this, event, version);
                };
            };

            var checked = {};
            //bind click event to each checkbox
            //this will also show/hide elements based on whether they are need for the test type or not

            for (var i = 0; i < testVersions.length; i++) {
                addEvent(testVersions[i], 'click', callback(testVersions[i].value, clickEventHandler));
                checked[testVersions[i].value] = testVersions[i].checked;
                if (testVersions[i].checked) {
                    testVersionChecked = true;
                }
                testVersions[i].disabled = (testVersions[i].value === 'IPv6' && !testPlan.hasIPv6);
            }

            for (var i = 0, el; i < testProtocols.length; i++) {
                addEvent(testProtocols[i], 'click', callback(testProtocols[i].value, clickEventHandler));
                checked[testProtocols[i].value] = testProtocols[i].checked;
                if (testProtocols[i].checked) {
                    testProtocolChecked = true;
                }
            }


            document.querySelector('input.http.IPv4').style.display = (checked['http'] && checked['IPv4']) ? 'block' : 'none';
            document.querySelector('label.http.IPv4').style.display = (checked['http'] && checked['IPv4']) ? 'block' : 'none';
            document.querySelector('input.http.IPv6').style.display = (checked['http'] && checked['IPv6']) ? 'block' : 'none';
            document.querySelector('label.http.IPv6').style.display = (checked['http'] && checked['IPv6']) ? 'block' : 'none';
            document.querySelector('input.webSocket.IPv4').style.display = (checked['webSocket'] && checked['IPv4']) ? 'block' : 'none';
            document.querySelector('label.webSocket.IPv4').style.display = (checked['webSocket'] && checked['IPv4']) ? 'block' : 'none';
            document.querySelector('input.webSocket.IPv6').style.display = (checked['webSocket'] && checked['IPv6']) ? 'block' : 'none';
            document.querySelector('label.webSocket.IPv6').style.display = (checked['webSocket'] && checked['IPv6']) ? 'block' : 'none';
            testButton.disabled = !(testVersionChecked && testProtocolChecked);

            //add click event on "run test" button
            addEvent(testButton, 'click', function (e) {
                //prevent default click action in browser;
                var baseUrl = '';
                e.preventDefault();

                testButton.disabled = true;
                //reset audit trail
                auditTrail = [];
                //reset audit trail list
                eventsEl.innerHTML = '';

                //set IPversion here
                var callback = function (testProtocol, version, func) {
                    return function (results) {
                        func.call(this, testProtocol, version, results);
                    };
                };

                var checked = {};
                //bind click event to each checkbox
                //this will also show/hide elements based on whether they are need for the test type or not
                for (var i = 0; i < testProtocols.length; i++) {
                    checked[testProtocols[i].value] = testProtocols[i].checked;
                }
                if (testPlan) {
                    for (var i = 0, testVersion; i < testVersions.length; i++) {
                        testVersion = testVersions[i].value;
                        checked[testVersion] = testVersions[i].checked;
                        for (var k = 0, testProtocol; k < testProtocols.length; k++) {
                            testProtocol = testProtocols[k].value;
                            checked[testProtocol] = testProtocols[k].checked;
                            if (testProtocol === 'http' && (checked[testVersion] && checked[testProtocol])) {
                                //create an instance of latencyHttpTest
                                baseUrl = ['http://', testPlan['baseUrl' + testVersion], '/latency'].join('');
                                testRunner.push(new window.latencyHttpTest(baseUrl, 10, 30000, callback('http', testVersion, onComplete), callback('http', testVersion, onProgress),
                                    callback(testProtocol, testVersion, onAbort), callback(testVersion, onTimeout), callback('http', testVersion, onError)));
                                //start latencyHttpTest
                            } else if (testProtocol === 'webSocket' && (checked[testVersion] && checked[testProtocol])) {
                                //create an instance of latencyWebSocketTest
                                baseUrl = [testPlan['webSocketUrl' + testVersion], '/latency'].join('');
                                testRunner.push(new window.latencyWebSocketTest(baseUrl, 'GET', '0', '10', 3000, callback('webSocket', testVersion, onComplete),
                                    callback(testProtocol, testVersion, onProgress), callback('webSocket', testVersion, onError)));
                                //start latencyWebSocketTest
                            }
                        }
                    }
                }

                var next = testRunner.shift();
                if (next) {
                    next.initiateTest();
                }
            });

        });

    }

})();


