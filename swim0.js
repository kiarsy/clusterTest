const SWIM = require('./SWIM/swim'),
    Socket = require('./SWIM/SocketComponent');

var x1 = new SWIM({
    local: {
        ip: '127.0.0.1',
        port: 1230
    },
    ping: {
        interval: 30000
    }
});

x1.bootstrapt();
