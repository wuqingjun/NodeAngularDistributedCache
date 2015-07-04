
var Cache = require('../Common/cache.js'); // i think this can go away now
var Utilities = require('../Common/utilities.js');

var net = require("net");
var restify = require('restify');
var crypto = require('crypto');
var httpProxy = require('http-proxy');
var proxyService = httpProxy.createServer();

var globalCache = new Cache();  // this too

var PORT = 8080;
var DEBUG = 1;

//  ------------  //
//  Server Setup  //
//  ------------  //
var server = restify.createServer({
    name: 'Load Balancing Proxy',
});

// uncomment for nifty curl support
// server.pre(restify.pre.userAgentConnection());

// credit: https://gist.github.com/jeffwhelpley/5417758
var wrapper = function (middleware) {
    return function (req, res, next) {
        var regex = /^\/data.*$/;

        // if url is a proxy request, don't do anything and move to next middleware
        if (regex.test(req.url)) {
            next();
        }
            // else invoke middleware
        else {
            // some middleware is an array (ex. bodyParser)
            if (middleware instanceof Array) {
                middleware[0](req, res, function () {
                    middleware[1](req, res, next);
                });
            }
            else {
                middleware(req, res, next);
            }
        }
    };
};

server.use(wrapper(restify.bodyParser()));

// credit: http://stackoverflow.com/questions/22462895/post-request-dont-work-in-restify-getting-a-500-internal-server-error
server.on('uncaughtException', function (req, res, route, err) {
    console.log('uncaughtException', err.stack);
});

server.get('/', redirectRequest);

//  ---------------------  //
//  Cache Server Handling  //
//  ---------------------  //
var cacheServers = [// TO DO: start out with empty list and update everything to react appropriately
                    {
                        id: 0,
                        connectionInfo: 'http://localhost:8124'
                    }
                    ];

var nextServerId = cacheServers.length;
function nextId() {
    return nextServerId++;
}

function selectServer(req) {
    if (cacheServers.length == 0) {
        return undefined;
    }

    var unhashedString = "" + req;
    var hashed = crypto.createHash('md5').update(unhashedString).digest('hex').substring(0, 4);
    var integer = parseInt(hashed, 16);
    var idx = integer % cacheServers.length;
    return cacheServers[idx].connectionInfo;
}


//  --------------  //
//  Load Balancing  //
//  --------------  //
function redirectRequest(req, res, next) {
    var connectionInfo = selectServer(req); // select a random server

    if (connectionInfo === undefined) {
        console.log("No cache servers available");
        res.send("");
        return next();
    }

    if (DEBUG >= 1) {
        console.log(connectionInfo);
        console.log("Proxying '"+req.url+"' to '"+connectionInfo+"'");
    }

    proxyService.web(req, res, { target: connectionInfo });
    return next();
}

server.get('/all', redirectRequest);
server.get('/data/:key', redirectRequest);
server.put('/data/:key', redirectRequest);
server.del('/data/:key', redirectRequest);


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

    if (req.params.hasOwnProperty('port')) {
        req.params.port = parseInt(req.params.port, 10);
    }
    if (DEBUG >= 1) {
        console.log("/servers POST: %j", req.params);
    }

    var newId = null;
    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (Utilities.checkEqual(cacheServers[idx].connectionInfo, req.params)) {
            if (DEBUG >= 1) {
                console.log("Attempt to register existing server: " + JSON.stringify(req.params));
                console.log(cacheServers[idx]);
                console.log(cacheServers[idx].id);
            }
            newId = cacheServers[idx].id;
            break;
        }
    }

    if (newId === null) {
        newId = nextId();
        var newServer = { id: newId, connectionInfo: req.params };
        cacheServers.push(newServer);
    }
    
    res.setHeader('content-type', 'application/json');
    res.send({ id: newId });
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

    if (DEBUG >= 1) {
        console.log("/servers DEL: " + req.params.id);
    }

    // loop through all servers until we find the id to delete
    //  if it's the last one, pop it off the list
    //  else, put the last one in its place (order doesn't matter)
    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (cacheServers[idx].id == req.params.id) {
            var last = cacheServers.pop();
            if (idx != cacheServers.length) {
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
server.listen(PORT, function () {
    console.log("Load Balancing Proxy Server RESfully Listening on: http://localhost:%s", PORT);
});


setInterval(function() {
    if (!globalCache.Executing) {
    }
}, 3000);