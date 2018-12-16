function MemberObject(opt, swim) {

    this.address = opt.address || undefined;
    if (this.address.address) {
        this.address.ip = this.address.address;
    }
    this.state = opt.state || MemberObject.States.Alive;
    this.swim = opt && opt.swim || swim;
    this.socketAddress = (this.address) ? (this.address.ip) + ":" + this.address.port : undefined;
}

MemberObject.prototype.data = function () {
    return {
        address: this.address,
        state: this.state,
    }
}


MemberObject.States = {
    Alive: 0,
    Suspect: 1,
    Faulty: 2
}

module.exports = MemberObject;