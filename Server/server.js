var http = require('http');
var Cache = require('../Common/cache.js');
var restify = require('restify');
var querystring = require('querystring');
var minimist = require('minimist');
var net = require('net');
var globalCache = new Cache();

globalCache.push("k1", 'v1');
globalCache.push("k2", 'v2');

var ipcPorts = [8125, 8225];
var PORT = 8124;
var IPCPORT = 8125;
var DEBUG = 1;

var server = restify.createServer({
    name: 'Load Balancing Proxy',
});

// uncomment for nifty curl support
// server.pre(restify.pre.userAgentConnection());

server.use(restify.bodyParser());


server.get('/', restify.serveStatic({
    'directory': './public',
    'default': 'index.html'
}));

server.get('/all', function (req, res, next) {
    console.log('/all');
    var data = [];
    for (var k in globalCache.Objectes) {
        data.push({ key: k, value: globalCache.Objectes[k] });
    }
    
    for (var i in ipcPorts) {
        if (ipcPorts[i] != IPCPORT) {
            var client = net.connect({ port: ipcPorts[i] },
            function () {
                console.log('connected to server!');
                client.write('{"command": "list"}', 'utf8');
            });
            client.on('data', function (d) {
                var s = d.toString();
                var v = JSON.parse(s);
                data = data.concat(v);
                console.log(v);
                client.end();
                res.json(data);
            });
            client.on('end', function () {
                console.log('disconnected from server');
            });
        }
    }
    
    return next();
});

server.get('/data/:key', function (req, res, next) {
    var value = globalCache.get(req.params.key);
    if (DEBUG >= 1){
        console.log("GET: {"+req.params.key+":"+value+"}");
    }
    res.send(value);
    return next();
});


server.put('/data/:key', function (req, res, next) {
    globalCache.push(req.params.key, req.params.value);
    if (DEBUG >= 1){
        console.log("PUT: {"+req.params.key+":"+req.params.value+"}");
    }
    res.send(true);
    return next();
});


server.post('/data/:key', function (req, res, next) {
    globalCache.push(req.params.key, req.params.value);
    if (DEBUG >= 1) {
        console.log("PUT: {" + req.params.key + ":" + req.params.value + "}");
    }
    res.send(true);
    return next();
});


server.del('/data/:key', function (req, res, next) {
    globalCache.push(req.params.key, globalCache.default);
    if (DEBUG >= 1) {
        console.log("DEL: " + req.params.key);
    }
    res.send(true);
    return next();
});

server.del('/data', function (req, res, next) {
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
    node server.js --port=[port] --ipcPort=[ipcPort] --lbHost=[loadbalancer-address]
    node server.js --port=8224 --ipcPort=8225 --lbHost=localhost
*/
var argOpts = {
    default: {
        port: PORT,
        ipcPort: IPCPORT,
        lbHost: 'localhost',
        lbPort: 8080
    }
}
var argv = minimist(process.argv.slice(2), argOpts);
console.log(argv);
server.listen(argv.port, function () {
    console.log("Cache Server Listening on: http://localhost:%s", argv.port);
    register("http://" + argv.lbHost + ":" + argv.lbPort);
});

var ipcserver = net.createServer(function (c) {
    console.log('client connected');
    c.on('end', function () {
        console.log('client disconnected');
    });
    c.on('data', function (data) {
        var buf = new Buffer(256);
        var len = buf.write(data.toString());
        var k = buf.toString('utf8', 0, len);
        var obj = JSON.parse(k);
        if (obj.command === 'list') {
            var v = [];
            for (var k in globalCache.Objectes) {
                v.push({ key: k, value: globalCache.Objectes[k] });
            }
            var s = JSON.stringify(v);
            c.write(s);
            c.pipe(c);
        }
    });
});

ipcserver.listen(argv.ipcPort, function () {
    console.log('server bound on port: %s', argv.ipcPort);
});



process.on('SIGINT', function () {
    if (loadBalancer != null && myId != null) {
        unregister();
    }
    else {
        process.exit();
    }
});
