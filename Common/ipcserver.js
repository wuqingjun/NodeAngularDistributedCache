var net = require('net');

function IpcServer(cache, ipcPort, callback, params) {
    callback = callback || function() {}
    var ipcserver = net.createServer(function (c) {
        c.on('end', function () {
            console.log('client disconnected');
        });
        c.on('connection', function(data) {
            console.log('connected!');
        })
        c.on('data', function (data) {
            var buf = new Buffer(256);
            var len = buf.write(data.toString());
            var msg = buf.toString('utf8', 0, len);
            var obj = JSON.parse(msg);
            if (obj.command === 'list') {
                var ret = {};
                ret.command = 'listreturn';
                ret.status = 'ok';
                var v = [];
                for (var k in cache.Objectes) {
                    v.push({ key: k, value: cache.Objectes[k] });
                }
                ret.items = v;
                c.write(JSON.stringify(ret));
                c.pipe(c);
            }
            else if (obj.command === 'registerserver') {
                var ret = {};
                ret.command = 'registerserverreturn';
                ret.status = 'ok';
                c.write(JSON.stringify(ret));
                c.pipe(c);
                params.connectionInfo = obj.connectionInfo;
                params.ipcport = obj.ipcport;
            }
            callback(params);
        });
    });
    ipcserver.listen(ipcPort, function () {
        console.log('server bound on port: %s', ipcPort);
    });
}

module.exports = IpcServer;