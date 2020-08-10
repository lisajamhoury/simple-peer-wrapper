const io = require('socket.io-client');
let Peer = require('simple-peer');

let socket;

const turnRequest = require('./turnRequest');
turnRequest();

let peer = null;
let newData = null;

let initiator = false; // which client initiates the communication
let roomReady = false; // socket.io room is created or joined
let peerStarted = false; // the peer connection is started

const DEBUG = true;

const log = function (message) {
  if (!DEBUG) {
    return;
  }
  console.log(message);
};

/////////////////// Client Signal Server Using Socket IO ///////////////////

// starts socket client communication with signal server automatically
const startSocketCommunication = () => {
  // define name of room here
  const room = 'foo';
  socket.emit('create or join', room);
  log('Attempted to create or join room', room);
};

const handleCreated = (room) => {
  log('Created room ' + room);
};

// room only holds two clients, can be changed in signal_socket.js
const handleFullRoom = (room) => {
  log('Room ' + room + ' is full');
};

// called by initiator client only
const handleJoinRoom = (room) => {
  log('Another peer made a request to join room ' + room);
  log('This peer is the initiator of room ' + room + '!');
  initiator = true;
  roomReady = true;
};

// called by non-initiator client
const handleJoinedRoom = (room) => {
  log('joined: ' + room);
  roomReady = true;
};

// logs messages from server
const handleLog = (array) => {
  log.apply(console, array);
};

// This client receives a message
const handleMessage = (message) => {
  log('MESSAGE ' + message);

  if (message.type) {
    log('received msg typ ' + message.type);
  } else {
    log('Client received message: ' + message);
  }

  if (message === 'initiate peer') {
    attemptPeerStart();
  } else if (message.type === 'sending signal') {
    log('receiving simple signal data');

    if (!peerStarted) {
      console.log('Creating peer from messages!');
      createPeerConnection(initiator);
      peer.signal(message.data);
    } else {
      peer.signal(message.data);
    }
  } else if (message === 'bye' && peerStarted) {
    handleRemoteHangup();
  }
};

const initSocketClient = function (serverUrl) {
  console.log('connecting to ', serverUrl);
  let socketServerUrl = 'http://localhost:80';

  if (typeof serverUrl !== 'undefined') {
    socketServerUrl = serverUrl;
  }

  socket = io.connect(socketServerUrl);
  // const socket = io.connect('http://f54b8ef193dd.ngrok.io');

  socket.on('created', (room) => handleCreated(room));
  socket.on('full', (room) => handleFullRoom(room));
  socket.on('join', (room) => handleJoinRoom(room));
  socket.on('joined', (room) => handleJoinedRoom(room));
  socket.on('log', (array) => handleLog(array));
  socket.on('message', (message) => handleMessage(message));

  startSocketCommunication();
};

const emitSocketMessage = (message) => {
  log('Client sending message: ', message);
  socket.emit('message', message);
};

/////////////////// Peer Connection Via Simple Peer  ///////////////////

const sendSignal = (data) => {
  log('sending signal');

  emitSocketMessage({
    type: 'sending signal',
    data: JSON.stringify(data),
  });
};

const handleConnection = (data) => {
  log('SIMPLE PEER IS CONNECTED', data);
};

const handleStream = (stream) => {
  // remoteVideo.srcObject = stream;
};

const handleError = (err) => {
  log(err);
};

const handleData = (data) => {
  let str = new TextDecoder('utf-8').decode(data);
  let dat = JSON.parse(str);
  newData = dat.message;
};

const handleClose = () => {
  log('Hanging up.');
  closePeerConnection();
  emitSocketMessage('bye');
};

const handleRemoteHangup = () => {
  log('Session terminated.');
  closePeerConnection();
  initiator = false;
};

const closePeerConnection = () => {
  peerStarted = false;
  peer.destroy();
  peer = null;
};

function createPeerConnection(isInit) {
  log('creating simple peer');

  peer = new Peer({
    initiator: isInit,
  });

  // If initiator,peer.on'signal' will fire right away, if not it waits for signal
  // https://github.com/feross/simple-peer#peeronsignal-data--
  peer.on('signal', (data) => sendSignal(data));
  peer.on('connect', (data) => handleConnection(data));
  peer.on('error', (err) => handleError(err));
  peer.on('stream', (stream) => handleStream(stream));
  peer.on('data', (data) => handleData(data));
  peer.on('close', () => handleClose());

  peerStarted = true;
}

const isPeerStarted = () => {
  return peerStarted;
};

const sendData = (data) => {
  let msg = JSON.stringify({ message: data });

  if (peer.connected) {
    peer.write(msg);
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
  emitSocketMessage('bye');
};

/////////////////// getUserMedia starts video and starts Simple Peer on Connection  ///////////////////

const attemptPeerStart = () => {
  log('Attempting peer start', peerStarted, roomReady);
  if (!peerStarted && roomReady) {
    log('Creating peer connection');
    // log('initiator', initiator);
    // console.log('YES creating from attempt peer start');
    createPeerConnection(initiator);
  } else {
    // console.log('NOT creating from attempt peer start');
    log('Not creating peer connection');
  }
};

const initPeerClient = () => {
  emitSocketMessage('initiate peer');
  if (initiator) {
    attemptPeerStart();
  }
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
};
