'use strict';
describe('latencyHttpTest functions', function() {

    // test setup
    beforeEach(function () {
        jasmine.Ajax.install();
    });

    // test teardown
    afterEach(function () {
        jasmine.Ajax.uninstall();
    });

    it('should expose the initiateTest function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.initiateTest).toBe('function');
    });

    it('should expose the start function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.start).toBe('function');
    });

    it('should expose the onTestError function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.onTestError).toBe('function');
    });

    it('should expose the onTestAbort function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.onTestAbort).toBe('function');
    });

    it('should expose the onTestTimeout function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.onTestTimeout).toBe('function');
    });

    it('should expose the onTestComplete function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.onTestComplete).toBe('function');
    });

    it('should expose the abortAll function', function() {
        var test = new window.latencyHttpTest();
        expect(typeof test.abortAll).toBe('function');
    });


});