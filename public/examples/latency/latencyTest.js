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
    //setting the initialization method for download test suite
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
    //the type of test. options are upload, download, latency
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
            next.start();
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
        var el = e.target || e.srcElement;
        var checked = el.checked;
        var relatedEl = document.querySelectorAll('.' + version);
        var resultsEl = document.querySelectorAll(['.', testType, '-result'].join(''));
        //reset audit trail
        //reset audit trail list
        eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
        //reset lowest download value field

        //reset results input values
        for (var i = 0; i < resultsEl.length; i++) {
            resultsEl[i].value = '';
        }

        //toggle all related elements
        for (var i = 0; i < relatedEl.length; i++) {
            relatedEl[i].style.display = (checked) ? 'block' : 'none';
        }
        
        //make sure at least one of ip version types is checked
        var testVersionChecked = !!document.querySelectorAll('input[name = "testVersion"]:checked').length;
        var testProtocolChecked = !!document.querySelectorAll('input[name = "testProtocol"]:checked').length;
        testButton.disabled = !testVersionChecked && !testProtocolChecked;
    }

    //load event callback
    function initTest() {
        //get test plan and then run code
        getTestPlan(function (testPlan) {
            //reference run test button dom element
            testButton = document.querySelector('.action-start');
            //reference to event trail parent element
            eventsEl = document.querySelector('.events');
            //disable testButton until a test version is chosen
            testButton.disabled = true;
            //register click event for http download tests
            testVersions = document.querySelectorAll('input[name = "testVersion"]');

            //register click event for http download tests
            testProtocols = document.querySelectorAll('input[name = "testProtocol"]');

            //set event audit trail text to default value
            eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
            var callback = function (version, func) {
                return function (event) {
                    func.call(this, event, version);
                };
            };
            //bind click event to each checkbox
            //this will also show/hide elements based on whether they are need for the test type or not

            for (var i = 0, fields, checked, testVersionChecked; i < testVersions.length; i++) {
                addEvent(testVersions[i], 'click', callback(testVersions[i].value, clickEventHandler));

                //filelds and labels related to test type (i.e. IPv4, IPv6).
                fields = document.querySelectorAll('.' + testVersions[i].value);
                for (var k = 0, checked; k < fields.length; k++) {
                    checked = testVersions[i].checked;
                    fields[k].style.display = (checked) ? 'block' : 'none';
                }
                testVersions[i].disabled = (testVersions[i].value === 'IPv6' && !testPlan.hasIPv6) ? true : false;
                //make sure at least one ip version is checked
                testVersionsChecked = !!document.querySelectorAll('input[name = "testVersion"]:checked').length;
                testButton.disabled = !testVersionChecked;
            }


            for (var i = 0, fields, checked, anyChecked, testProtocolChecked; i < testProtocols.length; i++) {
                addEvent(testProtocols[i], 'click', callback(testProtocols[i].value, clickEventHandler));

                //filelds and labels related to test protocol (i.e. http, webSocket).
                fields = document.querySelectorAll('.' + testProtocols[i].value);
                for (var k = 0, checked; k < fields.length; k++) {
                    checked = testProtocols[i].checked;
                    fields[k].style.display = (checked) ? 'block' : 'none';
                }
                //make sure at least one protocols is checked
                testProtocolChecked = !!document.querySelectorAll('input[name = "testProtocol"]:checked').length;
                testButton.disabled = !testProtocolChecked;
            }

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

                //disable the checkbox while test is running
                //for all checked test types run the download test
                for (var i = 0, testVersion, testProtocol, checked; i < testVersions.length; i++) {
                    checked = testVersions[i].checked && !testVersions[i].disabled;
                    if (checked) {
                        //disable all testVersions
                        testVersions[i].disabled = true;
                        //empty all input fields
                        var resultsEl = document.querySelectorAll(['.', testType, '-result'].join(''));
                        for (var k = 0; k < resultsEl.length; k++) {
                            resultsEl[k].value = '';
                        }
                        //IP version
                        testVersion = testVersions[i].value;
                        for (var k = 0; k < testProtocols.length; k++) {
                            testProtocol = testProtocols[k].value;
                            if (testPlan && testPlan['baseUrl' + testVersion]) {
                                if (testProtocol === 'http') {
                                    //create an instance of latencyHttpTest
                                    baseUrl = ['http://', testPlan['baseUrl' + testVersion], '/latency'].join('');
                                    testRunner.push(new window.latencyHttpTest(baseUrl, 10, 30000, callback('http', testVersion, onComplete), callback('http', testVersion, onProgress),
                                        callback(testProtocol, testVersion, onAbort), callback(testVersion, onTimeout), callback('http', testVersion, onError)));
                                    //start latencyHttpTest
                                }
                                if (testProtocol === 'webSocket') {
                                    //create an instance of latencyWebSocketTest
                                    baseUrl = [testPlan['webSocketUrl' + testVersion], '/latency'].join('');
                                    testRunner.push(new window.latencyWebSocketTest(baseUrl, 'GET', '0', '10', 3000, callback('webSocket', testVersion, onComplete),
                                        callback(testProtocol, testVersion, onProgress), callback('webSocket', testVersion, onError)));
                                    //start latencyWebSocketTest
                                }
                            }

                        }
                    }
                }
                var next = testRunner.shift();
                if (next) {
                    next.start();
                }
            });

        });

    }

})();

