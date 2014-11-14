"use strict";
var path = require("path");
var phtm = require("./lib/phtm-wrapper")(path.resolve(__dirname, "./lib/script.js"));

function visit(url, script, options, callback) {
    if (!url || !script) return callback(new TypeError("Incorrect arguments."));
    if (!callback) {
        callback = options;
        options = {};
    }
    phtm(url, script, options, function(err, result) {
        callback(err, result);
    });
}

function visitPages(urls, script, options, callback) {
    if (!urls || !script) return callback(new TypeError("Incorrect arguments."));
    if (!callback) {
        callback = options;
        options = {};
    }
    urls = urls.slice(0);
    var output = [];
    
    function next(err, result) {
        if (err) {
            callback(err);
            return;
        }
        output.push(result);
        if (urls.length) {
            visit(urls.shift(), script, next);
        } else {
            callback(null, output);
        }
    }
    
    visit(urls.shift(), script, next);
};

module.exports = visit;
module.exports.visit = visit;
module.exports.visitPages = visitPages;