var Cache = require('../Common/cache.js'); // i think this can go away now
var Utilities = require('../Common/utilities.js');
var IpcServer = require('../Common/ipcserver.js');
var CallbackFunction = require('../Common/callbackfunction.js');

var net = require("net");
var restify = require('restify');
var crypto = require('crypto');
var httpProxy = require('http-proxy');
var deepcopy = require('deepcopy');

var proxyService = httpProxy.createServer();

var globalCache = new Cache();  // this too

var PORT = 8080;
var IPCPORT = 8083;
var DEBUG = 1;

//  ------------  //
//  Server Setup  //
//  ------------  //
var server = restify.createServer({
    name: 'Load Balancing Proxy'
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
                    //{
                    //    id: 0,
                    //    connectionInfo: 'http://localhost:8124',
                    //    ipcport: 8225,
                    //    lastheartbeat: datetime
                    //}
                    ];

var nextServerId = cacheServers.length;
function nextId() {
    return nextServerId++;
}


var maxHash  = 0xFFFFFFFFFFFF;
var halfHash = 0x7FFFFFFFFFFF;

function findServerByAddress(address) {


    // search second half of list for a server
    var idx = Math.floor((address / maxHash) * cacheServers.length);

    if (cacheServers.length <= 2) {
        // there are only two entries and they're identical
        return idx;
    }

    if (DEBUG >= 1) {
        console.log("Searching for: %d", address);
        console.log("idx: %d", idx);
    }

    for (idx; idx < cacheServers.length - 1; idx++) {
        if (cacheServers[idx].address < address & address < cacheServers[idx + 1].address) {

            if (DEBUG >= 1) {
                console.log("Found %d between %d and %d", address,
                                                          cacheServers[idx].address,
                                                          cacheServers[idx + 1].address);
            }

            return idx + 1;
        }
    }
    // check the rollover
    if (cacheServers[cacheServers.length - 1].address < address & address < cacheServers[0].address) {

        if (DEBUG >= 1) {
            console.log("Found %d between %d and %d", address,
                                                      cacheServers[cacheServers.length - 1].address,
                                                      cacheServers[0].address);
        }
        return 0;
    }

    // search again from the beginning, we'll never get to the second half but whatever
    idx = 0;
    for (idx; idx < cacheServers.length - 1; idx++) {
        if (cacheServers[idx].address < address & address < cacheServers[idx + 1].address) {

            if (DEBUG >= 1) {
                console.log("Found %d between %d and %d", address,
                                                          cacheServers[idx].address,
                                                          cacheServers[idx + 1].address);
            }

            return idx + 1;
        }
    }
}

function selectServer(req) {
    if (cacheServers.length == 0) {
        return undefined;
    }
    var unhashedString = "";
    if (req.params.key != undefined) {
        // found a key, hash on that
        unhashedString += req.params.key;
    }
    else {
        // didnt find a key, this is just to select a random server
        unhashedString += req.params;
    }

    var hashed = crypto.createHash('sha1').update(unhashedString).digest('hex').substring(0, 12);
    var hashAddress = parseInt(hashed, 16);
    var idx = findServerByAddress(hashAddress);
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
server.post('/data/:key', redirectRequest);
server.del('/data/:key', redirectRequest);


//  --------  //
//  /servers  //
//  --------  //
server.get('/servers', function (req, res, next) { // list all servers
    // TO DO: make this prettier
    var uniqueServers = [];
    var addedIds = [];
    for (var idx = 0; idx < cacheServers.length; idx++) {
        if (addedIds.indexOf(cacheServers[idx].id) == -1) {
            uniqueServers.push(cacheServers[idx]);
            addedIds.push(cacheServers[idx].id);
        }
    }

    res.send(uniqueServers);
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
            return next();
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
            return next();
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

var callbacklist = [];
var registerServerCallback = new CallbackFunction(registerServer, {});
callbacklist['registerserver'] = new CallbackFunction(registerServer, {});
callbacklist['heartbeat'] = new CallbackFunction(heartbeat, {});

IpcServer(globalCache, IPCPORT, callbacklist);

setInterval(function() {
    if (!globalCache.Executing) {
    }
}, 3000);


function registerServer(params) {

    // place the new server twice, each on opposite sides of the ring
    // this keeps us from having to balance the keys

    var unhashedString = ""+params;
    var hashed = crypto.createHash('sha1').update(unhashedString).digest('hex').substring(0, 12);
    var hashAddress = parseInt(hashed, 16);

    var firstIdx = findServerByAddress(hashAddress);

    var firstNewServer = {
        id: nextId(),
        connectionInfo: params.connectionInfo,
        ipcport: params.ipcport,
        lastheartbeat: new Date(),
        address: hashAddress
    };

    cacheServers.splice(firstIdx, 0, firstNewServer);
    
    if (halfHash < hashAddress) {
        hashAddress -= halfHash;
    }
    else {
        hashAddress += halfHash;
    }

    var secondIdx = findServerByAddress(hashAddress);
    var secondNewServer = deepcopy(firstNewServer);
    secondNewServer.address = hashAddress;

    cacheServers.splice(secondIdx, 0, secondNewServer);

    // TO DO: Transfer existing keys when a new server is added
}

function updateServer(params) {
    for (var i = 0; i < cacheServers.length; ++i) {
        if (cacheServers[i].ipcport === params.ipcport) {
            cacheServers[i].lastheartbeat = new Date();
        }
    }
}

function heartbeat(params) {
    console.log('Heart beat from: ' + params.server + ' :' + params.ipcport);
    updateServer(params);
}