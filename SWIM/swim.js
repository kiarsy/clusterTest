const util = require('util')
    , EventEmitter = require('events')
    , MembershipComponent = require('./MembershipComponent')
    , MemberObject = require('./MemberObject')
    , MessageObject = require('./MessageObject')
    , SocketComponent = require('./SocketComponent')
    , FailureDetectorComponent = require('./FailureDetectorComponent');

function Swim(options) {
    var self = this;
    this.local = options.local;

    this.membership = new MembershipComponent({
        swim: this,
        local: this.local,
        suspect: {
            timeout: options.suspect && (options.suspect.timeout || Swim.Defaults.suspect.timeout)
        }
    });

    this.socket = new SocketComponent({
        address: options.local,
        currentService: this.membership.currentService,
        swim: this
    });

    this.faillureDetector = new FailureDetectorComponent({
        address: options.local,
        swim: this,
        currentService: this.membership.currentService,
        ping: {
            timeout: ((options.ping && options.ping.timeout) || Swim.Defaults.ping.timeout),
            interval: ((options.ping && options.ping.interval) || Swim.Defaults.ping.interval),
        },
        pingReq: {
            count: ((options.pingReq && options.pingReq.count) || Swim.Defaults.pingReq.count),
            timeout: ((options.pingReq && options.pingReq.timeout) || Swim.Defaults.pingReq.timeout),
        }
    });

    //Wireup
    this.socket.on('Sync', this.membership.onSync.bind(this.membership));
    this.socket.on('Update', this.membership.onUpdate.bind(this.membership));
    this.socket.on('Update', this.faillureDetector.onUpdate.bind(this.faillureDetector));
    this.socket.on('PingMemberFor', this.faillureDetector.pingMemberFor.bind(this.faillureDetector));
}

util.inherits(Swim, EventEmitter);

Swim.prototype.bootstrapt = function (bootstrapts) {
    var self = this;
    this.socket.listen(function () {

        //sync other hosts
        if (bootstrapts)
            self.membership.sync(bootstrapts);

        //Start Failure Detector
        self.faillureDetector.start();
    });
}


Swim.prototype.sendTeest = function (msgObj, memberObj) {
    this.socket.sendMessage(msgObj, memberObj);
}


Swim.Defaults = {
    local: {
        // port: 1100,
        // ip:'127.0.0.1'
    },
    ping: {
        timeout: 1000,
        interval: 10000
    },
    pingReq: {
        count: 2,
        timeout: 1000,
    },
    suspect: {
        timeout: 10000
    }
}

module.exports = Swim;