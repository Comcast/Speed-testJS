(function () {
    window.TestSeries = window.TestSeries || {};
    window.onload = initLatencyTest;

    //event binding method for buttons
    function addEvent(el, ev, fn) {
        void (el.addEventListener && el.addEventListener(ev, fn, false));
        void (el.attachEvent && el.attachEvent('on' + ev, fn));
        void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
    }

    function latencyHttpOnComplete(result) {
        displayResults('.status', 'latencyHttpOnComplete');
    }
    function latencyHttpOnProgress(result) {
        displayResults('.status', 'latencyHttpOnProgress');
        displayResults('.latency', result.time);
        displayResults('.test-results', JSON.stringify(result));
    }
    function latencyHttpOnAbort(result) {
        displayResults('.status', 'latencyHttpOnAbort');
    }
    function latencyHttpOnTimeout(result) {
        displayResults('.status', 'latencyHttpOnTimeout');
    }
    function latencyHttpOnError(result) {
        displayResults('.status', 'latencyHttpOnError');
    }

    function latencyWebSocketOnComplete(result) {
        displayResults('.status', 'latencyWebSocketOnComplete');
    }
    function latencyWebSocketOnProgress(result) {
        displayResults('.status', 'latencyWebSocketOnProgress');
        displayResults('.latency', result.time);
        displayResults('.test-results', JSON.stringify(result));
    }
    function latencyWebSocketOnError(result) {
        displayResults('.status', 'latencyWebSocketOnError');
    }

    function displayResults(selector, content) {
        var results = document.querySelector(selector);
        if (results && results.value) {
            results.value = content || '';
            return;
        } 
       results.innerHTML= content || '';
    }

    function initLatencyTest() {
        var testButton = document.querySelector('.action-start');
        //register click event for http latency tests
        addEvent(testButton, 'click', function (e) {
            //prevent default click action in browser;
            e.preventDefault();
            var testType = document.querySelector('input[name = "testType"]:checked').value;
            //clear the display results;
            displayResults('.status', '');
            displayResults('.latency', '');
            displayResults('.test-results', '');

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