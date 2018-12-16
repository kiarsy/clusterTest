
lstServices = []
    , lstDepend = []
    , ssdpPort = 1900
    , ssdpMultiastIp = '239.255.255.250'

const util = require('util')
    , Server = require('./server')
    , Client = require('./client')
    , EventEmitter = require('events');

var server = undefined,
    client = undefined;

function ServiceDiscovery() {
    server = new Server(this);
    client = new Client(this);
}
util.inherits(ServiceDiscovery, EventEmitter);

//SOCKETS
ServiceDiscovery.prototype.start = () => {
    client.start();
    server.start();
};

ServiceDiscovery.prototype.stop = () => {
    client.stop();
    server.stop();
};

//CLIENT
ServiceDiscovery.prototype.register = (type, name, cb) => {
    client.register(type, name, cb);
};

ServiceDiscovery.prototype.find = (type, cb) => {
    client.find(type, cb);
};

module.exports = ServiceDiscovery;

