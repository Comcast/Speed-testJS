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

    var testRunner = [];
    var currentInterval;
    var testButtonText = 'Start';
    var testPlan;
    var myChart;
    var option;
    var startTestButton;
    var firstRun = true;

    function initTest() {
        function addEvent(el, ev, fn) {
            void (el.addEventListener && el.addEventListener(ev, fn, false));
            void (el.attachEvent && el.attachEvent('on' + ev, fn));
            void (!(el.addEventListener || el.attachEvent) && function (el, ev) { el['on' + ev] = fn } (el, ev));
        }
        startTestButton = document.querySelector(".action-start");
        addEvent(startTestButton, 'click', function () {
            startTest();
        });
        getTestPlan(function (testPlan) {
            //initialize speedometer
            myChart = echarts.init(document.querySelector('.speed-gauge'));
            option = {
                series: [
                    {
                        name: 'Download',
                        type: 'gauge',
                        min: 0,
                        max: 1000,
                        precision: 2,
                        axisLine: {
                            show: true,
                            lineStyle: {
                                color: [[0.1, '#ff4500'], [0.3, '#ffa700'], [1, '#5bc942']],
                                width: 30,
                                type: 'solid'
                            }
                        },
                        axisTick: {
                            show: true,
                            splitNumber: 5,
                            length: 8,
                            lineStyle: {
                                color: '#000',
                                width: 1,
                                type: 'solid'
                            }
                        },
                        detail: {
                            formatter: '{value}',
                            show: false,
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderWidth: 0,
                            borderColor: '#ccc',
                            width: 100,
                            height: 20,
                            offsetCenter: [0, '40%'],
                            textStyle: {
                                color: 'auto',
                                fontSize: 20
                            }
                        },
                        data: [{ value: 0, name: '' }]
                    }
                ]
            };

            option.series[0].data[0].value = 0;
            option.series[0].data[0].name = '';
            option.series[0].detail.formatter = '';
            myChart.setOption(option, true);

            //show ipv6 fields if supported
            var resultsEl = document.querySelectorAll('.IPv6');
            if (testPlan.hasIPv6) {
                for (var i = 0; i < resultsEl.length; i++) {
                    resultsEl[i].style.display = 'block';
                }
            }
        });
    }

    function updateCurrentValue(currentLabel, currentValue) {
        return function () {
            option.series[0].data[0].value = currentValue;
            option.series[0].data[0].name = currentLabel;
            myChart.setOption(option, true);
        };
    }

    function getTestPlan(func) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var data = JSON.parse(xhr.responseText);
                testPlan = data;
                void ((func && func instanceof Function) && func(data));
            }
        };
        xhr.open('GET', '/testplan', true);
        xhr.send(null);
    }

    function startTest() {
        if (firstRun) {
            firstRun = false;
        } else {
            var resultsEl = document.querySelectorAll('.test-result');
            for (var i = 0; i < resultsEl.length; i++) {
                resultsEl[i].innerHTML = '';
            }
        }
        latencyTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4');
        //we reset here in case the user starts another test
        //it is a limitation in the google gauges that you can only update in setInterval
        //so we basically recreate the gagues if the user start another test run.
        startTestButton.disabled = true;
        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Testing in Progress ...';
        startTestButton.style.cursor = 'not-allowed';
        startTestButton.style.backgroundColor = '#d1d1d1';
    }

    function formatSpeed(value) {
        var value = parseFloat(Math.round(value * 100) / 100).toFixed(2);
        value = (value > 1000) ? parseFloat(value / 1000).toFixed(2) + ' Gbps' : value + ' Mbps';
        return value;
    }

    function latencyTest(version) {
        var currentTest = 'latency';
        option.series[0].data[0].value = 0;
        option.series[0].data[0].name = '';
        option.series[0].detail.formatter = '{value} ms';
        option.series[0].detail.show = false;
        myChart.setOption(option, true);

        function latencyHttpOnComplete(result) {
            void (version === 'IPv6' && latencyTest('IPv4'));
            void (!(version === 'IPv6') && setTimeout(function () { downloadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'); }, 500));
            result = result.sort(function (a, b) {
                return +a.time - +b.time;
            });
            updateValue(currentTest, result[0].time + ' ms');
        }

        function latencyHttpOnProgress(result) {
            option.series[0].data[0].value = result.time;
            myChart.setOption(option, true);
        }

        function latencyHttpOnAbort(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }

        function latencyHttpOnTimeout(result) {
            if (version === 'IPv6') {
                testPlan.hasIPv6 = false;
                //hide IPv6 related dom elements
                latencyTest('IPv4');
            }
        }

        function latencyHttpOnError(result) {
            if (version === 'IPv6') {
                testPlan.hasIPv6 = false;
                latencyTest('IPv4');
            }
        }

        var baseUrl = (version === 'IPv6') ? 'http://' + testPlan.baseUrlIPv6 + '/latency' : 'http://' + testPlan.baseUrlIPv4 + '/latency';

        var latencyHttpTestSuite = new window.latencyHttpTest(baseUrl, 20, 3000, latencyHttpOnComplete, latencyHttpOnProgress,
            latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError);
        latencyHttpTestSuite.initiateTest();
    }

    function updateValue(selector, value) {
        var sel = ['.', selector, '-result'].join('');
        var dom = document.querySelector(sel);

        if (dom) {
            dom.innerHTML = value;
        }
    }

    function downloadTest(version) {
        var currentTest = 'download';
        option.series[0].data[0].value = 0;
        option.series[0].data[0].name = 'Testing Download ...';
        option.series[0].detail.formatter = formatSpeed;
        option.series[0].detail.show = true;
        myChart.setOption(option, true);

        function calculateStatsonComplete(result) {
            var finalValue = parseFloat(Math.round(result.stats.mean * 100) / 100).toFixed(2);
            finalValue = (finalValue > 1000) ? parseFloat(finalValue / 1000).toFixed(2) + ' Gbps' : finalValue + ' Mbps';
            void (version === 'IPv6' && downloadTest('IPv4'));
            void (!(version === 'IPv6') && uploadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'));
            updateValue([currentTest, '-', version].join(''), finalValue);
        }

        function calculateStatsonError(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }

        function downloadHttpOnComplete(result) {

            var calculateMeanStats = new window.calculateStats(result, calculateStatsonComplete, calculateStatsonError);
            calculateMeanStats.performCalculations();
        }

        function downloadHttpOnProgress(result) {
            option.series[0].data[0].value = result;
            myChart.setOption(option, true);
        }

        function downloadHttpOnAbort(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }

        function downloadHttpOnTimeout(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }

        function downloadHttpOnError(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }

        var baseUrl = (version === 'IPv6') ? 'http://' + testPlan.baseUrlIPv6 : 'http://' + testPlan.baseUrlIPv4;

        var downloadHttpConcurrent = new window.downloadHttpConcurrent(baseUrl + '/download?bufferSize=1000000', 'GET', 6, 15000, 10000, downloadHttpOnComplete, downloadHttpOnProgress,
            downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError);
        downloadHttpConcurrent.initiateTest();
    }

    function uploadTest(version) {
        var currentTest = 'upload';
        option.series[0].data[0].value = 0;
        option.series[0].data[0].name = 'Testing Upload...';
        option.series[0].detail.formatter = formatSpeed;
        myChart.setOption(option, true);

        function calculateStatsonComplete(result) {
            var finalValue = parseFloat(Math.round(result.stats.mean * 100) / 100).toFixed(2);
            finalValue = (finalValue > 1000) ? parseFloat(finalValue / 1000).toFixed(2) + ' Gbps' : finalValue + ' Mbps';
            void ((version === 'IPv6') && uploadTest('IPv4'));
            if (!(version === 'IPv6')) {
                //update dom with final result
                startTestButton.disabled = false;
                //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                option.series[0].data[0].value = 0;
                option.series[0].data[0].name = 'Test Complete';
                startTestButton.style.backgroundColor = '';
                startTestButton.style.cursor = 'pointer';
                option.series[0].detail.show = false;
                myChart.setOption(option, true);
            }

            updateValue([currentTest, '-', version].join(''), finalValue);
        }

        function calculateStatsonError(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }
        function uploadHttpOnComplete(result) {
            var calculateMeanStats = new window.calculateStats(result, calculateStatsonComplete, calculateStatsonError);
            calculateMeanStats.performCalculations();
        }
        function uploadHttpOnProgress(result) {
            option.series[0].data[0].value = result;
            myChart.setOption(option, true);
        }
        function uploadHttpOnAbort(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }
        function uploadHttpOnTimeout(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }
        function uploadHttpOnError(result) {
            startTestButton.disabled = false;
            //update button text to communicate current state of test as In Progress
            startTestButton.innerHTML = 'Start Test';
        }
        var baseUrl = (version === 'IPv6') ? 'http://' + testPlan.baseUrlIPv6 : 'http://' + testPlan.baseUrlIPv4;

        var uploadHttpConcurrentTestSuite = new window.uploadHttpConcurrent(baseUrl + '/upload', 'POST', 2, 15000, 15000, uploadHttpOnComplete, uploadHttpOnProgress,
            uploadHttpOnError, 500000);
        uploadHttpConcurrentTestSuite.initiateTest();

    }

})();
