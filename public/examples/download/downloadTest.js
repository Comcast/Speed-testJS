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
    var testRunner = [];
    //event binding method for buttons
    function addEvent(el, ev, fn) {
        void (el.addEventListener && el.addEventListener(ev, fn, false));
        void (el.attachEvent && el.attachEvent('on' + ev, fn));
        void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
    }

    //callback for xmlHttp complete event
    function downloadHttpOnComplete(version, result) {
        auditTrail.push({ event: version + ': downloadHttpOnComplete', result: result });
        document.querySelector('.download-' + version).value = result + ' Mbps';
        displayAuditTrail();
        var next = testRunner.shift();
        if (next) {
            next.start();
            return;
        }
        //restore ability to choose tests again
        testButton.disabled = false;
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        for (var i = 0; i < testVersions.length; i++) {
            testVersions[i].disabled = false;
        }
    }

    //callback for xmlHttp progress event
    function downloadHttpOnProgress(version, result) {
        auditTrail.push({ event: version + ': downloadHttpOnProgress', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp error event
    function downloadHttpOnError(version, result) {
        auditTrail.push({ event: version + ': downloadHttpOnError', result: result });
        displayAuditTrail();
        var next = testRunner.shift();
        if (next) {
            next.start();
            return;
        }
        //restore ability to return tests again
        testButton.disabled = false;

        //restore ability to choose test type again
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        for (var i = 0; i < testVersions.length; i++) {
            testVersions[i].disabled = false;
        }
    }

    //callback for xmlHttp abort event
    function downloadHttpOnAbort(version, result) {
        auditTrail.push({ event: version + ': downloadHttpOnAbort', result: result });
        displayAuditTrail();

        //restore ability to choose tests again
        testButton.disabled = false;
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        for (var i = 0; i < testVersions.length; i++) {
            testVersions[i].disabled = false;
        }
    }

    //callback for xmlHttp timeout event
    function downloadHttpOnTimeout(version, result) {
        auditTrail.push({ event: version + ': downloadHttpOnTimeout', result: result });
        displayAuditTrail();
        var next = testRunner.shift();

        //restore ability to return tests again
        testButton.disabled = false;

        //restore ability to choose test type again
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        for (var i = 0; i < testVersions.length; i++) {
            testVersions[i].disabled = false;
        }
    }


    //displays event trail from start to completion and they api results at those different points
    function displayAuditTrail() {
        var arr = [];
        var events = document.querySelector('.events');
        events.innerHTML = '';
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
            events.innerHTML = arr.join('');
        }
    }
    //load event callback
    function initDownloadTest() {
        //update testButton variable with testButton dom node reference
        testButton = document.querySelector('.action-start');
        testButton.disabled = true;

        //register click event for http download tests
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        document.querySelector('.events').innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
        var callback = function (version, func) {
            return function (event) {
                func.call(this, event, version);
            };
        };
        for (var i = 0, fields, checked; i < testVersions.length; i++) {
            addEvent(testVersions[i], 'click', callback(testVersions[i].value, function (e, version) {
                var events = document.querySelector('.events');
                var el = e.target || e.srcElement;
                var checked = el.checked;
                var relatedEl = document.querySelectorAll('.' + version);
                var resultsEl = document.querySelector('.download-' + version);
                var display = el.style.display;
                var value = el.value;
                //reset audit trail
                //reset audit trail list
                events.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
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
            document.querySelector('.events').innerHTML = '';
            //get test type value
            var testVersions = document.querySelectorAll('input[name = "testVersion"]');
            //create an instance of downloadHttpTest

            //set IPv6 version here
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
                        callback(testVersion, downloadHttpOnComplete), callback(testVersion, downloadHttpOnProgress), callback(testVersion, downloadHttpOnAbort),
                        callback(testVersion, downloadHttpOnTimeout), callback(testVersion, downloadHttpOnError)));

                }
            }
            var next = testRunner.shift();
            if (next) {
                next.start();
            }
        });
    }

})();
