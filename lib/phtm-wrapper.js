"use strict";
var path = require("path");
var fs = require("fs");
var childProcess = require("child_process");
var phantomjs = require("phantomjs");
var binPath = phantomjs.path;
var esprima = require("esprima");
var uuid = require("uuid").v4;
var modulr = require('modulr');
var backoff = require("backoff");
module.exports = function(phtm) {
    function visit(url, script, timeout, callback) {
        childProcess.execFile(binPath, [phtm, url, script], { timeout: timeout }, function(err, stdout, stderr) {
            if (err) return callback(err);
            callback(null, JSON.parse(stdout), stderr);
        });
    }
    
    return function(url, script, userOptions, callback) {
        var options = {
            attempts: userOptions.attempts || 1,
            timeout: userOptions.timeout || 0,
            delay: userOptions.delay || 0
        };
        var scriptfilepath = path.join(path.dirname(phtm), script);
        fs.readFile(scriptfilepath, function(err, body) {
            if (err) return callback(err);
            if (body.length === 0) {
                err = new Error('File is empty: "' + scriptfilepath + '".')
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
                
                modulr.build(scriptfilepath.replace(".js", ""), {
                    paths: ['/'], // defaults to ['.']
                    //root: 'path/to/package/root/' // defaults to process.cwd()
                    //minify: true,                 // defaults to false
                    //resolveIdentifiers: true,     // defaults to false
                    //minifyIdentifiers: false,     // defaults to false
                    environment: "production"
                }, function (err, result) {
                    if (err) return callback(err);
                    scriptfilepath = path.join(require("os").tmpdir(), uuid() + ".js");
                    script = path.relative(phtm, scriptfilepath);
                    fs.writeFile(scriptfilepath, result.output, 'utf8', function(err) {
                        if (err) return callback(err);
                        var call = backoff.call(visit, url, scriptfilepath, options.timeout, callback);
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


