const Peer = require('simple-peer');

class SimplePeerClientWrapper {
  constructor(socket, debug, simplePeerOptions) {
    this.initPeerRequest = false;
    this.socket = socket;
    this.localStream;
    this.debug = debug;
    this.connections = [];
    this.onConnectCallback;
    this.onDataCallback;
    this.onStreamCallback;
    // this.onTrackCallback;
    this.onCloseCallback;
    this.onErrorCallback;
    this.simplePeerOptions;

    if (typeof simplePeerOptions !== 'undefined') {
      this.simplePeerOptions = simplePeerOptions;
    }
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

    const options = this._getPeerOptions(connection.initiator);
    const peer = new Peer(options);

    // If initiator,peer.on'signal' will fire right away, if not it waits for signal
    // https://github.com/feross/simple-peer#peeronsignal-data--
    peer.on('signal', (data) => this._sendSignal(data, connection));
    peer.on('connect', () => this._handleConnection());
    peer.on('error', (err) => this._handleError(err));
    peer.on('stream', (stream) => this._handleStream(stream));
    peer.on('data', (data) => this._handleData(data));
    // peer.on('track', (track, stream) =>
    //   this._handleTrack(track, stream),
    // );
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
    switch (event) {
      case 'connect':
        this.onConnectCallback = callback;
        break;
      case 'data':
        this.onDataCallback = callback;
        break;
      case 'stream':
        this.onStreamCallback = callback;
        break;
      // case 'track':
      //   this.onTrackCallback = callback;
      //   break;
      case 'close':
        this.onCloseCallback = callback;
        break;
      case 'error':
        this.onErrorCallback = callback;
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

  terminateSession() {
    for (let i = 0; i < this.connections.length; i++) {
      const peer = this.connections[i].peer;
      peer.destroy(); // simple-peer method to close and cleanup peer connection
      this.connections[i].peer = null;
      this.connections[i].peerStarted = false;
    }

    this.socket.emit('hangup');
    this.socket.close();
  }

  _getPeerOptions(initiator) {
    const options = {
      initiator: initiator,
    };

    if (typeof this.localStream !== 'undefined') {
      options.stream = this.localStream;
    }

    if (typeof this.simplePeerOptions !== 'undefined') {
      const spOptions = Object.entries(this.simplePeerOptions);

      if (spOptions.length > 0) {
        for (const [key, value] of spOptions) {
          options[key] = value;
        }
      }
    }
    return options;
  }

  _sendSignal(data, connection) {
    this.debug && console.log('sending signal');

    const message = {
      room: connection.room,
      data: JSON.stringify(data),
    };

    this.socket.emit('sending signal', message);
  }

  _handleConnection() {
    this.debug && console.log('SIMPLE PEER IS CONNECTED');
    if (this.onConnectCallback) this.onConnectCallback();
  }

  _handleStream(stream) {
    this.onStreamCallback(stream);
  }

  _handleError(err) {
    if (typeof this.onErrorCallback !== 'undefined') {
      this.onErrorCallback(err);
    } else {
      console.log(err);
    }
  }

  _handleData(data) {
    const decodedString = new TextDecoder('utf-8').decode(data);
    const decodedJSON = JSON.parse(decodedString);
    this.onDataCallback(decodedJSON);
  }

  _handleClose() {
    if (typeof this.onCloseCallback !== 'undefined') {
      this.onCloseCallback();
    }

    this.debug && console.log('Closing Connection');
  }

  _handleRemoteHangup() {
    this.debug && console.log('Handling remote hangup');
    this.terminateSession(true);
  }

  _closePeerConnection() {
    // peerStarted = false;
    // peer.destroy();
    // peer = null;
  }
}

module.exports = SimplePeerClientWrapper;
