var http = require("http");
var Cache = require('../Common/cache.js');
var net = require("net");

var globalCache = new Cache();

globalCache.push("k1", 'v1');
globalCache.push("k2", 'v2');

var server = net.createServer(function (c) {
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