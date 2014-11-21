"use strict";
var path = require("path");
var fs = require("fs");
var childProcess = require("child_process");
var phantomjs = require("phantomjs");
var binPath = phantomjs.path;
var esprima = require("esprima");
var uuid = require("uuid").v4;
var browserify = require('browserify');
var backoff = require("backoff");
module.exports = function(phtm) {
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
        fs.readFile(script, function(err, body) {
            if (err) return callback(err);
            if (body.length === 0) {
                err = new Error('File is empty: "' + script + '".')
                return callback(err);
            }
            fs.readFile(phtm, function(err, body) {
                if (err) return callback(err);
                try {
                    esprima.parse(body);
                } catch(e) {
                    e.file = phtm;
                    return callback(e);
                }
                
                browserify(script, {}).bundle(function(err, result) {
                    if (err) return callback(err);
                    var bundlepath = path.join(require("os").tmpdir(), uuid() + ".js");
                    fs.writeFile(bundlepath, result, 'utf8', function(err) {
                        if (err) return callback(err);
                        var call = backoff.call(visit, url, bundlepath, options, callback);
                        call.setStrategy(new backoff.ExponentialStrategy({
                            initialDelay: options.delay || 1
                        }));
                        call.failAfter(options.attempts);
                        call.start();
                    });
                });
            });
        });
    }
};


