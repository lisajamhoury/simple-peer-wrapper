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

let myVideo;
let partnerVideo;
let partnerStream = null;
let partnerStreamStarted = false;
let spw;

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
}

function gotMedia(stream) {
  const options = {
    stream: stream,
    debug: true,
  };

  spw = new SimplePeerWrapper(options);
  spw.connect();
  spw.on('stream', gotStream);
}

function gotStream(stream) {
  partnerStream = stream;
  if (!partnerStreamStarted) partnerStreamStarted = true;
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

  // when received, draw partner video
  if (partnerStreamStarted) {
    image(partnerVideo, width / 2, 0, width / 2, height); // draw partner video
  }
}

// Close simple-peer connections before exiting
window.onbeforeunload = () => {
  spw.close();
};

function keyTyped() {
  console.log('pressed ' + key);
  if (key === '0') {
    noLoop();
    // spw.close();
  }
}
