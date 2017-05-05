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
  var downloadSize = 230483949;
  var testServerTimeout = 2000;
  var latencyTimeout = 3000;
  var downloadCurrentRuns = 18;
  var downloadTestTimeout = 12000;
  var downloadTestLength = 12000;
  var downloadMovingAverage = 18;
  var downloadProgressInterval = 25;
  var downloadUrls = [];
  var ports = [5020, 5021, 5022, 5023, 5024, 5025];
  var downloadMonitorInterval = 100;
  var uploadSize = 10000;
  var uploadCurrentRuns = 1;
  var uploadTestTimeout = 12000;
  var uploadTestLength = 12000;
  var uploadMovingAverage = 18;
  var uploadUrls = [];
  var uploadMonitorInterval = 200;
  var isIE = false;

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
          removeClass(resultsEl[i], 'hide');
        }
      }

      latencyTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4');

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

  function latencyBasedRoutingOnComplete(result) {
    //TODO update the base urls for websockets if you want to perform the latency test via websockets
    testPlan.baseUrlIPv4 = result.IPv4Address;
    testPlan.baseUrlIPv6 = result.IPv6Address;
  }

  function latencyBasedRoutingOnError(result) {
    console.log(result);
  }

  function latencyBasedRouting() {
    // pass in the client location instead of the hard coded value
    var latencyBasedRouting = new window.latencyBasedRouting('NJ', '/testServer', testServerTimeout, latencyTimeout, latencyBasedRoutingOnComplete, latencyBasedRoutingOnError);
    latencyBasedRouting.getNearestServer();
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


    void (setTimeout(function () { !firstRun && downloadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'); }, 500));

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

  function latencyTest(version) {
    var currentTest = 'latency';
    option.series[0].data[0].value = 0;
    option.series[0].data[0].name = '';
    option.series[0].detail.formatter = '{value} ms';
    option.series[0].detail.show = false;
    myChart.setOption(option, true);

    function latencyHttpOnComplete(result) {

      result = result.sort(function (a, b) {
        return +a.time - +b.time;
      });

      if(version === 'IPv6'){
        setTimeout(latencyTest('IPv4'),500);
      }
      else{
        updateValue(currentTest, result[0].time + ' ms');
      }

    }

    function latencyHttpOnProgress() {
    }

    function latencyHttpOnAbort(result) {
      if(result && result.results && result.results.length === 0) {
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
      }else{
        result = result.results.sort(function (a, b) {
          return +a.time - +b.time;
        });
        updateValue(currentTest, result[0].time + ' ms');
      }
      if (version === 'IPv6') {
        latencyTest('IPv4');
        return;
      }
    }

    function latencyHttpOnTimeout(result) {
      if(result && result.results && result.results.length === 0) {
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
      }else{
        result = result.results.sort(function (a, b) {
          return +a.time - +b.time;
        });
        updateValue(currentTest, result[0].time + ' ms');
      }
      if (version === 'IPv6') {
        latencyTest('IPv4');
        return;
      }
    }

    function latencyHttpOnError(result) {
      if(result && result.results && result.results.length === 0) {
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
      }else{
        result = result.results.sort(function (a, b) {
          return +a.time - +b.time;
        });
        updateValue(currentTest, result[0].time + ' ms');
      }
      if (version === 'IPv6') {
        latencyTest('IPv4');
        return;
      }
    }

    var baseUrl = (version === 'IPv6') ? 'http://' + testPlan.baseUrlIPv6 + '/latency' : 'http://' + testPlan.baseUrlIPv4 + '/latency';

    var latencyHttpTestSuite = new window.latencyHttpTest(baseUrl, 10, 3000, latencyHttpOnComplete, latencyHttpOnProgress,
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

      if(version==='IPv4'){
        void (!(testPlan.hasIPv6 === 'IPv6') && setTimeout(function () { !firstRun && uploadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'); }, 500));
      }
      //void (!(version === 'IPv6') && uploadTest(testPlan.hasIPv6 ? 'IPv6' : 'IPv4'));
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

    function downloadHttpOnComplete(result) {

      var calculateMeanStats = new window.calculateStats('http://' + testPlan.baseUrlIPv4 + '/calculator', result, calculateStatsonComplete, calculateStatsonError);
      calculateMeanStats.performCalculations();
    }

    function downloadHttpOnProgress(result) {
      option.series[0].data[0].value = result;
      myChart.setOption(option, true);
    }

    function downloadHttpOnAbort(result) {
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

    function downloadHttpOnTimeout(result) {
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

    function downloadHttpOnError(result) {
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

    downloadUrls.length=0;
    var baseUrl = (version === 'IPv6') ? testPlan.baseUrlIPv6NoPort : testPlan.baseUrlIPv4NoPort;
    for (var i = 0; i < ports.length; i++) {
      for(var b= 0; b <6; b++ )
      {
        downloadUrls.push('http://' + baseUrl + ':' + ports[i] + '/download?bufferSize=');

      }
    }
    var downloadHttpConcurrentProgress = new window.downloadHttpConcurrentProgress(downloadUrls, 'GET', downloadCurrentRuns, downloadTestTimeout, downloadTestLength, downloadMovingAverage, downloadHttpOnComplete, downloadHttpOnProgress,
      downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError,downloadSize, downloadProgressInterval,downloadMonitorInterval);

    downloadHttpConcurrentProgress.initiateTest();
  }

  function uploadTest(version) {
    var currentTest = 'upload';
    option.series[0].data[0].value = 0;
    option.series[0].data[0].name = 'Testing Upload...';
    option.series[0].detail.formatter = formatSpeed;
    myChart.setOption(option, true);

    function uploadHttpOnComplete(result) {
      var finalValue = parseFloat(Math.round(result.mean * 100) / 100).toFixed(2);
      finalValue = (finalValue > 1000) ? parseFloat(finalValue / 1000).toFixed(2) + ' Gbps' : finalValue + ' Mbps';
      void ((version === 'IPv6') && uploadTest('IPv4'));
      if (!(version === 'IPv6')) {
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
    function uploadHttpOnProgress(result) {
      option.series[0].data[0].value = result;
      myChart.setOption(option, true);
    }
    function uploadHttpOnError(result) {
      if (version === 'IPv6') {
        testPlan.hasIPv6 = false;
        uploadTest('IPv4');
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

      //TODO needs to removed once we know the issues  with ie
      if (navigator.appVersion.indexOf("MSIE") != -1 || navigator.appVersion.indexOf("Trident") != -1 || navigator.appVersion.indexOf("Edge") != -1) {
          isIE = true;
      }

      var baseUrl = (version === 'IPv6') ? testPlan.baseUrlIPv6NoPort : testPlan.baseUrlIPv4NoPort;
      uploadUrls.length = 0;
      for (var i = 0; i < ports.length; i++) {
          for (var b = 0; b < 6; b++) {
              uploadUrls.push('http://' + baseUrl + ':' + ports[i] + '/upload');
          }
      }

      var uploadHttpConcurrentProgress = new window.uploadHttpConcurrentProgress(uploadUrls, 'POST', uploadCurrentRuns, uploadTestTimeout, uploadTestLength, uploadMovingAverage, uploadHttpOnComplete, uploadHttpOnProgress,
          uploadHttpOnError, uploadSize, testPlan.maxuploadSize, uploadMonitorInterval, isIE);

      uploadHttpConcurrentProgress.initiateTest();
  }

})();
