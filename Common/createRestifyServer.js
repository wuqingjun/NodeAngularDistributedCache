﻿var restify = require('restify');
var IpcClient = require('../common/ipcclient.js');

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

    server.get('/', restify.serveStatic({
        'directory': './public',
        'default': 'index.html'
    }));

    server.get('/all', function(req, res, next) {
        console.log('/all');
        console.log(temp.ipcPorts);
        var data = [];
        for (var k in globalCache.Objectes) {
            data.push({ key: k, value: globalCache.Objectes[k] });
        }
        res.json(data);

        for (var i in temp.ipcPorts) {
            if (temp.ipcPorts[i] != temp.myIpcPort) {
                IpcClient(temp.ipcPorts[i], data, res, '{"command": "list"}');
            }
        }
        return next();
    });

    server.get('/data/:key', function(req, res, next) {
        var value = globalCache.get(req.params.key);
        res.send(value);
        return next();
    });


    server.put('/data/:key', function(req, res, next) {
        globalCache.push(req.params.key, req.params.value);
        res.send(true);
        return next();
    });


    server.post('/data/:key', function(req, res, next) {
        globalCache.push(req.params.key, req.params.value);
        res.send(true);
        return next();
    });

    server.del('/data/:key', function(req, res, next) {
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

module.exports = CreateRestifyServer;