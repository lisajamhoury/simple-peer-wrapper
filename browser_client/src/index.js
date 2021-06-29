const SocketIOClientWrapper = require('./socket-client.js');

class Signal {
  constructor(options) {
    this.socketClient = new SocketIOClientWrapper(options);
    this.peerClient = this.socketClient.peerClient;
  }

  connect() {
    this.peerClient.init();
  }

  isConnectionStarted() {
    return this.peerClient.isPeerStarted();
  }

  send(data) {
    this.peerClient.sendData(data);
  }

  // TODO: Use events instead!!!
  getData() {
    return this.peerClient.getData();
  }
}

module.exports = Signal;
