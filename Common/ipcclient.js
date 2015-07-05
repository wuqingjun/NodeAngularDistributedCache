var net = require('net');

function IpcClient(serverIpcPort, data, res, jsonMessage) { //'{"command": "list"}'
    var client = net.connect({ port: serverIpcPort },
            function () {
        console.log('connected to server!');
        client.write(jsonMessage, 'utf8');
    });
    client.on('data', function (d) {
        var s = d.toString();
        var v = JSON.parse(s);
        data = data.concat(v);
        console.log(v);
        res.json(data);
    });
    client.on('end', function () {
        console.log('disconnected from server');
    });
}

module.exports = IpcClient;
