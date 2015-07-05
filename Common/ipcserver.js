var net = require('net');

function IpcServer(cache, ipcPort) {
    var ipcserver = net.createServer(function (c) {
        c.on('end', function () {
            console.log('client disconnected');
        });
        c.on('data', function (data) {
            var buf = new Buffer(256);
            var len = buf.write(data.toString());
            var k = buf.toString('utf8', 0, len);
            var obj = JSON.parse(k);
            if (obj.command === 'list') {
                var v = [];
                for (var k in cache.Objectes) {
                    v.push({ key: k, value: cache.Objectes[k] });
                }
                var s = JSON.stringify(v);
                c.write(s);
                c.pipe(c);
            }
        });
    });
    ipcserver.listen(ipcPort, function () {
        console.log('server bound on port: %s', ipcPort);
    });
}

module.exports = IpcServer;

