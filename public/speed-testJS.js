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

    function initTest() {
        getTestPlan(function (testPlan) {
            console.log(testPlan);

            testRunner.push(new window.downloadHttpConcurrent(['http://', testPlan.baseUrlIPv4, '/download?bufferSize=', '10000000'].join(''), 'GET', 4, 15000, 10000, downloadHttpOnComplete, downloadHttpOnProgress,
                downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError));
            //IPv6
            void (testPlan.hasIPv6 && testRunner.push(new window.downloadHttpConcurrent(['http://', testPlan.baseUrlIPv6, '/download?bufferSize=', '10000000'].join(''), 'GET', 4, 15000, 10000, downloadHttpOnComplete, downloadHttpOnProgress,
                downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError)));

            testRunner.push(new window.uploadHttpConcurrent(['http://', testPlan.baseUrlIPv4, '/upload'].join(''), 'POST', 2, 15000, 15000, uploadHttpOnComplete, uploadHttpOnProgress,
                uploadHttpOnError, 500000));
            //IPv6
            void (testPlan.hasIPv6 && testRunner.push(new window.uploadHttpConcurrent(['http://', testPlan.baseUrlIPv6, '/upload'].join(''), 'POST', 2, 15000, 15000, uploadHttpOnComplete, uploadHttpOnProgress,
                uploadHttpOnError, 500000)));

            testRunner.push(new window.latencyHttpTest(['http://', testPlan.baseUrlIPv4, '/latency'].join(''), 10, 30000, latencyHttpOnComplete, latencyHttpOnProgress,
                latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError));
            //IPv6
            void (testPlan.hasIPv6 && testRunner.push(new window.latencyHttpTest(['http://', testPlan.baseUrlIPv6, '/latency'].join(''), 10, 30000, latencyHttpOnComplete, latencyHttpOnProgress,
                latencyHttpOnAbort, latencyHttpOnTimeout, latencyHttpOnError)));

            //initialize speedometer
            var myChart = echarts.init(document.querySelector('.speed-gauge'));
            var option = {
                series: [
                    {
                        name: 'Download',
                        type: 'gauge',
                        detail: {
                            formatter: '{value} MBps',
                            show: true,
                            backgroundColor: 'rgba(0,0,0,0)',
                            borderWidth: 0,
                            borderColor: '#ccc',
                            width: 100,
                            height: 40,
                            offsetCenter: [0, '40%'],
                            textStyle: {
                                color: 'auto',
                                fontSize: 30
                            }
                        },
                        data: [{ value: 50, name: 'Download' }]
                    }
                ]
            };

            setInterval(function () {
                option.series[0].data[0].value = (Math.random() * 100).toFixed(2) - 0;
                myChart.setOption(option, true);
            }, 2000);

        });
    }

    function startTest() {

    }

    function getTestPlan(func) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                var data = JSON.parse(xhr.responseText);
                void ((func && func instanceof Function) && func(data));
            }
        };
        xhr.open('GET', '/testplan', true);
        xhr.send(null);
    }


    ///latencyHttpTestSuite
    function latencyHttpOnComplete(result) {
        console.dir(result);
    }
    function latencyHttpOnProgress(result) {
        console.log(result);
    }
    function latencyHttpOnAbort(result) {
        console.dir(result);
    }
    function latencyHttpOnTimeout(result) {
        console.dir(result);
    }
    function latencyHttpOnError(result) {
        console.dir(result);
    }

    //latencyWebSocketTestSuite

    function latencyWebSocketOnComplete(result) {
        console.dir(result);
    }
    function latencyWebSocketOnProgress(result) {
        console.log(result);
    }
    function latencyWebSocketOnError(result) {
        console.dir(result);
    }


    //downloadHttpConcurrent

    function calculateStatsonComplete(result) {
        console.log(result);
    }

    function calculateStatsonError(result) {
        console.log(result);
    }

    function downloadHttpOnComplete(result) {
        console.dir(result);
        var calculateMeanStats = new window.calculateStats(result, calculateStatsonComplete, calculateStatsonError);
        calculateMeanStats.performCalculations();
    }
    function downloadHttpOnProgress(result) {
        console.log(result);
    }
    function downloadHttpOnAbort(result) {
        //console.dir(result);
    }
    function downloadHttpOnTimeout(result) {
        console.dir(result);
    }
    function downloadHttpOnError(result) {
        console.dir(result);
    }

    //uploadHttpConcurrent

    function uploadHttpOnComplete(result) {
        console.dir(result);
        var calculateMeanStats = new window.calculateStats(result, calculateStatsonComplete, calculateStatsonError);
        calculateMeanStats.performCalculations();
    }
    function uploadHttpOnProgress(result) {
        console.log('indexTestProgres: ' + result);
    }
    function uploadHttpOnAbort(result) {
        //console.dir(result);
    }
    function uploadHttpOnTimeout(result) {
        console.dir(result);
    }
    function uploadHttpOnError(result) {
        console.dir(result);
    }

})();
