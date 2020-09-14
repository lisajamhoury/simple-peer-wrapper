const io = require('socket.io-client');
let Peer = require('simple-peer');

let socket;

const turnRequest = require('./turnRequest');
turnRequest();

let newData = null;

let connections = [];
let initPeerRequest = false;

let debug = false;

/////////////////// Client Signal Server Using Socket IO ///////////////////

// starts socket client communication with signal server automatically
const startSocketCommunication = () => {
  socket.emit('create or join');
  debug && console.log('Attempted to create or join room');
};

const handleCreated = (room) => {
  debug && console.log('Created room ' + room);
};

// room only holds two clients, can be changed in signal_socket.js
const handleFullRoom = (room) => {
  debug && console.log('Room ' + room + ' is full');
};

// called by initiator client only
const handleJoinRoom = (room) => {
  debug &&
    console.log('Another peer made a request to join room ' + room);
  debug &&
    console.log('This peer is the initiator of room ' + room + '!');

  logConnection(room, true, true, false);
  if (initPeerRequest) {
    debug && console.log('initing peer from handle join');
    initPeerClient();
  }
};

// called by non-initiator client
const handleJoinedRoom = (room) => {
  debug && console.log('joined: ' + room);
  roomReady = true;

  logConnection(room, false, true, false);
  if (initPeerRequest) {
    debug && console.log('initing peer from handle joined');
    initPeerClient();
  }
};

const logConnection = (
  _room,
  _initiator,
  _roomReady,
  _peerStarted,
) => {
  debug && console.log('logging connection');
  const newConnection = {
    room: _room, // socket.io server room
    initiator: _initiator, // client initiates the communication
    roomReady: _roomReady, // socket.io room is created or joined
    peerStarted: _peerStarted, // the peer connection is started
  };

  connections.push(newConnection);
};

// logs messages from server
const handleLog = (array) => {
  log.apply(console, array);
};

const handleInitPeer = (room) => {
  const connection = findConnection(room);
  attemptPeerStart(connection);
};

const handleSendSignal = (message) => {
  debug && console.log('receiving simple signal data');
  const connection = findConnection(message.room);

  if (!connection.peerStarted) {
    debug && console.log('Creating peer from messages!');
    createPeerConnection(connection);
    connection.peer.signal(message.data);
  } else {
    connection.peer.signal(message.data);
  }
};

const findConnection = (room) => {
  let connection = null;

  for (let i = 0; i < connections.length; i++) {
    if (connections[i].room === room) {
      connection = connections[i];
    }
  }

  if (connection === null) {
    debug && console.log('UT OH THAT CONNECTION DOESNT EXIST');
  } else {
    debug && console.log('found the connection for room: ' + room);
  }

  return connection;
};

// This client receives a message
const handleMessage = (message) => {
  debug && console.log('MESSAGE ' + message);

  if (message.type) {
    debug && console.log('received msg typ ' + message.type);
  } else {
    debug && console.log('Client received message: ' + message);
  }

  // TO DO HANDLE BYE
  // } else if (message === 'bye' && peerStarted) {
  //   handleRemoteHangup();
};

const initSocketClient = function (serverUrl) {
  let socketServerUrl = 'http://localhost:80';

  if (typeof serverUrl !== 'undefined') {
    socketServerUrl = serverUrl;
  }

  debug && console.log('connecting socket to ' + socketServerUrl);
  socket = io.connect(socketServerUrl);

  socket.on('created', (room) => handleCreated(room));
  socket.on('full', (room) => handleFullRoom(room));
  socket.on('join', (room) => handleJoinRoom(room));
  socket.on('joined', (room) => handleJoinedRoom(room));
  socket.on('initiate peer', (room) => handleInitPeer(room));
  socket.on('sending signal', (message) => handleSendSignal(message));
  socket.on('log', (array) => handleLog(array));
  socket.on('message', (message) => handleMessage(message));

  startSocketCommunication();
};

const emitSocketMessage = (message) => {
  debug && console.log('Client sending message: ', message);
  socket.emit('message', message);
};

/////////////////// Peer Connection Via Simple Peer  ///////////////////

const sendSignal = (data, connection) => {
  debug && console.log('sending signal');

  const message = {
    room: connection.room,
    data: JSON.stringify(data),
  };

  socket.emit('sending signal', message);
};

const handleConnection = (data) => {
  console.log('SIMPLE PEER IS CONNECTED');
};

const handleStream = (stream) => {
  // remoteVideo.srcObject = stream;
};

const handleError = (err) => {
  debug && console.log(err);
};

const handleData = (data) => {
  const decodedString = new TextDecoder('utf-8').decode(data);
  const decodedJSON = JSON.parse(decodedString);
  newData = decodedJSON;
};

const terminateSession = () => {
  for (let i = 0; i < connections.length; i++) {
    const peer = connections[i].peer;
    peer.destroy(); // simple-peer method to close and cleanup peer connection
    connections[i].peer = null;
    connections[i].peerStarted = false;
  }

  // TO DO destroy socket and associated rooms
  socket.emit('hangup');
  socket.close();

  // emitSocketMessage('hangup');
};

const handleClose = () => {
  debug && console.log('GOT CLOSE');
  // closePeerConnection();
  // emitSocketMessage('bye');
};

const handleRemoteHangup = () => {
  // log('Session terminated.');
  // closePeerConnection();
  // initiator = false;
};

const closePeerConnection = () => {
  // peerStarted = false;
  // peer.destroy();
  // peer = null;
};

function createPeerConnection(connection) {
  debug && console.log('creating simple peer');

  const peer = new Peer({
    initiator: connection.initiator,
  });

  // If initiator,peer.on'signal' will fire right away, if not it waits for signal
  // https://github.com/feross/simple-peer#peeronsignal-data--
  peer.on('signal', (data) => sendSignal(data, connection));
  peer.on('connect', (data) => handleConnection(data));
  peer.on('error', (err) => handleError(err));
  peer.on('stream', (stream) => handleStream(stream));
  peer.on('data', (data) => handleData(data));
  peer.on('close', () => handleClose());

  connection.peerStarted = true;
  connection.peer = peer;
}

const isPeerStarted = () => {
  let peerStarted = false;

  // if any peer connection is not started then it returns false
  for (let i = 0; i < connections.length; i++) {
    peerStarted = connections[i].peerStarted;
  }
  return peerStarted;
};

const sendData = (data) => {
  let msg = JSON.stringify({ data: data, userId: socket.id });

  for (let i = 0; i < connections.length; i++) {
    const peer = connections[i].peer;
    // debug && console.log('Peer: ? ' + peer);
    if (peer.connected) {
      peer.write(msg);
    }
  }
};

const getData = () => {
  if (newData !== null) {
    return newData;
  } else {
    return null;
  }
};

window.onbeforeunload = () => {
  terminateSession();
};

const attemptPeerStart = (connection) => {
  debug &&
    console.log(
      'Attempting peer start',
      connection.peerStarted,
      connection.roomReady,
    );
  if (!connection.peerStarted && connection.roomReady) {
    debug && console.log('Creating peer connection');
    // log('initiator', initiator);
    // debug && console.log('YES creating from attempt peer start');
    createPeerConnection(connection);
  } else {
    // debug && console.log('NOT creating from attempt peer start');
    debug && console.log('Not creating peer connection');
  }
};

const initPeerClient = () => {
  debug &&
    console.log(
      'running init Peer Client. # of ' + connections.length,
    );
  initPeerRequest = true;

  for (let i = 0; i < connections.length; i++) {
    socket.emit('initiate peer', connections[i].room);
    // socket.to(connections[i].room).emit('initiate peer');
    if (connections[i].initiator) {
      attemptPeerStart(connections[i]);
    }
  }
};

const setDebug = (_debug) => {
  debug = _debug;
};

const isInitiator = () => {
  return initiator;
};

module.exports = {
  initSocketClient: initSocketClient,
  initPeerClient: initPeerClient,
  isInitiator: isInitiator,
  sendData: sendData,
  getData: getData,
  isPeerStarted: isPeerStarted,
  setDebug: setDebug,
};
