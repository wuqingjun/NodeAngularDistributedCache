var http = require("http");
var cache = require('./cache.js');

var server = http.createServer(function (request, response) {
    cache.Cache.push('k1', 'v1');
    response.writeHead(200, { "Content-Type": "text/html" });
    response.write("<!DOCTYPE 'html'>");
    response.write("<html>");
    response.write("<head>");
    response.write("<title>Hello World Page</title>");
    response.write("</head>");
    response.write("<body>");
    response.write(cache.Cache.get('k1'));
    response.write("</body>");
    response.write("</html>");
    response.end();
});

server.listen(process.env.PORT  || 8080);