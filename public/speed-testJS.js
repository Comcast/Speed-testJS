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
  var uploadSize = 75000;
  var uploadCurrentRuns = 4;
  var uploadTestTimeout = 12000;
  var uploadTestLength = 12000;
  var uploadMovingAverage = 18;
  var uploadUrls = [];
  var uploadMonitorInterval = 200;
  var isMicrosoftBrowser = false;
  var sliceStartValue = 0.3;
  var sliceEndValue = 0.9;

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


  function getTestPlan(func) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        var data = JSON.parse(xhr.responseText);
        testPlan = data;
        testPlan.hasIPv6 = false;
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

    function latencyHttpOnComplete(result) {

      result = result.sort(function (a, b) {
        return +a.time - +b.time;
      });

      if(version === 'IPv6'){
        setTimeout(latencyTest('IPv4'),500);
      }
      else{
        updateValue(currentTest, result[0].time.toFixed(2) + ' ms');
      }

    }

    function latencyHttpOnProgress() {
    }

    function latencyHttpOnAbort(result) {
      if(result && result.results && result.results.length === 0) {
        startTestButton.setAttribute('aria-disabled', false);
        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Start Test';
        //enable start button
        startTestButton.disabled = false;
      }else{
        result = result.results.sort(function (a, b) {
          return +a.time - +b.time;
        });
        updateValue(currentTest, result[0].time.toFixed(2) + ' ms');
      }
      if (version === 'IPv6') {
        latencyTest('IPv4');
        return;
      }
    }

    function latencyHttpOnTimeout(result) {
      if(result && result.results && result.results.length === 0) {
        //This will also effect the visual look by corresponding css
        startTestButton.setAttribute('aria-disabled', false);
        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Start Test';
        //enable start button
        startTestButton.disabled = false;
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
        //set accessiblity aria-disabled state.
        //This will also effect the visual look by corresponding css
        startTestButton.setAttribute('aria-disabled', false);
        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Start Test';
        //enable start button
        startTestButton.disabled = false;
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

  function mobileAndTabletcheck() {
    var check = false;   
    (function(a) {
      //Recommend looking for the string “Mobi” anywhere in the User Agent to detect a mobile device
      //Recommends testing for "Android" as a user agent also, as the Chrome user agent string for tablets does not include "Mobi" (the phone versions do however)
      if (/Mobi|Android/i.test(a.substr(0,4))) 
        check = true;
    })(navigator.userAgent||navigator.vendor||window.opera);
    return check;
  };


  function downloadTest(version) {
    var currentTest = 'download';

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

    function downloadHttpOnComplete(result) {

        var calculateMeanStats = new window.statisticalCalculator(result, false, sliceStartValue, sliceEndValue, calculateStatsonComplete);
        calculateMeanStats.getResults();
    }

    function downloadHttpOnProgress(result) {
      console.log(result)
document.getElementById("download-progress-result").innerHTML = result.toFixed(2);;
    }

    function downloadHttpOnAbort(result) {
      if (version === 'IPv6') {
        testPlan.hasIPv6 = false;
        downloadTest('IPv4');
        return;
      }
      //set accessiblity aria-disabled state.
      //This will also effect the visual look by corresponding css
      startTestButton.setAttribute('aria-disabled', false);
      //update button text to communicate current state of test as In Progress
      startTestButton.innerHTML = 'Start Test';
      //enable start button
      startTestButton.disabled = false;
    }

    function downloadHttpOnTimeout(result) {
      if (version === 'IPv6') {
        testPlan.hasIPv6 = false;
        downloadTest('IPv4');
        return;
      }
      //set accessiblity aria-disabled state.
      //This will also effect the visual look by corresponding css
      startTestButton.setAttribute('aria-disabled', false);
      //update button text to communicate current state of test as In Progress
      startTestButton.innerHTML = 'Start Test';
      //enable start button
      startTestButton.disabled = false;
    }

    function downloadHttpOnError(result) {
      if (version === 'IPv6') {
        testPlan.hasIPv6 = false;
        downloadTest('IPv4');
        return;
      }
      //set accessiblity aria-disabled state.
      //This will also effect the visual look by corresponding css
      startTestButton.setAttribute('aria-disabled', false);
      //update button text to communicate current state of test as In Progress
      startTestButton.innerHTML = 'Start Test';
      //enable start button
      startTestButton.disabled = false;
    }

    downloadUrls.length=0;
    var baseUrl = (version === 'IPv6') ? testPlan.baseUrlIPv6NoPort : testPlan.baseUrlIPv4NoPort;
    for (var i = 0; i < ports.length; i++) {
      for(var b= 0; b <6; b++ )
      {
        downloadUrls.push('http://' + baseUrl + ':' + ports[i] + '/download?bufferSize=');
      }
    }

    var isHandheld = mobileAndTabletcheck();
    if (isHandheld) {
        downloadCurrentRuns = 4;
        downloadSize = 20000000;
        downloadTestTimeout = 10000;
        downloadTestLength = 10000;
    } else {
      performDesktopDownloadTest(version);
      return;
    }

    var downloadHttpConcurrentProgress = new window.downloadHttpConcurrentProgress(downloadUrls, 'GET', downloadCurrentRuns, downloadTestTimeout, downloadTestLength, downloadMovingAverage, downloadHttpOnComplete, downloadHttpOnProgress,
      downloadHttpOnAbort, downloadHttpOnTimeout, downloadHttpOnError,downloadSize, downloadProgressInterval,downloadMonitorInterval, isHandheld);

    downloadHttpConcurrentProgress.initiateTest();
  }

  function performDesktopDownloadTest(version) {
    var currentTest = 'download';

    function downloadHttpOnProgress(event) {

      document.getElementById("download-progress-result").innerHTML = event.toFixed(2);
    }

    function downloadHttpOnComplete(event) {
      updateValue([currentTest, '-', version].join(''), event.downloadSpeed.toFixed(2));
      setTimeout(function() { uploadTest(version); }, 500);
    }

    function downloadHttpOnError(event) {
      console.log(event);
    }

    downloadSize = 200000000;
    downloadCurrentRuns = 18;
    downloadTestLength = 15000;
    downloadMonitorInterval = 1000;

    var downloadTest = new window.algoV1(downloadUrls, downloadSize,
            downloadCurrentRuns,downloadTestLength, downloadMonitorInterval,
            downloadHttpOnProgress, downloadHttpOnComplete, downloadHttpOnError);

    downloadTest.initiateTest();

}

  function uploadTest(version) {
    var currentTest = 'upload';

    function uploadHttpOnComplete(result) {
      var finalValue = parseFloat(Math.round(result.mean * 100) / 100).toFixed(2);
      finalValue = (finalValue > 1000) ? parseFloat(finalValue / 1000).toFixed(2) + ' Gbps' : finalValue + ' Mbps';
      void ((version === 'IPv6') && uploadTest('IPv4'));
      if (!(version === 'IPv6')) {
        //update dom with final result
        startTestButton.disabled = false;
        //update button text to communicate current state of test as In Progress
        startTestButton.innerHTML = 'Start Test';
        //set accessiblity aria-disabled state.
        //This will also effect the visual look by corresponding css
        startTestButton.setAttribute('aria-disabled', false);
        startTestButton.disabled = false;
      }

      updateValue([currentTest, '-', version].join(''), finalValue);
    }
    function uploadHttpOnProgress(result) {
        document.getElementById("upload-progress-result").innerHTML = result.toFixed(2);
    }
    function uploadHttpOnError(result) {
      if (version === 'IPv6') {
        testPlan.hasIPv6 = false;
        uploadTest('IPv4');
        return;
      }
      //set accessiblity aria-disabled state.
      //This will also effect the visual look by corresponding css
      startTestButton.setAttribute('aria-disabled', false);
      //update button text to communicate current state of test as In Progress
      startTestButton.innerHTML = 'Start Test';
      //enable start button
      startTestButton.disabled = false;
    }

      //TODO needs to removed once we know the issues  with ie
      if (navigator.appVersion.indexOf("MSIE") != -1 || navigator.appVersion.indexOf("Trident") != -1 || navigator.appVersion.indexOf("Edge") != -1) {
          isMicrosoftBrowser = true;
      }

      var baseUrl = (version === 'IPv6') ? testPlan.baseUrlIPv6NoPort : testPlan.baseUrlIPv4NoPort;
      uploadUrls.length = 0;
      for (var i = 0; i < ports.length; i++) {
          for (var b = 0; b < 6; b++) {
              uploadUrls.push('http://' + baseUrl + ':' + ports[i] + '/upload');

          }
      }

      var uploadHttpConcurrentProgress = new window.uploadHttpConcurrentProgress(uploadUrls, 'POST', uploadCurrentRuns, uploadTestTimeout, uploadTestLength, uploadMovingAverage, uploadHttpOnComplete, uploadHttpOnProgress,
          uploadHttpOnError, uploadSize, testPlan.maxuploadSize, uploadMonitorInterval, isMicrosoftBrowser);

      uploadHttpConcurrentProgress.initiateTest();
  }

})();
