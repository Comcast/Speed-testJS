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
    
    //setting the initialization method for download test suite
    var oldOnload = window.onload;
    window.onload = function () {
        void (oldOnload instanceof Function && oldOnload());
        //probe for test size
        downloadProbe();

    };

    //test button node will be made available through this variable
    var testButton;
    //private object to track event calls and results
    var auditTrail;
    //reference to event audit trail parent dom el
    var eventsEl;
    //reference to input elements allowing users to choose IP version for test
    var testVersions;
    //get the base url and server information from local node server to be used to run tests
    var testPlan;
    //array used to setup up ordering for test execution based on IP version
    var testRunner = [];
    //the type of test. options are upload, download, latency
    var testType = 'download';
    //default download size
    var downloadSize = 1000000;
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
    //Download probe tests a small download sample and returns the download file size to be used in download bandwith testing
    function downloadProbe() {
        function downloadProbeTestOnComplete(result) {
            var downloadSizes = result;
            if(downloadSizes.length>0) {
                //downloadSize = downloadSizes[downloadSizes.length-1];
                downloadSize = downloadSizes[0];
            }
               initTest();
        }

        function downloadProbeTestOnError(result) {
             initTest();
        }
        var downloadProbeTestRun = new window.downloadProbeTest('/download?bufferSize='+downloadSize, '/downloadProbe', false, 3000,762939,downloadProbeTestOnComplete,
            downloadProbeTestOnError);
        downloadProbeTestRun.start();

    }


    //callback for xmlHttp complete event
    function genericEventHandler(testName, version, results) {
        //store call in event audit trail
        auditTrail.push({ event: [version, testType, ': ', testName].join(''), results: results });
        //update field value
        if (testName === 'onComplete') {
            document.querySelector(['.', testType, '-', version].join('')).value = results + ' Mbps';
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

    function onComplete(version, results) {
        genericEventHandler.call(undefined, 'onComplete', version, results);
    }

    //callback for xmlHttp error event
    function onError(version, results) {
        genericEventHandler.call(undefined, 'onError', version, results);
    }

    //callback for xmlHttp abort event
    function onAbort(version, results) {
        genericEventHandler.call(undefined, 'onAbort', version, results);
    }

    //callback for xmlHttp timeout event
    function onTimeout(version, results) {
        genericEventHandler.call(undefined, 'onTimeout', version, results);
    }

    //callback for xmlHttp progress event
    function onProgress(version, results) {
        genericEventHandler.call(undefined, 'onProgress', version, results);
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
        var anyChecked = !!document.querySelectorAll('input[name = "testVersion"]:checked').length;
        testButton.disabled = !anyChecked;
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
            //set event audit trail text to default value
            eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
            var callback = function (version, func) {
                return function (event) {
                    func.call(this, event, version);
                };
            };
            //bind click event to each checkbox
            //this will also show/hide elements based on whether they are need for the test type or not

            for (var i = 0, fields, checked; i < testVersions.length; i++) {
                addEvent(testVersions[i], 'click', callback(testVersions[i].value, clickEventHandler));

                //filelds and labels related to test type (i.e. ipv4, ipv6).
                fields = document.querySelectorAll('.' + testVersions[i].value);
                for (var k = 0, checked; k < fields.length; k++) {
                    checked = testVersions[i].checked;
                    fields[k].style.display = (checked) ? 'block' : 'none';
                }
                testVersions[i].disabled = (testVersions[i].value === 'IPv6' && !testPlan.hasIPv6) ? true : false;
                //make sure at least one of ip version types is checked
                var anyChecked = !!document.querySelectorAll('input[name = "testVersion"]:checked').length;
                testButton.disabled = !anyChecked;
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
                var callback = function (version, func) {
                    return function (results) {
                        func.call(this, version, results);
                    };
                };

                //disable the checkbox while test is running
                //for all checked test types run the download test
                for (var i = 0, testVersion, checked; i < testVersions.length; i++) {
                    checked = testVersions[i].checked && !testVersions[i].disabled;
                    if (checked) {
                        testVersions[i].disabled = true;
                        var resultsEl = document.querySelectorAll(['.', testType, '-result'].join(''));
                        for (var k = 0; k < resultsEl.length; k++) {
                            resultsEl[k].value = '';
                        }
                        testVersion = testVersions[i].value;
                        if (testPlan && testPlan['baseUrl' + testVersion]) {
                            baseUrl = ['http://', testPlan['baseUrl' + testVersion], '/download?bufferSize='+downloadSize].join('');
                            testRunner.push(new window.downloadHttpConcurrentProgress(baseUrl, 'GET', 6, 15000, 15000,10,
                                callback(testVersion, onComplete), callback(testVersion, onProgress), callback(testVersion, onAbort),
                                callback(testVersion, onTimeout), callback(testVersion, onError)));
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