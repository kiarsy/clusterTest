
const dgram = require('dgram')
  , MessageObject = require('./MessageObject');


function ServerComponent(opt) {

  this.lstServices = [];

  this.serviceDiscovery = opt.serviceDiscovery;
  this.ssdpPort = opt.ssdpPort;
  this.ssdpMultiastIP = opt.ssdpMultiastIP;

  this.socket = dgram.createSocket('udp4');
  this.socket.on('message', proceessServerMessage(this, this.socket, opt.serviceDiscovery).bind(this));
  this.socket.on('listening', listening(this, this.socket, opt.serviceDiscovery).bind(this));
  this.socket.on('error', opt.serviceDiscovery.emit.bind(this, 'serverError'));
}

ServerComponent.prototype.start = function () {
  this.socket.bind(this.ssdpPort);
};

ServerComponent.prototype.stop = function () {
  if (this.socket)
    this.socket.close();
};

const listening = (self, socket, serviceDiscovery) => () => {

  socket.addMembership(self.ssdpMultiastIP);
  const address = socket.address();
  //console.log(`server listening ${address.address}:${address.port}`);
  serviceDiscovery.emit('serverStart', address.address, address.port);
}

const proceessServerMessage = (self, socket, serviceDiscovery) => (buffer, rinfo) => {
  var msg = undefined;

  try {
    msg = new MessageObject({ buffer: buffer });
  }
  catch (ex) {
    serviceDiscovery.emit('serverMessageError', msg, ex);
    return;
  }

  var payload = msg.getPayload();
  var response = undefined;

  switch (msg.getMessageType()) {
    case MessageObject.MessageTypes.Register:
      if (!self.lstServices[payload.type]) {
        self.lstServices[payload.type] = [];
      }
      self.lstServices[payload.type].push({ ip: rinfo.address, port: rinfo.port, name: payload.name });
      response = new MessageObject({ type: MessageObject.MessageTypes.RegisterResponse, payload: { code: 200 } });
      break;

    case MessageObject.MessageTypes.Find:
      var services = self.lstServices[payload.type];
      response = new MessageObject({ type: MessageObject.MessageTypes.FindResponse, payload: { code: 200, services: services } });
      break;
    default:
      return;
  }

  if (response)
    socket.send(response.buffer, rinfo.port, rinfo.address, function (err, bytes) {
      //console.log(err, bytes);
    });
};

module.exports = exports = ServerComponent;