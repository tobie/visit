var fs = require("fs");
var browserify = require("browserify");
var through2 = require("through2");

module.exports = function(input, output, callback) {
    var inputstream = fs.createReadStream(input).on("error", callback);
    var isEmpty = through2(
      function (chunk, enc, cb) {
          if (this._notEmpty || (/\S/).test(chunk)) this._notEmpty = true;
          cb(null, chunk);
      },
      function (cb) {
        if (this._notEmpty) cb();
        else cb(new Error('Empty File: "' + input + '".'));
      }
    ).on("error", callback);
    
    browserify(inputstream.pipe(isEmpty), {}).bundle()
        .on("error", callback)
        .pipe(fs.createWriteStream(output))
        .on("error", callback)
        .on("finish", callback);
};
