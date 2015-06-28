var net = require("net");
var client = net.connect({ port: 8124 },
    function () {
    console.log('connected to server ascii!');
    client.write('k1', 'ascii');
});
client.on('data', function (data) {
    v = data.toString();
    console.log(v);
    client.end();
});
client.on('end', function () {
    console.log('disconnected from server');
});