"use strict";
var path = require("path");
var fs = require("fs");
var childProcess = require("child_process");
var phantomjs = require("phantomjs");
var binPath = phantomjs.path;
var esprima = require("esprima");
var uuid = require("uuid").v4;
var backoff = require("backoff");
var bundler = require('./bundler')

module.exports = function(phtm) {
    // Check for script being a correct ES program
    // as it silently fails in PhantomJS otherwise
    // which is really hard to debug.
    var body = fs.readFileSync(phtm);
    try {
        esprima.parse(body);
    } catch(e) {
        e.file = phtm;
        throw e;
    }

    function visit(url, script, options, callback) {
        var args = [phtm, url, script];
        if (options.config) {
            args.unshift("--config=" + options.config);
        }
        childProcess.execFile(binPath, args, { timeout: options.timeout }, function(err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, JSON.parse(stdout), stderr);
        });
    }
    
    return function(url, script, userOptions, callback) {
        var options = {
            attempts: userOptions.attempts || 1,
            timeout: userOptions.timeout || 0,
            delay: userOptions.delay || 0,
            config: userOptions.config
        };
        var bundlepath = path.join(require("os").tmpdir(), uuid() + ".js");
        bundler(script, bundlepath, function(err) {
            if (err) return callback(err)
            var call = backoff.call(visit, url, bundlepath, options, callback);
            call.setStrategy(new backoff.ExponentialStrategy({
                initialDelay: options.delay || 1
            }));
            call.failAfter(options.attempts);
            call.start();
        });
    }
};

