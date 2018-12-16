
const dgram = require('dgram')
    , socket = dgram.createSocket('udp4');

function client(parent) {
    socket.on('message', proceessClientMessage(socket, parent));

    socket.on('error', (err) => {
        //console.log(`client error:\n${err.stack}`);
        socket.close();
        parent.emit('clientError', err.code, err);
    });

    socket.on('listening', () => {
        const address = socket.address();
        //console.log(`client listening ${address.address}:${address.port}`);
        parent.emit('clientStart', address.address, address.port);
    });
}

client.prototype.start = () => {
    socket.bind();
};

client.prototype.stop = () => {
    if (socket)
        socket.close();
};

client.prototype.register = (type, name, cb) => {
    socket.send(JSON.stringify({ action: 'register', type: type, name: name }), ssdpPort, ssdpMultiastIp, function (err, bytes) {
        cb(err, bytes);
    });
};

client.prototype.find = (type, cb) => {
    socket.send(JSON.stringify({ action: 'find', type: type }), ssdpPort, ssdpMultiastIp, function (err, bytes) {
        cb(err, bytes);
    });
};

const proceessClientMessage = (socket, parent) => (msg, rinfo) => {
    var json = JSON.parse(msg);
    // console.log(`client got: ${json.action} from ${rinfo.address}:${rinfo.port}`);
    switch (json.action) {
        case 'registerReply':
            parent.emit('registerReply', json);
            break;
        case 'findReply':
            parent.emit('findReply', json);
            break;
    }
};

module.exports = exports = client;