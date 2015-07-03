//var http = require("http");
var Cache = require('../Common/cache.js');
var net = require("net");
var restify = require('restify');
var crypto = require('crypto');

var globalCache = new Cache();

PORT = 8080;


//  ------------  //
//  Server Setup  //
//  ------------  //
var server = restify.createServer({
    name: 'Load Balancing Proxy',
});

// uncomment for nifty curl support
// server.pre(restify.pre.userAgentConnection());

server.use(restify.bodyParser());


//  ---------------------  //
//  Cache Server Handling  //
//  ---------------------  //
var cacheServers = [// TO DO: start out with empty list and update everything to react appropriately
                    {
                        id: 0,
                        connectionInfo: { port: 8124 }
                    }];

var nextServerId = cacheServers.length;
function nextId() {
    return nextServerId++;
}

function selectServer(req) {

    // This function selects a 'random' cache server based on an md5 hash of the incoming request.

    if (cacheServers.length == 0) {
        return undefined;
    }

    var unhashedString = "" + req;
    var hashed = crypto.createHash('md5').update(unhashedString).digest('hex').substring(0,4);
    var integer = parseInt(hashed, 16);
    var idx = integer % cacheServers.length;
    return cacheServers[idx].connectionInfo;
}



//  ------------------  //
//  Client Application  //
//  ------------------  //
function sendApp(req, res, next) {
    console.log("sending App");
    res.send("TO DO: send down the AngularJS Client Application");
    return next();
}

function sendIndexHtml(req, res, next) {
    console.log("Sending Index.html");
    res.sendFile('./public/index.html');
    return next();
}

server.get('/', restify.serveStatic({
    'directory': './public',
    'default': 'index.html'
}));
server.get('/index', sendIndexHtml);

server.get('/data/:key', function (req, res, next) { // retrieve :key value
    var serverOptions = selectServer(req); // select a random server

    if (serverOptions === undefined) {
        console.log("No cache servers available");
        res.send("");
        return next();
    }

    var client = net.connect(serverOptions,
    function () {
        client.write(req.params.key, 'ascii');
    });

    client.on('data', function (data) {
        var val = data.toString();
        res.json(val);
        client.end();
    });

    client.on('end', function () {
        console.log('disconnected from server');
    });

    return next();
});


server.put('/data/:key', function (req, res, next) { // store or replace :key

    var serverOptions = selectServer(req); // select a random server

    if (serverOptions === undefined) {
        console.log("No cache servers available");
        res.send("");
        return next();
    }

    console.log("TO DO: save/overwrite value '" + req.params.value + "' for key '" + req.params.key + "'");
    res.send("");
    return next();
});

server.del('/data/:key', function (req, res, next) { // delete :key

    var serverOptions = selectServer(req); // select a random server

    if (serverOptions === undefined) {
        console.log("No cache servers available");
        res.send("");
        return next();
    }

    console.log("TO DO: delete key '" + req.params.key + "'");
    res.send(true);
    return next();
});



//  --------  //
//  /servers  //
//  --------  //
server.get('/servers', function (req, res, next) { // list all servers
    // TO DO: make this prettier
    res.send(cacheServers);
    return next();
});

server.post('/servers', function (req, res, next) { // add a new server
    // TO DO: test this, validate incoming parameter data
    var newServer = { id: nextId(), connectionInfo: req.params };
    cacheServers.push(newServer);
    req.send(true);
    return next();
});

server.del('/servers', function (req, res, next) { // delete all servers
    // TO DO: test this (cuz it's kinda scary)
    cacheServers = [];
    req.send(true);
    return next();
});

server.get('/servers/:id', function (req, res, next) { // get info for server :id
    // TO DO: make this prettier
    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (cacheServers[idx].id == req.params.id) {
            res.send(cacheServers[idx]);
            return next()
        }
    }
    res.send("Server not found");
    return next();
});


server.put('/servers/:id', function (req, res, next) { // replace server :id
    // TO DO: test this

    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (cacheServers[idx].id == req.params.id) {
            cacheServers[idx] = {id: req.params.id, connectionInfo: req.params.connectionInfo};
            res.send(true);
            return next()
        }
    }
    console.log("Server not found");
    res.send(false);
    return next();
});

server.del('/servers/:id', function (req, res, next) { // delete server :id
    // TO DO: test this

    // loop through all servers until we find the id to delete
    //  if it's the last one, pop it off the list
    //  else, put the last one in its place (order doesn't matter)
    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (cacheServers[idx].id == req.params.id) {
            var last = cacheServers.pop();
            if (idx != cacheServers.length - 1) {
                cacheServers[idx] = last;
            }
            res.send(true);
            return next()
        }
    }
    console.log("Server " + req.params.id + "not found");
    res.send(false);
    return next();
});


//  --------------  //
//  Run the server  //
//  --------------  //
server.listen(8080, function () {
    console.log("Load Balancing Proxy Server RESfully Listening on: http://localhost:%s", PORT);
});


setInterval(function() { // what does this do?
    if (!globalCache.Executing) {
    }
}, 3000);