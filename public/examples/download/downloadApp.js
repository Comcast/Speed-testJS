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
    var downloadSize;
    var concurrentRuns;
    var downloadTestlength;
    var downloadTestTimeout;
    var prevDownloadSize;
    var testResults = [];
    var maxDownloadBufferSize = 532421875;
    var ports = [5020, 5021, 5022, 5023, 5024, 5025];
    var urls = [];

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
                        name: '',
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
                    removeClass(resultsEl[i], 'hide');
                }
            }
        });
    }

    function hasClass(el, className) {
        return (el.classList) ? el.classList.contains(className) : !!el.className.match(new RegExp('(\\s|^)' + className + '(\\s|$)'));
    }

    function addClass(el, className) {
        if (!hasClass(el, className)) {
            el.className += " " + className;
            return;
        }
        void (el.classList && el.classList.add(className));
    }

    function removeClass(el, className) {
        if (hasClass(el, className)) {
            var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
            el.className = el.className.replace(reg, ' ');
            return;
        }
        void ((el.classList) && el.classList.remove(className));
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
                if (testPlan.performLatencyRouting) {
                    latencyBasedRouting();
                }
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
        setDownloadTestValues();

        void (!(testPlan.hasIPv6 === 'IPv6') && setTimeout(function () { !firstRun && downloadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'); }, 500));

        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Testing in Progress ...';
        //disable button
        startTestButton.disabled = true;
        //set accessiblity aria-disabled state. 
        //This will also effect the visual look by corresponding css
        startTestButton.setAttribute('aria-disabled', true);
    }

    function formatSpeed(value) {
        var value = parseFloat(Math.round(value * 100) / 100).toFixed(2);
        value = (value > 1000) ? parseFloat(value / 1000).toFixed(2) + ' Gbps' : value + ' Mbps';
        return value;
    }

    function updateValue(selector, value) {
        var sel = ['.', selector, '-result'].join('');
        var dom = document.querySelector(sel);

        if (dom) {
            dom.innerHTML = value;
        }
    }

    function setDownloadTestValues() {
        downloadSize = 10000;
        concurrentRuns = 6;
        downloadTestlength = 15000;
        downloadTestTimeout = 15000;
        prevDownloadSize = 0;
        testResults = [];
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

            if (version === 'IPv6') {
                setDownloadTestValues();
                downloadTest('IPv4')
            } else {
                //update dom with final result
                startTestButton.disabled = false;
                //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                option.series[0].data[0].value = 0;
                option.series[0].data[0].name = 'Test Complete';
                //set accessiblity aria-disabled state.
                //This will also effect the visual look by corresponding css
                startTestButton.setAttribute('aria-disabled', false);
                startTestButton.disabled = false;
                option.series[0].detail.show = false;
                myChart.setOption(option, true);
            }

            updateValue([currentTest, '-', version].join(''), finalValue);
        }

        function calculateStatsonError(result) {
                //set test value to 0
                option.series[0].data[0].value = 0;
                //updat test status to complete
                option.series[0].data[0].name = 'Test Failed';
                //set accessiblity aria-disabled state.
                //This will also effect the visual look by corresponding css
                startTestButton.setAttribute('aria-disabled', false);
               //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                //enable start button
                startTestButton.disabled = false;
                //hide current test value in chart
                option.series[0].detail.show = false;
                //update gauge
                myChart.setOption(option, true);
        }

        function adaptiveDownloadOnComplete(result) {
            downloadSize = result.size;
            urls = [];
            if (downloadSize > maxDownloadBufferSize) {
                downloadSize = maxDownloadBufferSize;
            }
            prevDownloadSize = result.prevDownloadSize;
            downloadTestTimeout = result.timeout;
            if (result.calculateResults) {
                var calculateMeanStats = new window.calculateStats('http://' + testPlan.baseUrlIPv4.split(':')[0] + '/calculator', testResults, calculateStatsonComplete, calculateStatsonError);
                calculateMeanStats.performCalculations();
            } else {
                downloadTest(version === 'IPv6' ? 'IPv6' : 'IPv4');
            }


        }

        function adaptiveDownloadOnProgress(result) {
            option.series[0].data[0].value = result;
            testResults.push(result);
            myChart.setOption(option, true);
        }

        function adaptiveDownloadOnAbort(result) {
            if (version === 'IPv6') {
                testPlan.hasIPv6 = false;
                downloadTest('IPv4');
                return;
            }
                //set test value to 0
                option.series[0].data[0].value = 0;
                //updat test status to complete
                option.series[0].data[0].name = 'Test Failed';
                //set accessiblity aria-disabled state.
                //This will also effect the visual look by corresponding css
                startTestButton.setAttribute('aria-disabled', false);
               //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                //enable start button
                startTestButton.disabled = false;
                //hide current test value in chart
                option.series[0].detail.show = false;
                //update gauge
                myChart.setOption(option, true);
        }

        function adaptiveDownloadOnTimeout(result) {
            if (version === 'IPv6') {
                testPlan.hasIPv6 = false;
                downloadTest('IPv4');
                return;
            }
                //set test value to 0
                option.series[0].data[0].value = 0;
                //updat test status to complete
                option.series[0].data[0].name = 'Test Failed';
                //set accessiblity aria-disabled state.
                //This will also effect the visual look by corresponding css
                startTestButton.setAttribute('aria-disabled', false);
               //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                //enable start button
                startTestButton.disabled = false;
                //hide current test value in chart
                option.series[0].detail.show = false;
                //update gauge
                myChart.setOption(option, true);
        }

        function adaptiveDownloadOnError(result) {
            if (version === 'IPv6') {
                testPlan.hasIPv6 = false;
                downloadTest('IPv4');
                return;
            }
                //set test value to 0
                option.series[0].data[0].value = 0;
                //updat test status to complete
                option.series[0].data[0].name = 'Test Failed';
                //set accessiblity aria-disabled state.
                //This will also effect the visual look by corresponding css
                startTestButton.setAttribute('aria-disabled', false);
               //update button text to communicate current state of test as In Progress
                startTestButton.innerHTML = 'Start Test';
                //enable start button
                startTestButton.disabled = false;
                //hide current test value in chart
                option.series[0].detail.show = false;
                //update gauge
                myChart.setOption(option, true);
        }

        var baseUrl = (version === 'IPv6') ? '[' + testPlan.baseUrlIPv6.replace(/[[]/g, '').split(']')[0] + ']' : testPlan.baseUrlIPv4.split(':')[0];

        for (var i = 0; i < 6; i++) {
            urls.push('http://' + baseUrl + ':' + ports[i] + '/download?bufferSize=');
        }

        var adaptiveDownload = new window.adaptiveDownload(urls, 'http://' + testPlan.baseUrlIPv4 +'/download?bufferSize=', downloadSize, prevDownloadSize, concurrentRuns, downloadTestTimeout, downloadTestlength,
            adaptiveDownloadOnComplete, adaptiveDownloadOnProgress, adaptiveDownloadOnAbort, adaptiveDownloadOnTimeout, adaptiveDownloadOnError);
        adaptiveDownload.initiateTest();

    }

})();
