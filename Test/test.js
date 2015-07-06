var net = require("net");

var client = net.connect({ port: 8083 },
    function () {
    console.log('connected to server ascii!');
    
});
client.on('data', function (data) {
    v = data.toString();
    console.log(v);
    client.end();
});
client.on('end', function () {
    console.log('disconnected from server');
});

client.on('error', function(data) {
    console.log(data);
});

client.write('{ "command": "registerserver"}', 'utf8');

client.on('data', function (data) {
    console.log(data);
});

