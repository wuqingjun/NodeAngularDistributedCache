var http = require("http");
var Cache = require('../Common/cache.js');
var net = require("net");

var globalCache = new Cache();

var httpserver = http.createServer(function (request, response) {
    get('k1', request, response);
});

httpserver.listen(8080);

setInterval(function() {
    if (!globalCache.Executing) {
    }
}, 3000);

function get(k, request, response) {
    var client = net.connect({ port: 8124 },
    function () {
        console.log('connected to server ascii!');
        client.write(k, 'ascii');
    });
    client.on('data', function (data) {
        var v = data.toString();
        console.log(v);
        client.end();
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write("<!DOCTYPE 'html'>");
        response.write("<html>");
        response.write("<head>");
        response.write("<title>Hello World Page</title>");
        response.write("</head>");
        response.write("<body>");
        response.write(v);
        response.write("</body>");
        response.write("</html>");
        response.end();
    });
    client.on('end', function () {
        console.log('disconnected from server');
    });
}

