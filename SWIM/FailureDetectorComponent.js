
const MemberObject = require('./MemberObject')
    , MessageObject = require('./MessageObject');


function FailureDetector(opt) {
    this.swim = opt.swim;

    this.currentService = opt.currentService;

    this.ping = {
        timeout: opt.ping.timeout,
        interval: opt.ping.interval
    };
    this.pingReq = {
        count: opt.pingReq.count,
        timeout: opt.pingReq.timeout
    };

    this.interval = undefined;
    this.pingTimeout = Object.create(null);
    this.pingReqTimeout = Object.create(null);
    this.pingFor = Object.create(null);
    this.seq = 0;
}

FailureDetector.prototype.start = function () {
    var self = this;
    console.log('FailureDetector start with interval ', this.ping.interval);

    this.interval = setInterval(() => {
        //send Ping
        var objNext = self.swim.membership.next();
        if (objNext) {
            self.pingMember(objNext);
        }
    }, this.ping.interval);
}

FailureDetector.prototype.stop = function () {
    clearInterval(this.interval);
}

FailureDetector.prototype.onUpdate = function (data) {
    console.log('FailureDetector.onUpdate:', data);
    var updateMember = new MemberObject(data, this.swim);
    //clear timeouts
    clearTimeout(this.pingTimeout[updateMember.socketAddress]);
    clearTimeout(this.pingReqTimeout[updateMember.socketAddress]);


    if (this.pingFor[updateMember.socketAddress]) {
        this.swim.socket.emit('onPing', this.pingFor[updateMember.socketAddress].address);
    }
}

FailureDetector.prototype.pingMember = function (member, sender) {
    if (!member) {
        console.log('ping>no memeber to ping');
    }

    var self = this;
    var seq = self.seq;
    self.seq++;
    console.log('Ping ', member.socketAddress, seq, self.ping.timeout);

    //Ping
    var pingMessage = new MessageObject();
    pingMessage.setMessageType(MessageObject.MessageTypes.Ping);
    pingMessage.setMessagePayload(seq.toString());
    this.swim.socket.sendMessage(pingMessage, member);

    if (this.pingFor[member.socketAddress] && this.pingFor[member.socketAddress] == sender) {
        //No neet to pingreq on pingReg request from others
        //to reduce network bandweed
        //also it is sender duty to speard pingReq on multiple nodes
        //
        //NeedToThink: suspect for pingreq can handle through piggyback  later from sender
        //             OR it can handle here immediately
        return;
    }

    clearTimeout(this.pingTimeout[member.socketAddress]);
    this.pingTimeout[member.socketAddress] = setTimeout(() => {
        //pingRequest
        console.log('Ping > failed' + seq);

        var randoms = self.swim.membership.random(member, sender, self.pingReq.count);
        self.pingReqMember.call(self, randoms, member);

    }, self.ping.timeout);
}

FailureDetector.prototype.pingReqMember = function (randoms, member) {
    var self = this;
    console.log('pingReq', member.socketAddress, 'through', randoms);
    // console.log(this);
    //PingReq Timeout

    // if (!random) {
    //     console.log('pingReq>no memeber to  pingReq');
    //     return;
    // }

    if (randoms) {
        randoms.forEach(itm => {
            var pingReqMessage = new MessageObject();
            pingReqMessage.setMessageType(MessageObject.MessageTypes.PingReq);
            pingReqMessage.setMessagePayload(member.data());
            self.swim.socket.sendMessage(pingReqMessage, itm);
        });

    }

    clearTimeout(this.pingReqTimeout[member.socketAddress]);
    this.pingReqTimeout[member.socketAddress] = setTimeout(() => {
        console.log('pingReq>Timeout');
        member.state = MemberObject.States.Suspect;
        self.swim.membership.onUpdate(member.data());
    }, this.pingReq.timeout);
}

FailureDetector.prototype.pingMemberFor = function (sender, member) {
    this.pingFor[member.socketAddress] = sender;
    this.pingMember(member, sender);
}

module.exports = FailureDetector; 