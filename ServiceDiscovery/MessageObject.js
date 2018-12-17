
function MessageObject({ buffer, type, payload }) {
    if (buffer)
        this.buffer = buffer;
    if (type)
        this.setMessageType(type);
    if (payload)
        this.setMessagePayload(payload);
}


MessageObject.prototype.getMessageType = function () {
    return this.buffer.readUInt8(0);
};

MessageObject.prototype.getPayload = function () {
    return this.decode(this.buffer.slice(MessageObject.MessageTypeSize));
};

MessageObject.prototype.getLength = function () {
    return this.buffer.length;
};

MessageObject.prototype.setMessageType = function (type) {
    if (!this.buffer) {
        this.buffer = new Buffer(MessageObject.MessageTypeSize);
    }
    this.buffer.writeUInt8(type, 0);
}

MessageObject.prototype.setMessagePayload = function (payload) {
    if (!this.buffer) {
        this.buffer = new Buffer(MessageObject.MessageTypeSize);
    }
    this.buffer = Buffer.concat([this.buffer, this.encode(payload)]);
}

MessageObject.prototype.encode = function (msg) {
    if (!msg)
        return undefined;
    var strMsg = msg;

    if (msg.constructor != String) {
        strMsg = JSON.stringify(msg);
    }
    return new Buffer(strMsg);
}

MessageObject.prototype.decode = function (buffer) {
    var str = buffer.toString();
    try {
        str = JSON.parse(str);
    }
    catch (ex) { }
    return str;
}

MessageObject.MessageTypeSize = 1;
MessageObject.MessageTypes = {
    Register: 1,
    Find: 2,
    RegisterResponse: 3,
    FindResponse: 4,
}

module.exports = MessageObject;