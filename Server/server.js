/* run it like this
    node server.js --port=[port] --ipcPort=[ipcPort] --lbHost=[loadbalancer-address]
    node server.js --port=8224 --ipcPort=8225 --lbHost=localhost
*/

var http = require('http');
var Cache = require('../Common/cache.js');
var restify = require('restify');
var querystring = require('querystring');
var minimist = require('minimist');
var net = require('net');
var Registration = require('../Common/register.js');
var IpcServer = require('../Common/ipcserver.js');
var IpcClient = require('../Common/ipcclient.js');
var CreateRestifyServer = require('../Common/createRestifyServer.js');

var globalCache = new Cache();
var ipcPorts = [8125, 8225];
var PORT = 8124;
var IPCPORT = 8125;
var PROXYIPCPORT = 8081;
var DEBUG = 1;

var argOpts = {
    default: {
        port: PORT,
        ipcPort: IPCPORT,
        lbHost: 'localhost',
        lbPort: 8080
    }
}

var argv = minimist(process.argv.slice(2), argOpts);
CreateRestifyServer(globalCache, argv.port, argv.ipcPort);
IpcServer(globalCache, argv.ipcPort);
var reg = new Registration("http://" + argv.lbHost + ":" + argv.lbPort);
reg.register(argv.port, argv.ipcPort);

process.on('SIGINT', function () {
    if (reg.loadBalancer != null && reg.myId != null) {
        reg.unregister();
    }
    else {
        process.exit();
    }
});
