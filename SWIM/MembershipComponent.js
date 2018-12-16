
const MemberObject = require('./MemberObject')
    , MessageObject = require('./MessageObject');


function MembershipComponent(opt) {
    this.swim = opt.swim;
    this.local = opt.local;
    this.currentService = new MemberObject({
        address: opt.local,
        swim: this
    });
    this.suspect = {
        timeout: opt.suspect.timeout
    };
    this.services = Object.create(null);
    this.pingIndex = 0;

    this.suspects = Object.create(null);
}

MembershipComponent.prototype.onSync = function (data) {
    console.log('Membership.onSync:', data);
    var newMember = new MemberObject(data, this.swim)
    this.services[newMember.socketAddress] = newMember

    //updateMessage
    var updateMessage = new MessageObject();
    updateMessage.setMessageType(MessageObject.MessageTypes.Update);
    updateMessage.setMessagePayload(this.currentService.data());

    this.swim.socket.sendMessage(updateMessage, newMember);
}

MembershipComponent.prototype.onUpdate = function (data) {
    console.log('Membership.onUpdate:', data);
    var updateMember = new MemberObject(data, this.swim);

    if (!this.services[updateMember.socketAddress])
        this.services[updateMember.socketAddress] = updateMember;

    this.services[updateMember.socketAddress].state = updateMember.state;

    if (updateMember.state == MemberObject.States.Suspect) {
        this.suspects[updateMember.socketAddress] = setTimeout(() => {
            console.log('suspect timeout');
            this.services[updateMember.socketAddress].state = MemberObject.States.Faulty;
        }, this.suspect.timeout);
    }
    else if (updateMember.state == MemberObject.States.Alive) {
        clearTimeout(this.suspects[updateMember.socketAddress]);
    }
}

MembershipComponent.prototype.sync = function (hosts) {
    if (!hosts)
        return;

    var self = this;

    //syncMessage
    var syncMessage = new MessageObject();
    syncMessage.setMessageType(MessageObject.MessageTypes.Sync);
    syncMessage.setMessagePayload(this.currentService.data());

    hosts.forEach((host) => {
        var hostMember = new MemberObject({
            address: {
                ip: host.split(':')[0],
                port: host.split(':')[1]
            },
            swim: self.swim
        });
        self.swim.socket.sendMessage(syncMessage, hostMember);
    });
}

MembershipComponent.prototype.next = function () {
    var lst = Object.keys(this.services).filter((key) => {
        return this.services[key].state == 0;
    });

    if (this.pingIndex >= Object.keys(lst).length) {
        shuffle();
        this.pingIndex = 0;
        return undefined;
    }

    var nextService = this.services[lst[this.pingIndex]];

    this.pingIndex++;

    console.log('ping candidate:', nextService.socketAddress);
    if (nextService)
        return nextService;

    return undefined;
}

MembershipComponent.prototype.random = function (except, sender) {
    var lst = Object.keys(this.services).filter((key) => {
        return this.services[key].state == 0 && key != except.socketAddress && (!sender || key != sender.socketAddress);
    });

    var rnd = Math.floor(Math.random() * lst.length) + 0;

    var nextService = this.services[lst[rnd]];


    if (nextService)
        return nextService;

    return undefined;

}

function shuffle() {
    //TODO:Shuffle this.services
}

//Get Ping obj
////Shuffle

//get pingReq objs

MembershipComponent.Events = {

};

module.exports = MembershipComponent; 