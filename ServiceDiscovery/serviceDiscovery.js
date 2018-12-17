const util = require('util')
    , Server = require('./ServerComponent')
    , Client = require('./ClientComponent')
    , EventEmitter = require('events');

function ServiceDiscovery(opt) {
    this.ssdpPort = (opt && opt.ssdpPort) || ServiceDiscovery.Defaults.ssdpPort;
    this.ssdpMultiastIP = (opt && opt.ssdpMultiastIP) || ServiceDiscovery.Defaults.ssdpMultiastIP;

    this.server = new Server({ serviceDiscovery: this, ssdpPort: this.ssdpPort, ssdpMultiastIP: this.ssdpMultiastIP });
    this.client = new Client({ serviceDiscovery: this, ssdpPort: this.ssdpPort, ssdpMultiastIP: this.ssdpMultiastIP });
}
util.inherits(ServiceDiscovery, EventEmitter);

//SOCKETS
ServiceDiscovery.prototype.start = function () {
    this.client.start();
    this.server.start();
};

ServiceDiscovery.prototype.stop = function () {
    this.client.stop();
    this.server.stop();
};

//CLIENT
ServiceDiscovery.prototype.register = function (type, name, cb) {
    this.client.register(type, name, cb);
};

ServiceDiscovery.prototype.find = function (type, cb) {
    this.client.find(type, cb);
};

ServiceDiscovery.Defaults = {
    ssdpPort: 1900,
    ssdpMultiastIP: '239.255.255.250'
}
module.exports = ServiceDiscovery;

