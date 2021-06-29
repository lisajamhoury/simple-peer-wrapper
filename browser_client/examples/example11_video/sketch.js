// WebRTC Simple Peer Example — Video over webRTC
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to share video streams
// using webRTC peer connections. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.

// p5 code goes here

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

let startPeer;
let myVideo;
let partnerVideo; //
let partnerStream = null;
let currentPartnerId = null;
let partnerStreamStarted = false;

let signal;

function setup() {
  createCanvas(640, 240);

  // create my webcam video and hide it
  // call gotMedia when my video is loaded
  myVideo = createCapture(VIDEO, gotMedia);
  myVideo.size(width / 2, height);
  myVideo.hide();

  // create a video element for partners stream and hide it
  partnerVideo = createCapture(VIDEO);
  partnerVideo.size(width / 2, height);
  partnerVideo.hide();

  // set to true to turn on logging for the webrtc client
  // WebRTCPeerClient.setDebug(false);
}

function gotMedia(stream) {
  // start the webrtc connection

  // send my video stream
  // WebRTCPeerClient.initSocketClient({
  //   serverUrl: 'https://9bf0ae2ca82a.ngrok.io',
  //   stream: stream,
  // });
  // WebRTCPeerClient.initPeerClient();

  const options = {
    // serverUrl: 'https://da25d6a0023b.ngrok.io',
    stream: stream,
  };

  signal = new WebRTCPeerClient(options);
  signal.connect();
}

function draw() {
  background(255);

  // draw my webcam video
  image(myVideo, 0, 0, width / 2, height);

  // placeholder for partner video
  if (!partnerStreamStarted) {
    fill('green');
    rect(width / 2, 0, width / 2, height);
    fill('black');
    textAlign(CENTER);
    textSize(20);
    text('Waiting for partner!', (width / 4) * 3, height / 2);
  }

  // Only proceed if the peer connection is started
  // console.log(typeof signal);

  if (
    typeof signal === 'undefined' ||
    !signal.isConnectionStarted()
  ) {
    console.log('waiting for peer to start');
    return;
  }

  // get my partners stream
  // MAKE THIS ON STREAM??
  // partnerStream = WebRTCPeerClient.getStream();
  partnerStream = signal.getStream();

  // if the partner stream exists and its id is new
  if (
    typeof partnerStream !== 'undefined' &&
    currentPartnerId !== partnerStream.id
  ) {
    console.log('new stream');
    partnerVideo.elt.srcObject = partnerStream; // set the partner video stream
    currentPartnerId = partnerStream.id; // log the stream id
    if (!partnerStreamStarted) partnerStreamStarted = true;
  }

  if (partnerStreamStarted === true) {
    image(partnerVideo, width / 2, 0, width / 2, height); // draw partner video
  }
}

function keyTyped() {
  console.log('pressed ' + key);
  if (key === '0') {
    noLoop();
  }
}
