var restify = require('restify');
var IpcClient = require('../common/ipcclient.js');

var DEBUG = 1;

function CreateRestifyServer(globalCache, port, ipcport) {
    this.ipcPorts = [8125, 8225];
    this.myIpcPort = ipcport;
    this.httpPort = port;
    this.server= restify.createServer({
        name: 'cache server'
    });

    var temp = this;
    
    var server = restify.createServer({
            name: 'cache server'
        });

    server.use(restify.bodyParser());
    /*
    server.on('uncaughtException', function (request, response, route, error) {
        console.log(error);
        console.log(error.stack);
    });  // Emitted when some handler throws an uncaughtException somewhere in the chain. The default behavior is to just call res.send(error), and let the built-ins in restify handle transforming, but you can override to whatever you want here.
    */
    server.get(/^\/(?!(data|all)).*/, restify.serveStatic({
        directory: './public',
        default: 'index.html'
    }));
    
    server.get('/all', function(req, res, next) {
        console.log('/all');
        console.log(temp.ipcPorts);
        var data = [];
        for (var k in globalCache.Objectes) {
            data.push({ key: k, value: globalCache.get(k) });
        }
        res.json(data);

        for (var i in temp.ipcPorts) {
            if (temp.ipcPorts[i] != temp.myIpcPort) {
                var params = [res, data];
                IpcClient(temp.ipcPorts[i], '{"command": "list"}', onList, params);
            }
        }
        return next();
    });

    server.get('/data/:key', function (req, res, next) {

        if (DEBUG >= 1) {
            console.log("GET: %s", req.params.key);
        }
        var value = globalCache.get(req.params.key);
        if (value == undefined) {
            // return a 404 because that's what's in the Report Document
            return next(new restify.NotFoundError("Key not found: '" + req.params.key + "'"));
        }
        res.send(value);
        return next();
    });


    server.put('/data/:key', function (req, res, next) {
        if (DEBUG >= 1) {
            console.log("PUT: %s:%s", req.params.key, req.params.value);
        }
        globalCache.push(req.params.key, req.params.value);
        res.send(true);
        return next();
    });


    server.post('/data/:key', function (req, res, next) {
        if (DEBUG >= 1) {
            console.log("PUT: %s:%s", req.params.key, req.params.value);
        }
        globalCache.push(req.params.key, req.params.value);
        res.send(true);
        return next();
    });

    server.del('/data/:key', function (req, res, next) {
        if (DEBUG >= 1) {
            console.log("DEL: %s:%s", req.params.key);
        }
        globalCache.push(req.params.key, globalCache.default);
        res.send(true);
        return next();
    });

    server.del('/data', function(req, res, next) {
        globalCache.clear();
        res.send(true);
        return next();
    });

    server.listen(port, function() {
        console.log("Http server listening at port: %s", port);
    });
};

function onList(params) {
    params.data = data.concat(params.items);
    params.res.json(params.data);
}

module.exports = CreateRestifyServer;