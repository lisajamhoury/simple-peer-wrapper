const io = require('socket.io-client');
let Peer = require('simple-peer');

const socket = io.connect('http://localhost:80');
let peer;
const room = 'foo'; // Could prompt for room name: // room = prompt('Enter room name:');

let localVideo = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');
let localStream;

let isChannelReady = false;
let isInitiator = false;
let isStarted = false;
let turnReady; // currently unused

const pcConfig = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
};

/////////////////// Client Signal Server Using Socket IO ///////////////////

// starts socket client communication with signal server automatically
if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

socket.on('created', (room) => {
  console.log('Created room ' + room);
  isInitiator = true;
});

// room only holds two clients, can be changed in signal_socket.js
socket.on('full', (room) => {
  console.log('Room ' + room + ' is full');
});

// called by initiator client only
socket.on('join', (room) => {
  console.log('Another peer made a request to join room ' + room);
  console.log('This peer is the initiator of room ' + room + '!');
  isChannelReady = true;
});

// called by non-initiator client
socket.on('joined', (room) => {
  console.log('joined: ' + room);
  isChannelReady = true;
});

// logs messages from server
socket.on('log', (array) => {
  console.log.apply(console, array);
});

// This client receives a message
socket.on('message', (message) => {
  console.log('MESSAGE', message);

  if (message.type) {
    console.log('received msg typ ', message.type);
  } else {
    console.log('Client received message:', message);
  }

  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'sending signal') {
    console.log('receiving simple signal data');

    if (!peer) {
      createPeerConnection(isInitiator);
      peer.signal(message.data);
    } else {
      peer.signal(message.data);
    }
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

function sendMessage(message) {
  console.log('Client sending message: ', message);
  socket.emit('message', message);
}

/////////////////// getUserMedia starts video and starts Simple Peer on Connection  ///////////////////

navigator.mediaDevices
  .getUserMedia({
    audio: false,
    video: true,
  })
  .then(gotStream)
  .catch(function (e) {
    alert('getUserMedia() error: ' + e.name);
  });

function gotStream(stream) {
  console.log('Adding local stream.');
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

function maybeStart() {
  console.log(
    '>>>>>>> maybeStart() ',
    isStarted,
    localStream,
    isChannelReady,
  );
  if (
    !isStarted &&
    typeof localStream !== 'undefined' &&
    isChannelReady
  ) {
    console.log('>>>>>> creating peer connection');
    console.log('isInitiator', isInitiator);

    createPeerConnection(isInitiator);
    isStarted = true;
  }
}

window.onbeforeunload = function () {
  sendMessage('bye');
};

function createPeerConnection(isInit) {
  peer = new Peer({
    initiator: isInit,
    stream: localStream,
  });
  console.log('creating simple peer');

  // If isInitiator,peer.on'signal' will fire right away, if not it waits for signal
  // https://github.com/feross/simple-peer#peeronsignal-data--
  peer.on('signal', (data) => sendSignal(data));
  peer.on('connect', (data) =>
    console.log('SIMPLE PEER IS CONNECTED', data),
  );
  peer.on('error', (err) => console.log(err));
  peer.on('stream', (stream) => (remoteVideo.srcObject = stream));
  peer.on('close', () => hangup());
}

function sendSignal(data) {
  console.log('sending signal');

  sendMessage({
    type: 'sending signal',
    data: JSON.stringify(data),
  });
}

function hangup() {
  console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  peer.destroy();
  peer = null;
}

/////////////////// Turn Server Used if Not on LocaHost — I have not tested this  ///////////////////

if (
  location.hostname &&
  location.hostname !== 'localhost' &&
  location.hostname !== '127.0.0.1'
) {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913',
  );
}

function requestTurn(turnURL) {
  let turnExists = false;
  for (let i in pcConfig.iceServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }
  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com:
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          urls: 'turn:' + turnServer.username + '@' + turnServer.turn,
          credential: turnServer.password,
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}
