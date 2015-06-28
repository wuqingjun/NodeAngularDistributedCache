var http = require("http");
var Cache = require('./cache.js');
var net = require("net");

var globalCache = new Cache();

var httpserver = http.createServer(function (request, response) {
    globalCache.push("k1", 'v1');
    globalCache.push("k2", 'v2');
    response.writeHead(200, { "Content-Type": "text/html" });
    response.write("<!DOCTYPE 'html'>");
    response.write("<html>");
    response.write("<head>");
    response.write("<title>Hello World Page</title>");
    response.write("</head>");
    response.write("<body>");
    response.write(globalCache.get('k1'));
    response.write("</body>");
    response.write("</html>");
    response.end();
});

httpserver.listen(process.env.PORT || 8080);

var server = net.createServer(function (c) { //'connection' listener
    console.log('client connected');
    c.on('end', function () {
        console.log('client disconnected');
    });
    c.on('data', function (data) {
        var buf = new Buffer(256);
        var len = buf.write(data.toString(), 0, 'ascii');
        var k = buf.toString('ascii', 0, len);
        var v = globalCache.get(k);
        c.write(v !== undefined ? v : 'undefined');
        c.pipe(c);
    });
});

server.listen(8124, function () {
    console.log('server bound');
});

setInterval(function() {
    if (!globalCache.Executing) {
        console.log(globalCache.get('k1'));
    }
}, 3000);

