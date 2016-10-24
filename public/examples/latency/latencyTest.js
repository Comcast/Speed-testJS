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
    //setting the initialization method for latency test suite
    window.onload = initLatencyTest;

    //test button node will be made available through this variable
    var testButton;
    var auditTrail = [];
    //event binding method for buttons
    function addEvent(el, ev, fn) {
        void (el.addEventListener && el.addEventListener(ev, fn, false));
        void (el.attachEvent && el.attachEvent('on' + ev, fn));
        void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
    }

    //callback for xmlHttp complete event
    function latencyHttpOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnComplete', result: result });
        //an array of results are returned
        //we return the lowest calculated value
        var arr = result.sort(function (a, b) {
            return +a.time - +b.time;
        });
        //display to end user
        document.querySelector('.latency').value = arr[0].time + ' ms';
        displayAuditTrail();
    }

    //callback for xmlHttp progress event
    function latencyHttpOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnProgress', result: result });
    }

    //callback for xmlHttp abort event
    function latencyHttpOnAbort(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnAbort', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp timeout event
    function latencyHttpOnTimeout(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnTimeout', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp error event
    function latencyHttpOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnError', result: result });
        displayAuditTrail();
    }

    //callback for websocket complete event
    function latencyWebSocketOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnComplete', result: result });
        //we return the lowest calculated value
        var arr = result.sort(function (a, b) {
            return +a.time - +b.time;
        });
        //display to end user
        document.querySelector('.latency').value = arr[0].time + 'ms';
        displayAuditTrail();
    }

    //callback for websocket progess event
    function latencyWebSocketOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnProgress', result: result });
    }

    //callback for websocket error event
    function latencyWebSocketOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnError', result: result });
        displayAuditTrail();
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
                        '<td>' + JSON.stringify(auditTrail[i].result) + '</td>',
                        '</tr>'].join('')));
            }
            arr.push('</table>');
            events.innerHTML = arr.join('');
        }
    }
    //load event callback
    function initLatencyTest() {
        //update testButton variable with testButton dom node reference
        testButton = document.querySelector('.action-start');

        //register click event for http latency tests
        var testVersions = document.querySelectorAll('input[name = "testVersion"]');
        document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';

        for (var i = 0; i < testVersions.length; i++) {
            addEvent(testVersions[i], 'click', function () {
                //reset audit trail
                auditTrail = [];
                //reset audit trail list
                document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';
                //reset lowest latency value field
                document.querySelector('.latency').value = '';
            });
        }

        //add event
        addEvent(testButton, 'click', function (e) {
            //prevent default click action in browser;
            e.preventDefault();
            testButton.disabled = true;
            //reset audit trail
            auditTrail = [];
            //reset audit trail list
            document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';
            //get test type value
            var testVersion = document.querySelector('input[name = "testVersion"]:checked').value;

            if (testVersion === 'http') {
                //create an instance of latencyHttpTest
                var latencyHttpTestSuite = new window.latencyHttpTest('/latency', 10, 30000, latencyHttpOnComplete, latencyHttpOnProgress,
                    latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError);
                //start latencyHttpTest
                latencyHttpTestSuite.start();
            } else if (testVersion === 'websockets') {
                //create an instance of latencyWebSocketTest
                var latencyWebSocketTest = new window.latencyWebSocketTest('ws://localhost:3001', 'GET', '0', '10', 3000, latencyWebSocketOnComplete,
                    latencyWebSocketOnProgress, latencyWebSocketOnError);
                //start latencyWebSocketTest
                latencyWebSocketTest.start();
            }
        });
    }

})();
