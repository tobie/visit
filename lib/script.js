var system = require('system');

if (system.args.length <= 2) {
    system.stderr.write('Not enough args.');
    phantom.exit(1);
}

var page = require('webpage').create();

phantom.onError = page.onError = function(err, trace) {
  var msgStack = [err];
  if (trace && trace.length) {
    trace.forEach(function(t) {
      msgStack.push('    ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  system.stderr.write(msgStack.join('\n'));
  system.stderr.write('\n');
  page && page.close();
  phantom.exit(1);
};

page.onCallback = function(obj) {
    system.stdout.write(JSON.stringify(obj));
    page.close();
    phantom.exit(0);
};

page.open(system.args[1], function (status) {
    if (status !== 'success') {
        system.stderr.write('Unable to access network.');
        page.close();
        phantom.exit(1);
    }
    
    if (!page.injectJs(system.args[2])) {
        system.stderr.write('Cannot inject "' + system.args[2] + '".');
        page.close();
        phantom.exit(1);
    }
});
