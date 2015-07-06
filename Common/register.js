var restify = require('restify');
var IpcClient = require('./ipcclient.js');

function Registration(loadBalancerUrl) {
    this.loadBalancer = restify.createJsonClient({
        url: loadBalancerUrl
    });
    this.myId = 5;
}

Registration.prototype.register = function(httpPort, ipcPort){
    this.loadBalancer.post('/servers', { 'port': httpPort, 'ipcport': ipcPort }, function (err, req, res, obj) {
        if (err) {
            console.log('Problem Registering with Load Balancer: %s', err);
            process.exit();
        }
        this.myId = obj.id;
    });
}

Registration.prototype.unregister = function () {
    this.loadBalancer.del('/servers/' + this.myId, function (err, req, res) {
        if (err) {
            console.log('Problem with request: ' + err);
        }
        this.myId = null;
        this.loadBalancer = null;
        process.exit();
    });
}

Registration.prototype.registerIpc = function (proxyIpcPort, httpPort, ipcPort, callback, params) {
    var jsonObject = {};
    jsonObject.command = 'registerserver';
    jsonObject.connectionInfo = 'http://localhost:' + httpPort;
    jsonObject.ipcport = ipcPort;
    IpcClient(proxyIpcPort, JSON.stringify(jsonObject), callback, params);
}

module.exports = Registration;