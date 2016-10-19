(function () {
    //setting the initialization method for upload test suite
    var oldOnload = window.onload;
    window.onload = function () {
        void (oldOnload instanceof Function && oldOnload());
        initUploadTest();
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
    function uploadHttpOnComplete(version, result) {
        auditTrail.push({ event: version + ': uploadHttpOnComplete', result: result });
        document.querySelector('.upload-' + version).value = result + ' Mbps';
        displayAuditTrail();
        var next = testRunner.shift();
        if (next) {
            next.start();
            return;
        }
        //restore ability to choose tests again
        testButton.disabled = false;
        var testTypes = document.querySelectorAll('input[name = "testType"]');
        for (var i = 0; i < testTypes.length; i++) {
            testTypes[i].disabled = false;
        }
    }

    //callback for xmlHttp progress event
    function uploadHttpOnProgress(version, result) {
        auditTrail.push({ event: version + ': uploadHttpOnProgress', result: result });
        displayAuditTrail();
    }

    //callback for xmlHttp error event
    function uploadHttpOnError(version, result) {
        auditTrail.push({ event: version + ': uploadHttpOnError', result: result });
        displayAuditTrail();
        var next = testRunner.shift();
        if (next) {
            next.start();
            return;
        }
        //restore ability to return tests again
        testButton.disabled = false;

        //restore ability to choose test type again
        var testTypes = document.querySelectorAll('input[name = "testType"]');
        for (var i = 0; i < testTypes.length; i++) {
            testTypes[i].disabled = false;
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
    function initUploadTest() {
        //update testButton variable with testButton dom node reference
        testButton = document.querySelector('.action-start');
        testButton.disabled = true;

        //register click event for http upload tests
        var testTypes = document.querySelectorAll('input[name = "testType"]');
        document.querySelector('.events').innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
        var callback = function (version, func) {
            return function (event) {
                func.call(this, event, version);
            };
        };
        for (var i = 0, fields, checked; i < testTypes.length; i++) {
            addEvent(testTypes[i], 'click', callback(testTypes[i].value, function (e, version) {
                var events = document.querySelector('.events');
                var el = e.target || e.srcElement;
                var checked = el.checked;
                var relatedEl = document.querySelectorAll('.' + version);
                var resultsEl = document.querySelector('.upload-' + version);
                var display = el.style.display;
                var value = el.value;
                //reset audit trail
                //reset audit trail list
                events.innerHTML = 'No Event Trail. <p>Click "Run Test" to begin</p>';
                //reset lowest upload value field
                resultsEl.style.display = (checked) ? 'block' : 'none';

                //clear both result types
                var resultsEl = document.querySelector('.upload-IPv4').value = '';
                var resultsEl = document.querySelector('.upload-IPv6').value = '';

                //toggle all related elements
                for (var i = 0; i < relatedEl.length; i++) {
                    relatedEl[i].style.display = (checked) ? 'block' : 'none';
                }
                //make sure at least one of ip version types is checked
                var anyChecked = !!document.querySelectorAll('input[name = "testType"]:checked').length;
                testButton.disabled = !anyChecked;
            }));

            //filelds related to test type (i.e. ipv4, ipv6).
            fields = document.querySelectorAll('.' + testTypes[i].value);
            for (var k = 0, checked; k < fields.length; k++) {
                checked = testTypes[i].checked;
                fields[k].style.display = (checked) ? 'block' : 'none';
            }
            //make sure at least one of ip version types is checked
            var anyChecked = !!document.querySelectorAll('input[name = "testType"]:checked').length;
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
            var testTypes = document.querySelectorAll('input[name = "testType"]');
            //create an instance of uploadHttpTest

            //set IPv6 version here
            var callback = function (version, func) {
                return function (results) {
                    func.call(this, version, results);
                };
            };

            //disable the checkbox while test is running
            //for all checked test types run the upload test
            for (var i = 0, testType, checked; i < testTypes.length; i++) {
                checked = testTypes[i].checked;
                testTypes[i].disabled = true;
                if (checked) {
                    testType = testTypes[i].value;
                    baseUrl = (testType === 'IPv6') ? '' : '';
                    testRunner.push(new window.uploadHttpConcurrent(baseUrl + '/upload', 'POST', 2, 15000, 15000,
                        callback(testType, uploadHttpOnComplete), callback(testType, uploadHttpOnProgress), callback(testType, uploadHttpOnError), 500000));
                }
            }
            var next = testRunner.shift();
            if (next) {
                next.start();
            }
        });
    }

})();
