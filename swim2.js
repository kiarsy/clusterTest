

const SWIM = require('./SWIM/swim'),
    Socket = require('./SWIM/SocketComponent');


var x2 = new SWIM({
    local: {
        ip: '127.0.0.1',
        port: 1235
    },
    ping: {
        interval: 1000
    }
});

setTimeout(() => {
    var bootstraptServices = ['127.0.0.1:1234', '127.0.0.1:1230'];
    x2.bootstrapt(bootstraptServices);
}, 400);
