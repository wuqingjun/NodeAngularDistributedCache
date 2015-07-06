var net = require('net');

function IpcClient(serverIpcPort, jsonMessage, callback, params) { //'{"command": "list"}'
    console.log('client is connecting to server port: ' + serverIpcPort);
    var client = net.connect({ port: serverIpcPort },
            function () {
        console.log('connected to server!');
        client.write(jsonMessage, 'utf8');
    });
    client.on('data', function (d) {
        var s = d.toString();
        var v = JSON.parse(s);
        if (v.command === 'listreturn') {
            params.items = v.items;
            console.log('list return');
            console.log(v.items);
            callback(params);    
        }
    });
    client.on('end', function () {
        console.log('disconnected from server');
    });
}

module.exports = IpcClient;
