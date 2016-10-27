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

describe('xmlhttprequest test functions and onComplete:', function() {

    // test setup
    beforeEach(function () {
        jasmine.Ajax.install();
    });

    // test teardown
    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

    it('should expose the xmlhttprequest start function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request.start).toBe('function');
    });

    it('should expose the xmlhttprequest _initiateRequest function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._initiateRequest).toBe('function');
    });

    it('should expose the xmlhttprequest _handleLoadstart function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleLoadstart).toBe('function');
    });

    it('should expose the xmlhttprequest _handleError function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleError).toBe('function');
    });

    it('should expose the xmlhttprequest _handleTimeout function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleTimeout).toBe('function');
    });

    it('should expose the xmlhttprequest _handleAbort function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleAbort).toBe('function');
    });

    it('should expose the xmlhttprequest close function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request.close).toBe('function');
    });

    it('should expose the xmlhttprequest _handleOnReadyStateChange function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleOnReadyStateChange).toBe('function');
    });

    it('should expose the xmlhttprequest _handleLoad function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleLoad).toBe('function');
    });

    it('should expose the xmlhttprequest _handleOnProgressDownload function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleOnProgressDownload).toBe('function');
    });

    it('should expose the xmlhttprequest _handleOnProgressUpload function', function() {
        var request = new window.xmlHttpRequest();
        expect(typeof request._handleOnProgressUpload).toBe('function');
    });

    it('should return result in onComplete', function(done){
            window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
            var id = 1;
            function requestOnComplete(result){
                expect(typeof result.time).toBe('number');
                expect(result.id).toEqual(parseInt(id));
            }
            function requestOnProgress(result){
            }
            function requestOnAbort(result){
            }
            function requestOnTimeout(result){
            }
            function requestOnError(result){
            }

            var request = new window.xmlHttpRequest('GET', '/latencyTestPoint', 3000, requestOnComplete,
                requestOnAbort, requestOnTimeout, requestOnError);
            request.start(0,id);
            // mock successful response
            setTimeout(function() {
                jasmine.Ajax.requests.mostRecent().respondWith({
                    status: 200
                });
                done();
            }, 0);

        });
});

describe('SpeedTest Core JS Library: TestRequest (mocked time)', function() {

    // test setup
    beforeEach(function() {
        jasmine.clock().install();
        jasmine.Ajax.install();
    });

    // test teardown
    afterEach(function() {
        jasmine.Ajax.uninstall();
        jasmine.clock().uninstall();
    });

    it('should fire timeout callback on request timeout', function() {
        var testUrl = '/testendpoint';
        jasmine.Ajax.stubRequest(testUrl).andTimeout();
        var id = 1;
        function requestOnComplete(result){
        }
        function requestOnProgress(result){
        }
        function requestOnAbort(result){
        }
        function requestOnTimeout(result){
            //TODO return different object
            expect(typeof result).toBe('object');
        }
        function requestOnError(result){
        }

        var request = new window.xmlHttpRequest('GET', testUrl, 0, requestOnComplete,
            requestOnAbort, requestOnTimeout, requestOnError);
        request.start(0,id);

    });



});


