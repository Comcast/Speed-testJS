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

var data = [
  ['5 Mbs/2 Mbs', 160000, 232],
  ['5 Mbs/2 Mbs', 200000, 289],
  ['5 Mbs/2 Mbs', 250000, 351],
  ['5 Mbs/2 Mbs', 312500, 432],
  ['5 Mbs/2 Mbs', 390625, 536],
  ['5 Mbs/2 Mbs', 488281, 664],
  ['5 Mbs/2 Mbs', 610351, 823],
  ['5 Mbs/2 Mbs', 762939, 1025],
  ['5 Mbs/2 Mbs', 953674, 1268],
  ['5 Mbs/2 Mbs', 1192093, 1581],
  ['5 Mbs/2 Mbs', 1490116, 1968],
  ['5 Mbs/2 Mbs', 1862645, 2456],
  ['5 Mbs/2 Mbs', 2328306, 3000],
  ['10 Mbs/5 Mbs', 160000, 129],
  ['10 Mbs/5 Mbs', 200000, 159],
  ['10 Mbs/5 Mbs', 250000, 194],
  ['10 Mbs/5 Mbs', 312500, 239],
  ['10 Mbs/5 Mbs', 390625, 297],
  ['10 Mbs/5 Mbs', 488281, 364],
  ['10 Mbs/5 Mbs', 610351, 452],
  ['10 Mbs/5 Mbs', 762939, 557],
  ['10 Mbs/5 Mbs', 953674, 697],
  ['10 Mbs/5 Mbs', 1192093, 874],
  ['10 Mbs/5 Mbs', 1490116, 1089],
  ['10 Mbs/5 Mbs', 1862645, 1355],
  ['10 Mbs/5 Mbs', 2328306, 1689],
  ['10 Mbs/5 Mbs', 2910383, 2104],
  ['10 Mbs/5 Mbs', 3637979, 2632],
  ['10 Mbs/5 Mbs', 4547474, 3000],
  ['50 Mbs/25 Mbs', 160000, 41],
  ['50 Mbs/25 Mbs', 200000, 43],
  ['50 Mbs/25 Mbs', 250000, 52],
  ['50 Mbs/25 Mbs', 312500, 62],
  ['50 Mbs/25 Mbs', 390625, 74],
  ['50 Mbs/25 Mbs', 488281, 90],
  ['50 Mbs/25 Mbs', 610351, 109],
  ['50 Mbs/25 Mbs', 762939, 132],
  ['50 Mbs/25 Mbs', 953674, 163],
  ['50 Mbs/25 Mbs', 1192093, 200],
  ['50 Mbs/25 Mbs', 1490116, 246],
  ['50 Mbs/25 Mbs', 1862645, 304],
  ['50 Mbs/25 Mbs', 2328306, 381],
  ['50 Mbs/25 Mbs', 2910383, 471],
  ['50 Mbs/25 Mbs', 3637979, 585],
  ['50 Mbs/25 Mbs', 4547474, 727],
  ['50 Mbs/25 Mbs', 5684343, 906],
  ['50 Mbs/25 Mbs', 7105429, 1134],
  ['50 Mbs/25 Mbs', 8881786, 1409],
  ['50 Mbs/25 Mbs', 11102233, 1757],
  ['50 Mbs/25 Mbs', 13877791, 2193],
  ['50 Mbs/25 Mbs', 17347239, 2742],
  ['50 Mbs/25 Mbs', 21684049, 3000],
  ['90 Mbs/25 Mbs', 160000, 27],
  ['90 Mbs/25 Mbs', 200000, 30],
  ['90 Mbs/25 Mbs', 250000, 35],
  ['90 Mbs/25 Mbs', 312500, 40],
  ['90 Mbs/25 Mbs', 390625, 51],
  ['90 Mbs/25 Mbs', 488281, 57],
  ['90 Mbs/25 Mbs', 610351, 67],
  ['90 Mbs/25 Mbs', 762939, 82],
  ['90 Mbs/25 Mbs', 953674, 100],
  ['90 Mbs/25 Mbs', 1192093, 119],
  ['90 Mbs/25 Mbs', 1490116, 148],
  ['90 Mbs/25 Mbs', 1862645, 182],
  ['90 Mbs/25 Mbs', 2328306, 225],
  ['90 Mbs/25 Mbs', 2910383, 281],
  ['90 Mbs/25 Mbs', 3637979, 344],
  ['90 Mbs/25 Mbs', 4547474, 441],
  ['90 Mbs/25 Mbs', 5684343, 543],
  ['90 Mbs/25 Mbs', 7105429, 686],
  ['90 Mbs/25 Mbs', 8881786, 846],
  ['90 Mbs/25 Mbs', 11102233, 1072],
  ['90 Mbs/25 Mbs', 13877791, 1312],
  ['90 Mbs/25 Mbs', 17347239, 1663],
  ['90 Mbs/25 Mbs', 21684049, 2031],
  ['90 Mbs/25 Mbs', 27105061, 2567],
  ['90 Mbs/25 Mbs', 33881326, 3000],
  ['300 Mbs/25 Mbs', 160000, 24],
  ['300 Mbs/25 Mbs', 200000, 23],
  ['300 Mbs/25 Mbs', 250000, 26],
  ['300 Mbs/25 Mbs', 312500, 28],
  ['300 Mbs/25 Mbs', 390625, 32],
  ['300 Mbs/25 Mbs', 488281, 32],
  ['300 Mbs/25 Mbs', 610351, 36],
  ['300 Mbs/25 Mbs', 762939, 42],
  ['300 Mbs/25 Mbs', 953674, 49],
  ['300 Mbs/25 Mbs', 1192093, 54],
  ['300 Mbs/25 Mbs', 1490116, 66],
  ['300 Mbs/25 Mbs', 1862645, 76],
  ['300 Mbs/25 Mbs', 2328306, 91],
  ['300 Mbs/25 Mbs', 2910383, 111],
  ['300 Mbs/25 Mbs', 3637979, 131],
  ['300 Mbs/25 Mbs', 4547474, 160],
  ['300 Mbs/25 Mbs', 5684343, 192],
  ['300 Mbs/25 Mbs', 7105429, 243],
  ['300 Mbs/25 Mbs', 8881786, 296],
  ['300 Mbs/25 Mbs', 11102233, 363],
  ['300 Mbs/25 Mbs', 13877791, 443],
  ['300 Mbs/25 Mbs', 17347239, 560],
  ['300 Mbs/25 Mbs', 21684049, 690],
  ['300 Mbs/25 Mbs', 27105061, 865],
  ['300 Mbs/25 Mbs', 33881326, 1091],
  ['300 Mbs/25 Mbs', 42351658, 1329],
  ['300 Mbs/25 Mbs', 52939573, 1661],
  ['300 Mbs/25 Mbs', 66174466, 1992],
  ['300 Mbs/25 Mbs', 82718083, 2569],
  ['300 Mbs/25 Mbs', 103397604, 3096],
  ['300 Mbs/25 Mbs', 129247005, 3000],
  ['1 Gbs/6 Gbs', 160000, 11],
  ['1 Gbs/6 Gbs', 200000, 9],
  ['1 Gbs/6 Gbs', 250000, 9],
  ['1 Gbs/6 Gbs', 312500, 13],
  ['1 Gbs/6 Gbs', 390625, 15],
  ['1 Gbs/6 Gbs', 488281, 12],
  ['1 Gbs/6 Gbs', 610351, 26],
  ['1 Gbs/6 Gbs', 762939, 26],
  ['1 Gbs/6 Gbs', 953674, 27],
  ['1 Gbs/6 Gbs', 1192093, 27],
  ['1 Gbs/6 Gbs', 1490116, 28],
  ['1 Gbs/6 Gbs', 1862645, 31],
  ['1 Gbs/6 Gbs', 2328306, 42],
  ['1 Gbs/6 Gbs', 2910383, 60],
  ['1 Gbs/6 Gbs', 3637979, 84],
  ['1 Gbs/6 Gbs', 4547474, 89],
  ['1 Gbs/6 Gbs', 5684343, 110],
  ['1 Gbs/6 Gbs', 7105429, 139],
  ['1 Gbs/6 Gbs', 8881786, 220],
  ['1 Gbs/6 Gbs', 11102233, 177],
  ['1 Gbs/6 Gbs', 13877791, 202],
  ['1 Gbs/6 Gbs', 17347239, 281],
  ['1 Gbs/6 Gbs', 21684049, 353],
  ['1 Gbs/6 Gbs', 27105061, 443],
  ['1 Gbs/6 Gbs', 33881326, 503],
  ['1 Gbs/6 Gbs', 42351658, 785],
  ['1 Gbs/6 Gbs', 52939573, 756],
  ['1 Gbs/6 Gbs', 66174466, 1001],
  ['1 Gbs/6 Gbs', 82718083, 1249],
  ['1 Gbs/6 Gbs', 103397604, 1336],
  ['1 Gbs/6 Gbs', 129247005, 1652],
  ['1 Gbs/6 Gbs', 161558756, 2204],
  ['1 Gbs/6 Gbs', 201948445, 2545],
  ['1 Gbs/6 Gbs', 532421875, 3000]
];

var bandwidthTiers = [
  '5 Mbs/2 Mbs',
  '10 Mbs/5 Mbs',
  '50 Mbs/25 Mbs',
  '90 Mbs/25 Mbs',
  '300 Mbs/25 Mbs',
  '1 Gbs/6 Gbs'
];

// "maxBufferSize" is a hash of  "bandwidth tier": "buffer size with expected tx time of 3 s"
var maxBufferSize = {};

// probeTxTime is hash of   "probe size": { "bandwidth tier": "expected tx time for probe" }
var probeTxTime = {};

var LL_PROBE_SIZE = 762939;
var HL_PROBE_SIZE = 2328306;

probeTxTime[LL_PROBE_SIZE] = {};
probeTxTime[HL_PROBE_SIZE] = {};

var TIER        = 0;
var FILESIZE    = 1;
var TX_TIME     = 2;
var MAX_TIMEOUT = 3000;

// offset from estimated tier (via probe download)
// we want the client to start with
var OFFSET      = 2;

// "data" (defined above) is an array of [ TIER, FILESIZE, TX_TIME ]
// run through "data" once and fill up the other hashes
for (var di = 0; di < data.length; di ++) {
  if (data[di][FILESIZE] === LL_PROBE_SIZE) {
    probeTxTime[LL_PROBE_SIZE][data[di][TIER]] = data[di][TX_TIME];
  }
  else if (data[di][FILESIZE] === HL_PROBE_SIZE ) {
    probeTxTime[HL_PROBE_SIZE][data[di][TIER]] = data[di][TX_TIME];
  }

  if (data[di][TX_TIME] === MAX_TIMEOUT) {
    maxBufferSize[data[di][TIER]] = data[di][FILESIZE];
  }
}


// sort on a "prop"erty that is closest to "value"
// resolve ties by specifically selecting a higher TIER
function compareTiersProp(prop, value) {
  return function(a, b) {
    var diff = Math.abs(a[prop] - value) - Math.abs(b[prop] - value);
    if (diff !== 0) {
      return diff;
    }
    return (bandwidthTiers.indexOf(a[TIER]) - bandwidthTiers.indexOf(b[TIER]));
  }
}

module.exports = {
  GetDownloadSize: function (bufferSize, time, lowLatency) {
    var maxBufferSizes = [];
    //if bufferSize and time are 0 then doing a probe test and return default value of 762939
    if (parseInt(time) === 0) {
      if (parseInt(bufferSize) === 0) {
        if(lowLatency==='true') {
          maxBufferSizes.push(LL_PROBE_SIZE);
        }else{
          maxBufferSizes.push(HL_PROBE_SIZE);
        }
      } else {
        //client is doing testing just return request size
        maxBufferSizes.push(bufferSize);
      }
    }
    else {
      //client has completed probing and is requesting what size to download data with
      var probeSizes = Object.keys(probeTxTime);
      var bufferSizeString = bufferSize.toString();

      if (probeSizes.indexOf(bufferSizeString) >= 0) {

        var curMinTime = Math.abs(parseInt(time) - probeTxTime[bufferSizeString][bandwidthTiers[0]]);
        var minIndex = 0;

        for (var i = 1; i < bandwidthTiers.length; i++) {
          var timeDifference = Math.abs(parseInt(time) - probeTxTime[bufferSizeString][bandwidthTiers[i]]);

          if (curMinTime >= timeDifference) {
            curMinTime = timeDifference;
            minIndex = i;
          }

        }

        minIndex = minIndex + OFFSET < bandwidthTiers.length ? minIndex + OFFSET : minIndex;
        for (var j = minIndex; j < bandwidthTiers.length; j++) {
          maxBufferSizes.push(maxBufferSize[bandwidthTiers[j]]);
        }
      }
      else {
        // bufferSize not an exact match, can first try to match by filesize per tier
        // then sort by closest tx time
        var perTierResults = [];
        var perTierMin = [];
        var curTierIndex = 0;

        for (var k = 0; k < data.length; k++) {
          if (data[k][TIER] !== bandwidthTiers[curTierIndex]) {
            // got to a new tier, sort the results of the previous tier
            // and get the minimum
            perTierMin.push(perTierResults.sort(compareTiersProp(FILESIZE, bufferSize))[0]);
            curTierIndex ++;
            perTierResults = [];
          }
          perTierResults.push(data[k]);
        }
        perTierMin.push(perTierResults.sort(compareTiersProp(FILESIZE, bufferSize))[0]);

        // find the tier whose tx time is closest to the value we got
        var tierIndex = bandwidthTiers.indexOf(perTierMin.sort(compareTiersProp(TX_TIME, time))[0][TIER]);
        tierIndex = tierIndex + OFFSET < bandwidthTiers.length ? tierIndex + OFFSET : tierIndex;

        for (var t = tierIndex; t < bandwidthTiers.length; t++) {
          maxBufferSizes.push(maxBufferSize[bandwidthTiers[t]]);
        }
      }
    }
    return maxBufferSizes;
  }
};
