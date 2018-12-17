
const dgram = require('dgram')
    , MessageObject = require('./MessageObject');

function ClientComponent(opt) {
    var self = this;

    this.serviceDiscovery = opt.serviceDiscovery;
    this.ssdpPort = opt.ssdpPort;
    this.ssdpMultiastIP = opt.ssdpMultiastIP;

    this.socket = dgram.createSocket('udp4')
    this.socket.on('message', proceessClientMessage(this.socket, opt.serviceDiscovery));
    this.socket.on('error', (err) => {
        self.socket.close();
        opt.serviceDiscovery.emit('clientError', err.code, err);
    });
    this.socket.on('listening', () => {
        const address = self.socket.address();
        opt.serviceDiscovery.emit('clientStart', address.address, address.port);
    });
}

ClientComponent.prototype.start = function () {
    this.socket.bind();
};

ClientComponent.prototype.stop = function () {
    if (this.socket)
        this.socket.close();
};

ClientComponent.prototype.register = function (type, name, cb) {
    var msg = new MessageObject({ type: MessageObject.MessageTypes.Register, payload: { type: type, name: name } });
    this.socket.send(msg.buffer, this.ssdpPort, this.ssdpMultiastIp, function (err, bytes) {
        cb(err, bytes);
    });
};

ClientComponent.prototype.find = function (type, cb) {
    var msg = new MessageObject({ type: MessageObject.MessageTypes.Find, payload: { type: type } });
    this.socket.send(msg.buffer, this.ssdpPort, this.ssdpMultiastIp, function (err, bytes) {
        cb(err, bytes);
    });
};

const proceessClientMessage = (socket, serviceDiscovery) => (buffer, rinfo) => {
    var msg = undefined;
    try {
        msg = new MessageObject({ buffer: buffer });
    }
    catch (ex) {
        serviceDiscovery.emit('clientMessageError', msg, ex);
        return;
    }

    switch (msg.getMessageType()) {
        case MessageObject.MessageTypes.RegisterResponse:
            serviceDiscovery.emit('registerReply', msg.getPayload());
            break;
        case MessageObject.MessageTypes.FindResponse:
            serviceDiscovery.emit('findReply', msg.getPayload());
            break;
    }
};

module.exports = exports = ClientComponent;