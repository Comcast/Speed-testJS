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
        initDownloadTest();
    };

    //test button node will be made available through this variable
    var testButton;
    var currentTest;
    var auditTrail;
    var eventsEl;
    var testVersions;
    var testRunner = [];
    var testType = 'download';
    //event binding method for buttons
    function addEvent(el, ev, fn) {
        void (el.addEventListener && el.addEventListener(ev, fn, false));
        void (el.attachEvent && el.attachEvent('on' + ev, fn));
        void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
    }

    //callback for xmlHttp complete event
    function genericEventHandler(testName, version, result) {
        //store call in event audit trail
        auditTrail.push({ event: [version, typeType, ': ', testName].join(''), result: result });
        //update field value
        document.querySelector(['.', testType, '-', version].join('')).value = result + ' Mbps';
        //update the audit trail on screen
        displayAuditTrail();
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
            testVersions[i].disabled = false;
        }
    };

    function onComplete(version, results) {
        return function () {
            genericEventHandler.call(this, 'onComplete', version, results);
        };
    }

    //callback for xmlHttp error event
    function onError(version, result) {
        return function () {
            genericEventHandler.call(this, 'onError', version, results);
        };
    }

    //callback for xmlHttp abort event
    function onAbort(version, result) {
        return function () {
            genericEventHandler.call(this, 'onAbort', version, results);
        };
    }

    //callback for xmlHttp timeout event
    function onTimeout(version, result) {
        return function () {
            genericEventHandler.call(this, 'onTimeout', version, results);
        };
    }

    //callback for xmlHttp progress event
    function onProgress(version, result) {
        auditTrail.push({ event: [version, testType, ': onProgress'].join(''), result: result });
        displayAuditTrail();
    }

    //displays event trail from start to completion and they api results at those different points
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
                        '<td class="results">' + JSON.stringify(auditTrail[i].result) + '</td>',
                        '</tr>'].join('')));
            }
            arr.push('</table>');
            eventsEl.innerHTML = arr.join('');
        }
    }
    //load event callback
    function initDownloadTest() {
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
            addEvent(testVersions[i], 'click', callback(testVersions[i].value, function (e, version) {
                var el = e.target || e.srcElement;
                var checked = el.checked;
                var relatedEl = document.querySelectorAll('.' + version);
                var resultsEl = document.querySelector('.download-' + version);
                var display = el.style.display;
                var value = el.value;
                //reset audit trail
                //reset audit trail list
                eventsEl.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
                //reset lowest download value field
                resultsEl.style.display = (checked) ? 'block' : 'none';

                //clear both result types
                var resultsEl = document.querySelector('.download-IPv4').value = '';
                var resultsEl = document.querySelector('.download-IPv6').value = '';

                //toggle all related elements
                for (var i = 0; i < relatedEl.length; i++) {
                    relatedEl[i].style.display = (checked) ? 'block' : 'none';
                }
                //make sure at least one of ip version types is checked
                var anyChecked = !!document.querySelectorAll('input[name = "testVersion"]:checked').length;
                testButton.disabled = !anyChecked;
            }));

            //filelds related to test type (i.e. ipv4, ipv6).
            fields = document.querySelectorAll('.' + testVersions[i].value);
            for (var k = 0, checked; k < fields.length; k++) {
                checked = testVersions[i].checked;
                fields[k].style.display = (checked) ? 'block' : 'none';
            }
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
            //get test type value
            var testVersions = document.querySelectorAll('input[name = "testVersion"]');
            //create an instance of downloadHttpTest

            //set IPversion here
            var callback = function (version, func) {
                return function (results) {
                    func.call(this, version, results);
                };
            };

            //disable the checkbox while test is running
            //for all checked test types run the download test
            for (var i = 0, testVersion, checked; i < testVersions.length; i++) {
                checked = testVersions[i].checked;
                testVersions[i].disabled = true;
                if (checked) {
                    testVersion = testVersions[i].value;
                    baseUrl = (testVersion === 'IPv6') ? '' : '';
                    testRunner.push(new window.downloadHttpConcurrent(baseUrl + '/download?bufferSize=100000000', 'GET', 4, 15000, 10000,
                        callback(testVersion, onComplete), callback(testVersion, onProgress), callback(testVersion, onAbort),
                        callback(testVersion, onTimeout), callback(testVersion, onError)));

                }
            }
            var next = testRunner.shift();
            if (next) {
                next.start();
            }
        });
    }

})();
