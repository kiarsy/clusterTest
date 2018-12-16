
const dgram = require('dgram')
  , socket = dgram.createSocket('udp4');

function server(parent) {
  socket.on('message', proceessServerMessage(socket, parent));

  socket.on('listening', () => {
    socket.addMembership(ssdpMultiastIp);
    const address = socket.address();
    //console.log(`server listening ${address.address}:${address.port}`);
    parent.emit('serverStart', address.address, address.port);
  });

  socket.on('error', (err) => {
    // console.log(`server error:\n${err.stack}`);
    socket.close();
    parent.emit('serverError', err.code, err);
  });

}

server.prototype.start = () => {
  socket.bind(ssdpPort);
};

server.prototype.stop = () => {
  if (socket)
    socket.close();
};

const proceessServerMessage = (socket, parent) => (msg, rinfo) => {
  var json = undefined;

  try {
    json = JSON.parse(msg);
  }
  catch (ex) {
    parent.emit('serverMessageError', msg, ex);
    return;
  }

  var response = {};
  // console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);

  switch (json.action) {
    case 'register':
      if (!lstServices[json.type]) {
        lstServices[json.type] = [];
      }
      lstServices[json.type].push({ ip: rinfo.address, port: rinfo.port, name: json.name });
      response = { action: 'registerReply', code: 200 };
      break;

    case 'find':
      var services = lstServices[json.type];
      response = { action: 'findReply', code: 200, services: services };
      break;

    default:
      return;
  }

  socket.send(JSON.stringify(response), rinfo.port, rinfo.address, function (err, bytes) {
    //console.log(err, bytes);
  });
};

module.exports = exports = server;