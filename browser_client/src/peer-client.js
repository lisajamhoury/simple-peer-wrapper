const Peer = require('simple-peer');

class SimplePeerClientWrapper {
  constructor(socket, debug) {
    this.initPeerRequest = false;
    this.socket = socket;
    this.localStream;
    this.incomingStream;
    this.newData = null;
    this.debug = debug;
    this.connections = [];
    this.onDataCallback;
  }

  setlocalStream(stream) {
    this.localStream = stream;
  }

  init() {
    this.debug &&
      console.log(
        'running init Peer Client. # of ' + this.connections.length,
      );
    this.initPeerRequest = true;

    for (let i = 0; i < this.connections.length; i++) {
      this.socket.emit('initiate peer', this.connections[i].room);
      if (this.connections[i].initiator) {
        this.attemptPeerStart(this.connections[i]);
      }
    }
  }

  attemptPeerStart(connection) {
    this.debug &&
      console.log(
        'Attempting peer start',
        connection.peerStarted,
        connection.roomReady,
      );

    if (!connection.peerStarted && connection.roomReady) {
      this.debug && console.log('Creating peer connection');
      this.createPeerConnection(connection);
    } else {
      this.debug && console.log('Not creating peer connection');
    }
  }

  createPeerConnection(connection) {
    this.debug && console.log('creating simple peer');
    let peer;

    if (typeof this.localStream === 'undefined') {
      peer = new Peer({
        initiator: connection.initiator,
      });
    } else {
      peer = new Peer({
        initiator: connection.initiator,
        stream: this.localStream,
      });
    }

    // If initiator,peer.on'signal' will fire right away, if not it waits for signal
    // https://github.com/feross/simple-peer#peeronsignal-data--
    peer.on('signal', (data) => this._sendSignal(data, connection));
    peer.on('connect', (data) => this._handleConnection(data));
    peer.on('error', (err) => this._handleError(err));
    peer.on('stream', (stream) => this._handleStream(stream));
    peer.on('data', (data) => this._handleData(data));
    peer.on('close', () => this._handleClose());

    connection.peerStarted = true;
    connection.peer = peer;
  }

  isPeerStarted() {
    let peerStarted = false;

    // if any peer connection is not started then it returns false
    for (let i = 0; i < this.connections.length; i++) {
      peerStarted = this.connections[i].peerStarted;
    }
    return peerStarted;
  }

  setEventCallback(event, callback) {
    if (event === 'data') {
      this.onDataCallback = callback;
    }
  }

  sendData(data) {
    let msg = JSON.stringify({ data: data, userId: this.socket.id });
    for (let i = 0; i < this.connections.length; i++) {
      const peer = this.connections[i];
      if (peer.peerStarted) {
        const peerConn = peer.peer;
        if (peerConn.connected) {
          peerConn.write(msg);
        }
      }
    }
  }

  getData() {
    if (this.newData !== null) {
      return this.newData;
    } else {
      return null;
    }
  }

  getStream() {
    if (this.incomingStream !== null) {
      return this.incomingStream;
    } else {
      return null;
    }
  }

  //   // TO DO: Where should this be?
  //   window.onbeforeunload = () => {
  //     terminateSession();
  //   };

  // TO DO: Can this be erased ?
  // isInitiator() {
  //     return this.initiator;
  // }

  _sendSignal(data, connection) {
    this.debug && console.log('sending signal');

    const message = {
      room: connection.room,
      data: JSON.stringify(data),
    };

    this.socket.emit('sending signal', message);
  }

  _handleConnection(data) {
    console.log('SIMPLE PEER IS CONNECTED');
  }

  _handleStream(stream) {
    console.log('handling stream');
    this.incomingStream = stream;
  }

  _handleError(err) {
    this.debug && console.log(err);
  }

  _handleData(data) {
    const decodedString = new TextDecoder('utf-8').decode(data);
    const decodedJSON = JSON.parse(decodedString);
    // this.newData = decodedJSON;
    this.onDataCallback(decodedJSON);
  }

  _terminateSession() {
    for (let i = 0; i < this.connections.length; i++) {
      const peer = this.connections[i].peer;
      peer.destroy(); // simple-peer method to close and cleanup peer connection
      this.connections[i].peer = null;
      this.connections[i].peerStarted = false;
    }

    // TO DO destroy socket and associated rooms
    this.socket.emit('hangup');
    this.socket.close();

    // emitSocketMessage('hangup');
  }

  _handleClose() {
    this.debug && console.log('GOT CLOSE');
    // closePeerConnection();
    // emitSocketMessage('bye');
  }

  _handleRemoteHangup() {
    // log('Session terminated.');
    // closePeerConnection();
    // initiator = false;
  }

  _closePeerConnection() {
    // peerStarted = false;
    // peer.destroy();
    // peer = null;
  }
}

module.exports = SimplePeerClientWrapper;
