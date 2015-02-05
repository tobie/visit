var assert = require("assert"),
    visit = require("../index");

var http = require("http");

function html(title, body) {
    var output = "";
    output += "<!doctype html>";
    output += "<html>";
    output +=     "<head>";
    output +=         "<title>" + title + "</title>";
    output +=     "</head>";
    output +=     "<body>"
    output +=         (body || "");
    output +=     "<body>"
    output += "</html>"
    return output;
}

suite("Test visit module", function() {

    var attempts = 0;
    var server = http.createServer(function (req, res) {
        res.writeHead(200, {"Content-Type": "text/html"});
        if (req.url == "/bar") {
            res.end(html("bar"));
        } else if (req.url == "/foo") {
            res.end(html("foo"));
        } else if (req.url == "/toc") {
            res.end(html("ToC", "<ol class=\"toc\"></ol><ol></ol>"));
        } else if (req.url == "/broken") {
            req.socket.destroy();
        } else if (req.url == "/broken-at-first") {
            if (attempts < 4) {
                req.socket.destroy();
                attempts++;
            } else {
                res.end(html("fixed at last"));
            }
        } else if (req.url == "/slow") {
            setTimeout(function() { res.end(html("slow")); }, 2000)
        } else {
            res.end(html("default"));
        }
    }).listen(3000, "127.0.0.1");
    
    test("visit", function(done) {
        visit("http:127.0.0.1:3000/foo", "./fixtures/script.js", function(err, results) {
            assert(!err, err);
            assert.equal(typeof results, "object");
            assert.equal(results.title, "foo");
            done();
        });
    });
    
    test("visitPages", function(done) {
        visit.visitPages(["http:127.0.0.1:3000/foo", "http:127.0.0.1:3000/bar"], "./fixtures/script.js", function(err, results) {
            assert(!err, err);
            assert(Array.isArray(results));
            assert.equal(results[0].title, "foo");
            assert.equal(results[1].title, "bar");
            done();
        });
    });
    
    test("visitPages errors when one of the urls breaks", function(done) {
        var urls = ["http:127.0.0.1:3000/foo", "http:127.0.0.1:3000/bar", "http:127.0.0.1:3000/broken"];
        visit.visitPages(urls, "./fixtures/script.js", function(err, results) {
            assert(err);
            assert(!results);
            done();
        });
    });
    
    test("timeout of 500 ms stops the visit after half a second.", function(done) {
        visit("http:127.0.0.1:3000/slow", "./fixtures/script.js", { timeout: 500 }, function(err, results) {
            assert(err);
            assert(!results);
            done();
        });
    });
    
    test("tries multiple attempts before giving up.", function(done) {
        attempts = 0;
        visit("http:127.0.0.1:3000/broken-at-first", "./fixtures/script.js", { attempts: 3 }, function(err, results) {
            assert(!err, err);
            assert.equal(typeof results, "object");
            assert.equal(results.title, "fixed at last");
            done();
        });
    });
    
    test("supports npm packages.", function(done) {
        visit("http:127.0.0.1:3000/toc", "./fixtures/require-pkg.js", function(err, results) {
            assert(!err, err);
            assert.equal(results.tocSize, 2);
            done();
        });
    });
    
    test("warns about empty script pages upfront.", function(done) {
        visit("http:127.0.0.1:3000/bar", "./fixtures/empty.js", function(err, results) {
            assert(err, err);
            done();
        });
    });
    
    test("warns about missing script pages upfront.", function(done) {
        visit("http:127.0.0.1:3000/bar", "./fixtures/doess-not-exist.js", function(err, results) {
            assert(err, err);
            done();
        });
    });
    suiteTeardown(function() {
        server.close()
    })
});


