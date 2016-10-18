(function () {
    //setting the initialization method for download test suite
    window.onload = initDownloadTest;

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
    function downloadHttpOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadHttpOnComplete', result: result });
        //an array of results are returned
        //we return the lowest calculated value
        var arr = result.sort(function (a, b) {
            return +a.time - +b.time;
        });
        //display to end user
        document.querySelector('.download').value = arr[0].time + ' ms';
        displayAuditTrail();
    }

    //callback for xmlHttp progress event
    function downloadHttpOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadHttpOnProgress', result: result });
    }

    //callback for xmlHttp abort event
    function downloadHttpOnAbort(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadHttpOnAbort', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp timeout event
    function downloadHttpOnTimeout(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadHttpOnTimeout', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp error event
    function downloadHttpOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadHttpOnError', result: result });
        displayAuditTrail();
    }

    //callback for websocket complete event
    function downloadWebSocketOnComplete(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadWebSocketOnComplete', result: result });
        //we return the lowest calculated value
        var arr = result.sort(function (a, b) {
            return +a.time - +b.time;
        });
        //display to end user
        document.querySelector('.download').value = arr[0].time + 'ms';
        displayAuditTrail();
    }

    //callback for websocket progess event
    function downloadWebSocketOnProgress(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadWebSocketOnProgress', result: result });
    }

    //callback for websocket error event
    function downloadWebSocketOnError(result) {
        testButton.disabled = false;
        auditTrail.push({ event: 'downloadWebSocketOnError', result: result });
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
    function initDownloadTest() {
        //update testButton variable with testButton dom node reference
        testButton = document.querySelector('.action-start');
        var auditButton = document.querySelector('.action-audit-trail');

        //register click event for http download tests
        var testTypes = document.querySelectorAll('input[name = "testType"]');
        document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';

        for (var i = 0; i < testTypes.length; i++) {
            addEvent(testTypes[i], 'click', function () {
                //reset audit trail
                auditTrail = [];
                //reset audit trail list
                document.querySelector('.events').innerHTML = 'Click "Run Test" to begin';
                //reset lowest download value field
                document.querySelector('.download').value = '';
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
            var testType = document.querySelector('input[name = "testType"]:checked').value;

            if (testType === 'http') {
                //create an instance of downloadHttpTest
                var downloadHttpTestSuite = new window.downloadHttpTest('/download', 10, 30000, downloadHttpOnComplete, downloadHttpOnProgress,
                    downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError);
                //start downloadHttpTest
                downloadHttpTestSuite.start();
            } else if (testType === 'websockets') {
                //create an instance of downloadWebSocketTest
                var downloadWebSocketTest = new window.downloadWebSocketTest('ws://localhost:3001', 'GET', '0', '10', 3000, downloadWebSocketOnComplete,
                    downloadWebSocketOnProgress, downloadWebSocketOnError);
                //start downloadWebSocketTest
                downloadWebSocketTest.start();
            }
        });
    }

})();
