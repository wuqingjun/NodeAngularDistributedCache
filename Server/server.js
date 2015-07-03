var http = require('http');
var Cache = require('../Common/cache.js');
var restify = require('restify');
var querystring = require('querystring');

var globalCache = new Cache();

globalCache.push("k1", 'v1');
globalCache.push("k2", 'v2');


var PORT = 8124;
var DEBUG = 1;

//  ------------  //
//  Server Setup  //
//  ------------  //
var server = restify.createServer({
    name: 'Load Balancing Proxy',
});

// uncomment for nifty curl support
// server.pre(restify.pre.userAgentConnection());

server.use(restify.bodyParser());


server.get('/data/:key', function (req, res, next) { // retrieve :key value
    
    var value = globalCache.get(req.params.key);
    
    if (DEBUG >= 1){
        console.log("GET: {"+req.params.key+":"+value+"}");
    }

    res.send(value);
    return next();
});


server.put('/data/:key', function (req, res, next) { // store or replace :key
    
    globalCache.push(req.params.key, req.params.value);
    
    if (DEBUG >= 1){
        console.log("PUT: {"+req.params.key+":"+req.params.value+"}");
    }

    res.send(true);
    return next();
});

server.del('/data/:key', function (req, res, next) { // delete :key
    
    globalCache.push(req.params.key, globalCache.default);
    
    if (DEBUG >= 1) {
        console.log("DEL: " + req.params.key);
    }

    res.send(true);
    return next();
});

server.del('/data', function (req, res, next) { // delete all

    globalCache.clear();
    
    if (DEBUG >= 1){
        console.log("CLEAR Global Cache");
    }
        
    res.send(true);
    return next();
});

//  -----------------------  //
//  Register with the Proxy  //
//  -----------------------  //
var defaultProxy = { host: 'localhost', port: 8080 }
var activeConnection = null;
var myId = null;

function register(args) {

    // credit: https://nodejs.org/api/http.html#http_http_request_options_callback
    var postData = querystring.stringify({
        'port' : PORT,
    });
    
    var connectionOptions = {
        host: defaultProxy.host,
        port: defaultProxy.port,
        path: "/servers",
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };
    
    if (args.length == 2) {
        connectionOptions.host = args[0];
        connectionOptions.port = args[1];
    }

    var req = http.request(connectionOptions, function (res) {
        if (DEBUG >= 1) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
        }

        if (res.statusCode != 200) {
            console.log("Failed to Register with Load Balancer");
            process.exit();
        }

        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            if (DEBUG >= 1) {
                console.log('BODY: ' + chunk);
            }
            myId = parseInt(chunk.replace('"', ''), 10);
        });

        activeConnection = {
            host: connectionOptions.host,
            port: connectionOptions.port
        };
    });

    req.on('error', function (e) {
        console.log('Problem with request: ' + e.message);
    });

    // write data to request body
    req.write(postData);
    req.end();
}
    /*
    THIS DOESNT WORK YET.
function unregister() { 

    var connectionOptions = {
        host: activeConnection.host,
        port: activeConnection.port,
        path: "/servers/"+myId,
        method: "DELETE"
    };

    var req = http.request(connectionOptions, function (res) {
        if (DEBUG >= 1) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
        }

        if (res.statusCode != 200) {
            console.log("Failed to Unregister with Load Balancer");
            process.exit();
        }

        activeConnection = null;
        myId = null;
    });

    req.on('error', function (e) {
        console.log('Problem with request: ' + e.message);
    });

    req.write("");
    req.end();
}*/

//  --------------  //
//  Run the server  //
//  --------------  //
server.listen(PORT, function () {
    console.log("Cache Server Listening on: http://localhost:%s", PORT);
    register(process.argv.slice(2));
});

/*
THIS DOESNT WORK YET
process.on('SIGINT', function () {
    console.log('SIGINT');
    console.log(activeConnection);
    console.log(myId);
    if (activeConnection != null && myId != null) {
        unregister();
    }
    process.exit();
});
*/