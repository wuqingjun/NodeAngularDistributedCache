
var net = require('net');
var client = net.connect({ port: 8124 },
    function () { //'connect' listener
    console.log('connected to server ascii!');
    client.write('k1', 'ascii'); // ucs2, utf16le
});
client.on('data', function (data) {
    console.log(data.toString());
    client.end();
});
client.on('end', function () {
    console.log('disconnected from server');
});