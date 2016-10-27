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

'use strict';
describe('downloadHttpConcurrent functions', function() {

    // test setup
    beforeEach(function () {
        jasmine.Ajax.install();
    });

    // test teardown
    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

    it('should expose the onTestError function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.onTestError).toBe('function');
    });

    it('should expose the onTestAbort function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.onTestAbort).toBe('function');
    });

    it('should expose the onTestTimeout function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.onTestTimeout).toBe('function');
    });

    it('should expose the onTestComplete function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.onTestComplete).toBe('function');
    });

    it('should expose the onTestProgress function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.onTestProgress).toBe('function');
    });

    it('should expose the start function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.start).toBe('function');
    });

    it('should expose the abortAll function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.abortAll).toBe('function');
    });

    it('should expose the initiateTest function', function() {
        var test = new window.downloadHttpConcurrent();
        expect(typeof test.initiateTest).toBe('function');
    });

});
