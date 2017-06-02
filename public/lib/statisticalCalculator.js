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

    /**
     * Performs statistical calculations.
     * @param data - array of values used for computation.
     * @param iqrFilter - boolean to either perform iqrFiltering or slicing.
     * @param start - slicing start value
     * @param end - slicing end value.
     * @param callbackComplete - callback function for test suite for complete event.
     */
    function statisticalCalculator(data, iqrFilter, start, end, callbackComplete) {
        this.data = data;
        this.isIqrFilter = iqrFilter;
        //start is the value used for slicing the slowest data with given percentage.
        this.start = start;
        //end is the value used for slicing the fastest data with given percentage.
        this.end = end;
        this.clientCallbackComplete = callbackComplete;
    }

    /**
     * This function is used to do the calculations either with IQRFiltering or go with Slicing
     */
    statisticalCalculator.prototype.getResults = function () {
        this.data = this.data.sort(this.numericComparator);
        var dataset = (this.isIqrFilter) ? this.interQuartileRange(this.data) : this.slicing(this.data, this.start, this.end);
        var peakValue = dataset[dataset.length - 1];
        var mean = this.meanCalculator(dataset);

        var results = {
            stats: mean,
            peakValue: peakValue
        };
        this.clientCallbackComplete(results);
    };

    /**
     * Calculate the interquartile range of an array of data points
     *
     * https://en.wikipedia.org/wiki/Interquartile_range
     * In descriptive statistics, the interquartile range (IQR), also called
     * the midspread or middle fifty, or technically H-spread, is a measure of
     * statistical dispersion, being equal to the difference between the upper and
     * lower quartiles,[1][2] IQR = Q3 âˆ’  Q1. In other words, the IQR is the 1st quartile subtracted from the 3rd quartile
     * The interquartile range is often used to find outliers in data. Outliers are observations
     * that fall below Q1 - 1.5(IQR) or above Q3 + 1.5(IQR)
     */
    statisticalCalculator.prototype.interQuartileRange = function (a) {
        var length = a.length,
            dataSetWithOutliersRemoved = [],
            isEven = (a.length) % 2,
            iqr,
            i,
            fQMedian,
            tQMedian,
            n;

        if (isEven === 0) {
            n = a.length;
            fQMedian = this.medianCalculator(a.slice(0, (a.length) / 2));
            tQMedian = this.medianCalculator(a.slice((a.length) / 2, n));
            iqr = tQMedian - fQMedian;

        } else {
            n = a.length - 1;
            a.splice((n / 2), 1);

            fQMedian = this.medianCalculator(a.slice(0, (a.length) / 2));
            tQMedian = this.medianCalculator(a.slice(((a.length) / 2) + 1, n + 1));
            iqr = tQMedian - fQMedian;
        }
        var lowerOutliers = fQMedian - (1.5 * iqr);
        var upperOutliers = tQMedian + (1.5 * iqr);

        for (i = 0; i < length; i++) {

            if (a[i] > lowerOutliers && a[i] < upperOutliers) {
                dataSetWithOutliersRemoved.push(a[i]);
            }
        }

        return dataSetWithOutliersRemoved;
    };

    /**
     * Simple JavaScript comparator to help with sorting.
     * @param a
     * @param b
     * @returns {number}
     * @constructor
     */
    statisticalCalculator.prototype.numericComparator = function (a, b) {
        return (a - b);
    };

    /**
     * Calculates the Median.
     * @param a
     * @returns {number}
     */
    statisticalCalculator.prototype.medianCalculator = function (a) {
        var n = a.length - 1;
        var median = ((a[Math.floor(n / 2)] + a[Math.ceil(n / 2)]) / 2);
        return median;
    };

    /**
     * Calculates the sum and mean of an array
     * @param arr
     * @returns {{sum: *, mean: number}}
     */
    statisticalCalculator.prototype.meanCalculator = function (arr) {
        var sum = arr.reduce(function (a, b) {
            return a + b;
        }, 0);
        var mean = sum / arr.length;
        return {
            sum: sum,
            mean: mean
        };
    };

    /**
     * Function takes in array slices the top 30% and bottom 10% of data
     * @param a
     * @returns {*}
     */
    statisticalCalculator.prototype.slicing = function (a, start, end) {
        var dataLength = a.length;
        var arrayStartVal = Math.round(dataLength * start);
        var arrayEndVal = Math.round(dataLength * end);
        var sliceData = a.slice(arrayStartVal, arrayEndVal);
        return sliceData;
    };

    window.statisticalCalculator = statisticalCalculator;

})();
