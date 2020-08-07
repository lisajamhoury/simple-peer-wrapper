const io = require('socket.io-client');
let Peer = require('simple-peer');
const socket = io.connect('http://localhost:80');

const turnRequest = require('./turnRequest');
turnRequest();

let peer;

let localVideo = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');
let localStream;

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
  initiator = true;
};

// room only holds two clients, can be changed in signal_socket.js
const handleFullRoom = (room) => {
  log('Room ' + room + ' is full');
};

// called by initiator client only
const handleJoinRoom = (room) => {
  log('Another peer made a request to join room ' + room);
  log('This peer is the initiator of room ' + room + '!');
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
  log('MESSAGE', message);

  if (message.type) {
    log('received msg typ ', message.type);
  } else {
    log('Client received message:', message);
  }

  if (message === 'got user media') {
    attemptPeerStart();
  } else if (message.type === 'sending signal') {
    log('receiving simple signal data');

    if (!peer) {
      createPeerConnection(initiator);
      peer.signal(message.data);
    } else {
      peer.signal(message.data);
    }
  } else if (message === 'bye' && peerStarted) {
    handleRemoteHangup();
  }
};

const initSocketClient = function () {
  socket.on('created', (room) => handleCreated(room));
  socket.on('full', (room) => handleFullRoom(room));
  socket.on('join', (room) => handleJoinRoom(room));
  socket.on('joined', (room) => handleJoinedRoom(room));
  socket.on('log', (array) => handleLog(array));
  socket.on('message', (message) => handleMessage(message));

  startSocketCommunication();
};

const sendMessage = (message) => {
  log('Client sending message: ', message);
  socket.emit('message', message);
};

initSocketClient();

/////////////////// Peer Connection Via Simple Peer  ///////////////////

const sendSignal = (data) => {
  log('sending signal');

  sendMessage({
    type: 'sending signal',
    data: JSON.stringify(data),
  });
};

const handleConnection = (data) => {
  log('SIMPLE PEER IS CONNECTED', data);
};

const handleStream = (stream) => {
  remoteVideo.srcObject = stream;
};

const handleError = (err) => {
  log(err);
};

const handleData = (data) => {
  log('got data', data);
};

const handleClose = () => {
  log('Hanging up.');
  closePeerConnection();
  sendMessage('bye');
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
    stream: localStream,
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

// const sendData = (data) => {
//   console.log('attempting send');
//   console.log(peer);
//   // peer.send(data);
// };

window.onbeforeunload = () => {
  sendMessage('bye');
};

/////////////////// getUserMedia starts video and starts Simple Peer on Connection  ///////////////////

const gotStream = (stream) => {
  log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (initiator) {
    attemptPeerStart();
  }
};

const attemptPeerStart = () => {
  log('Attempting peer start', peerStarted, roomReady);
  if (!peerStarted && roomReady) {
    log('Creating peer connection');
    log('initiator', initiator);
    createPeerConnection(initiator);
  } else {
    log('Not creating peer connection');
  }
};

navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: true,
  })
  .then(gotStream)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });

window.WebRTCPeerClient = {
  gotStream: gotStream,
  // sendData: sendData,
  isPeerStarted: isPeerStarted,
};
