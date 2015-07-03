var http = require('http');
var Cache = require('../Common/cache.js');
var restify = require('restify');
var querystring = require('querystring');
var minimist = require('minimist');

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
var myId = null;
var loadBalancer = null;

function register(loadBalancerUrl) {

    loadBalancer = restify.createJsonClient({
        url: loadBalancerUrl
    });
    
    loadBalancer.post('/servers', { 'port': PORT }, function (err, req, res, obj) {
        if (err) {
            console.log('Problem Registering with Load Balancer: %s', err);
            process.exit();
        }
        myId = obj.id;
        if (DEBUG >= 1) {
            console.log('%d -> %j', res.statusCode, res.headers);
            console.log('%j', obj);
        }

    });
}

function unregister() { 
    loadBalancer.del('/servers/' + myId, function (err, req, res) {
        if (err){
            console.log('Problem with request: ' + err);
        }
        if (DEBUG >= 1) {
            console.log('%d -> %j', res.statusCode, res.headers);
        }
        myId = null;
        loadBalancer = null;
        process.exit();
    });
}

//  --------------  //
//  Run the server  //
//  --------------  //

/* run it like this
    node server.js [port] [loadbalancer-address]
*/
var argOpts = {
    default: {
        port: PORT,
        lbHost: 'localhost',
        lbPort: 8080
    }
}
var argv = minimist(process.argv.slice(2), argOpts);

server.listen(argv.port, function () {
    console.log("Cache Server Listening on: http://localhost:%s", argv.port);
    register("http://" + argv.lbHost + ":" + argv.lbPort);
});

process.on('SIGINT', function () {
    if (loadBalancer != null && myId != null) {
        unregister();
    }
    else {
        process.exit();
    }
});
