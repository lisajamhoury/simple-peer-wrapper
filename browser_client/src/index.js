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

  on(event, callback) {
    this.peerClient.setEventCallback(event, callback);
  }

  // TODO: Use events instead!!! on.('data')
  getData() {
    return this.peerClient.getData();
  }

  // TODO: Use events instead!!! on.('stream')
  getStream() {
    return this.peerClient.getStream();
  }
}

module.exports = Signal;
