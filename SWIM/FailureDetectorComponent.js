
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
    this.pingReqCount = Object.create(null);
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
    this.pingReqCount[updateMember.socketAddress] = 0;


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

    //check state of member
    // if (this.pingReqCount[member.socketAddress] > 0) {

    // }
    //Ping
    var pingMessage = new MessageObject();
    pingMessage.setMessageType(MessageObject.MessageTypes.Ping);
    pingMessage.setMessagePayload(seq.toString());
    this.swim.socket.sendMessage(pingMessage, member);

    clearTimeout(this.pingTimeout[member.socketAddress]);
    this.pingTimeout[member.socketAddress] = setTimeout(() => {
        //pingRequest
        console.log('Ping > failed' + seq);

        var random = self.swim.membership.random(member, sender);
        self.pingReqMember.call(self, random, member);

    }, self.ping.timeout);
}

FailureDetector.prototype.pingReqMember = function (random, member) {
    var self = this;
    console.log('pingReq', member.socketAddress, 'through', random && random.socketAddress, this.pingReq.timeout, this.pingReq);
    // console.log(this);
    //PingReq Timeout
    clearTimeout(this.pingReqTimeout[member.socketAddress]);
    this.pingReqTimeout[member.socketAddress] = setTimeout(() => {
        console.log('pingReq>retry');
        self.pingReqMember(random, member);
    }, this.pingReq.timeout);

    if (!random) {
        console.log('pingReq>no memeber to  pingReq');
        return;
    }
    //check pingReq maximum
    if (!this.pingReqCount[member.socketAddress])
        this.pingReqCount[member.socketAddress] = 0;

    this.pingReqCount[member.socketAddress]++;

    if (this.pingReqCount[member.socketAddress] > this.pingReq.count) {
        //Failed
        console.log('pingReq > failed');
        clearTimeout(this.pingReqTimeout[member.socketAddress]);
        this.pingReqCount[member.socketAddress] = 0;
        member.state = MemberObject.States.Suspect;
        self.swim.membership.onUpdate(member.data());
        return;
    }

    //Send PingReq
    var pingReqMessage = new MessageObject();
    pingReqMessage.setMessageType(MessageObject.MessageTypes.PingReq);
    pingReqMessage.setMessagePayload(member.data());
    this.swim.socket.sendMessage(pingReqMessage, random);


}

FailureDetector.prototype.pingMemberFor = function (sender, member) {
    this.pingFor[member.socketAddress] = sender;
    this.pingMember(member, sender);
}

module.exports = FailureDetector; 