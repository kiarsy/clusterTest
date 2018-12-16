const SSDP = require('./ServiceDiscovery/serviceDiscovery');
const ssdp = new SSDP();

ssdp.start();

ssdp.register('SMS', 'Srv1.Sms.1', function (a, b) {
    console.log('register:', a, b);
});

ssdp.register('SMS', 'Srv1.Sms.2', function (a, b) {
    console.log('register2:', a, b);
});

ssdp.find('SMS', function (a, b) {
    console.log('find:', a, b);
});

ssdp.on('registerReply', function (a) {
    console.log('registerReply:', a);
});

ssdp.on('findReply', function (a) {
    console.log('findReply:', a);
});

ssdp.on('serverMessageError', function (msg, err) {
    //console.log('serverMessageError:', msg, err);
});

ssdp.on('serverError', function (code, err) {
    console.log('serverError:', code, err);
});