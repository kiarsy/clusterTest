
const dgram = require('dgram')
    , EventEmitter = require('events')
    , util = require('util')
    , MessageObject = require('./MessageObject')
    , MemberObject = require('./MemberObject');

function SocketComponent(opt) {
    this.address = opt.address;
    this.swim = opt.swim;
    this.socket = dgram.createSocket(SocketComponent.Default.udp.type);

    this.currentService = opt.currentService || undefined;
    this.udp = {};
    this.udp.type = opt && opt.udp && opt.udp.type || SocketComponent.Default.udp.type;
    this.udp.maxDgramSize = opt && opt.udp && opt.udp.maxDgramSize || SocketComponent.Default.udp.maxDgramSize;

    this.pingReq = Object.create(null);

    this.listeningListener = this.emit.bind(this, SocketComponent.Events.Listen);
    this.errorListener = this.emit.bind(this, SocketComponent.Events.Error);
    this.messageListener = this.onMessage(this.socket, this.swim, this).bind(this);

    this.on('onPing', this.onPing.bind(this));

}

util.inherits(SocketComponent, EventEmitter);


SocketComponent.prototype.listen = function (ck) {
    this.socket.on('message', this.messageListener);
    this.socket.on('listening', ck);
    this.socket.on('error', this.errorListener);

    this.socket.bind(this.address.port);
}

SocketComponent.prototype.close = function () {
    this.socket.removeListener('message', this.messageListener);
    this.socket.removeListener('listening', this.listeningListener);
    this.socket.removeListener('error', this.errorListener);

    this.socket.close();
    this.socket = dgram.createSocket(SocketComponent.Default.udp.type);
};

SocketComponent.prototype.onMessage = (socket, swim, self) => (buffer, rinfo) => {
    var msg = new MessageObject(buffer);
    switch (msg.getMessageType()) {
        case MessageObject.MessageTypes.Ping:
            self.onPing(rinfo, msg.getPayload());
            break;
        case MessageObject.MessageTypes.PingReq:
            self.onPingReq(rinfo, msg.getPayload());
            break;
        case MessageObject.MessageTypes.Sync:
            self.emit('Sync', msg.getPayload());
            break;
        case MessageObject.MessageTypes.Update:
            self.emit('Update', msg.getPayload());
            break;
    }
}

SocketComponent.prototype.onPing = function (rinfo, seq) {
    console.log('onPing:', rinfo, seq, this.address);
    var updateMessage = new MessageObject();
    updateMessage.setMessageType(MessageObject.MessageTypes.Update);
    updateMessage.setMessagePayload(this.currentService.data());

    var newMember = new MemberObject({ address: rinfo }, this);
    this.swim.socket.sendMessage(updateMessage, newMember);
};

SocketComponent.prototype.onPingReq = function (rinfo, data) {
    console.log('onPingReq:', rinfo);

    var sender = new MemberObject({ address: rinfo });

    // console.log(sender);

    var member = new MemberObject(data);

    this.emit('PingMemberFor', sender, member);
};


SocketComponent.prototype.sendMessage = function (messageObj, memberObj) {
    //Piggyback
    var bytesAvailable = this.udp.maxDgramSize - messageObj.MessageTypeSize - messageObj.size;
    // console.log('bytesAvailable:', bytesAvailable);

    // var buffers = this.swim.disseminator.getUpdatesUpTo(bytesAvailable);

    // if (buffers.length === 0) {
    //     return this.sendBuffer(buffer, memberObj);
    // }

    // buffers.unshift(buffer);
    // console.log('bytesAvailable:', messageObj,messageObj.buffer);

    this.sendBuffer(messageObj.buffer, memberObj);

}

SocketComponent.prototype.sendBuffer = function (buffer, memberObj) {
    if (!memberObj) {
        console.log(memberObj);
    }
    //  console.log('send  to', memberObj.address.port, memberObj.address.ip, buffer);
    this.socket.send(buffer, 0, buffer.length, memberObj.address.port, memberObj.address.ip, function (err, bytes) {
        // console.log(err, bytes);
    });
}

SocketComponent.Events = {
    Error: "Socket_Error",
    Listen: "Socket_Listen"
};

SocketComponent.Default = {
    udp: {
        type: 'udp4',
        maxDgramSize: 512
    }
};
module.exports = SocketComponent;