const io = require('socket.io-client');
const SimplePeerClientWrapper = require('./peer-client.js');

// const turnRequest = require('./turnRequest');
//     turnRequest();

class SocketIOClientWrapper {
  constructor({
    stream,
    serverUrl = 'http://localhost:8081',
    debug = false,
  } = {}) {
    this.debug = debug;

    this.debug && console.log('connecting socket to ' + serverUrl);
    this.socket = io.connect(serverUrl);
    this.peerClient = new SimplePeerClientWrapper(
      this.socket,
      this.debug,
    );

    if (typeof stream !== 'undefined') {
      this.peerClient.setlocalStream = stream;
    }

    this._initSocket();
  }

  _initSocket() {
    this.socket.on('created', (room) => this._handleCreated(room));
    this.socket.on('full', (room) => this._handleFullRoom(room));
    this.socket.on('join', (room) => this._handleJoinRoom(room));
    this.socket.on('joined', (room) => this._handleJoinedRoom(room));
    this.socket.on('initiate peer', (room) =>
      this._handleInitPeer(room),
    );
    this.socket.on('sending signal', (message) =>
      this._handleSendSignal(message),
    );
    this.socket.on('log', (array) => this._handleLog(array));
    this.socket.on('message', (message) =>
      this._handleMessage(message),
    );

    this._startSocketCommunication();
  }

  // starts socket client communication with signal server automatically
  _startSocketCommunication() {
    this.socket.emit('create or join');
    this.debug && console.log('Attempted to create or join room');
  }

  _handleCreated(room) {
    this.debug && console.log('Created room ' + room);
  }

  // room only holds two clients, can be changed in signal_socket.js
  _handleFullRoom(room) {
    this.debug && console.log('Room ' + room + ' is full');
  }

  // called by initiator client only
  _handleJoinRoom(room) {
    this.debug &&
      console.log('Another peer made a request to join room ' + room);
    this.debug &&
      console.log('This peer is the initiator of room ' + room + '!');

    this._logConnection(room, true, true, false);
    if (this.peerClient.initPeerRequest) {
      this.debug && console.log('initing peer from handle join');
      this.peerClient.init();
    }
  }

  // called by non-initiator client
  _handleJoinedRoom(room) {
    this.debug && console.log('joined: ' + room);

    this._logConnection(room, false, true, false);
    if (this.peerClient.initPeerRequest) {
      this.debug && console.log('initing peer from handle joined');
      this.peerClient.init();
    }
  }

  _logConnection(_room, _initiator, _roomReady, _peerStarted) {
    this.debug && console.log('logging connection');
    const newConnection = {
      room: _room, // socket.io server room
      initiator: _initiator, // client initiates the communication
      roomReady: _roomReady, // socket.io room is created or joined
      peerStarted: _peerStarted, // the peer connection is started
    };

    this.peerClient.connections.push(newConnection);
  }

  // logs messages from server
  _handleLog(array) {
    log.apply(console, array);
  }

  _handleInitPeer(room) {
    const connection = this._findConnection(room);
    this.peerClient.attemptPeerStart(connection);
  }

  _handleSendSignal(message) {
    this.debug && console.log('receiving simple signal data');
    const connection = this._findConnection(message.room);

    if (!connection.peerStarted) {
      this.debug && console.log('Creating peer from messages!');
      this.peerClient.createPeerConnection(connection);
      connection.peer.signal(message.data);
    } else {
      connection.peer.signal(message.data);
    }
  }

  _findConnection(room) {
    let connection = null;

    for (let i = 0; i < this.peerClient.connections.length; i++) {
      if (this.peerClient.connections[i].room === room) {
        connection = this.peerClient.connections[i];
      }
    }

    if (connection === null) {
      this.debug && console.log('UT OH THAT CONNECTION DOESNT EXIST');
    } else {
      this.debug &&
        console.log('found the connection for room: ' + room);
    }

    return connection;
  }

  // This client receives a message
  _handleMessage(message) {
    this.debug && console.log('MESSAGE ' + message);

    if (message.type) {
      this.debug && console.log('received msg typ ' + message.type);
    } else {
      this.debug &&
        console.log('Client received message: ' + message);
    }

    // TO DO HANDLE BYE
    // } else if (message === 'bye' && peerStarted) {
    //   handleRemoteHangup();
  }

  _emitSocketMessage(message) {
    this.debug && console.log('Client sending message: ', message);
    this.socket.emit('message', message);
  }
}

module.exports = SocketIOClientWrapper;
