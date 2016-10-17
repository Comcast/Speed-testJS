(function () {
    window.TestSeries = window.TestSeries || {};
    //setting the initialization method for latency test
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

    function latencyHttpOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnComplete', result: result });
        //we return the lowest calculated value
        var arr = result.sort(function (a, b) {
            return +a.time - +b.time;
        });
        //display to end user
        document.querySelector('.latency').value = arr[0].time + 'ms';
        displayAuditTrail();
    }

    function latencyHttpOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnProgress', result: result });
    }

    function latencyHttpOnAbort(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnAbort', result: result });
        displayAuditTrail();
    }

    function latencyHttpOnTimeout(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnTimeout', result: result });
        displayAuditTrail();
    }

    function latencyHttpOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyHttpOnError', result: result });
        displayAuditTrail();
    }

    function latencyWebSocketOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnComplete', result: result });
        displayAuditTrail();
    }

    function latencyWebSocketOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnProgress', result: result });
    }

    function latencyWebSocketOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'latencyWebSocketOnError', result: result });
        displayAuditTrail();
    }

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

    function initLatencyTest() {
        //update testButton variable with testButton dom node reference
        testButton = document.querySelector('.action-start');
        var auditButton = document.querySelector('.action-audit-trail');
        //register click event for http latency tests
        var testTypes = document.querySelectorAll('input[name = "testType"]');
        document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';

        for (var i = 0; i < testTypes.length; i++) {
            addEvent(testTypes[i], 'click', function () {
                //reset audit trail
                auditTrail = [];
                //reset audit trail list
                document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';
                //reset lowest latency value field
                document.querySelector('.latency').value = '';
            });
        }
        addEvent(testButton, 'click', function (e) {
            //prevent default click action in browser;
            e.preventDefault();
            testButton.disabled = true;
            //reset audit trail
            auditTrail = [];
            //reset audit trail list
            document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';
            //get test type value
            var testType = document.querySelector('input[name = "testType"]:checked').value;

            if (testType === 'http') {
                var latencyHttpTestSuite = new window.latencyHttpTest('/latency', 10, 30000, latencyHttpOnComplete, latencyHttpOnProgress,
                    latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError);
                latencyHttpTestSuite.start();
            } else if (testType === 'websockets') {
                var latencyWebSocketTest = new window.latencyWebSocketTest('ws://localhost:3001', 'GET', '0', '10', 3000, latencyWebSocketOnComplete,
                    latencyWebSocketOnProgress, latencyWebSocketOnError);
                latencyWebSocketTest.start();
            }
        });
    }

})();
