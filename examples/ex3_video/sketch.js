// Simple Peer Wrapper Example — Video
// https://github.com/lisajamhoury/simple-peer-wrapper

// This example allows for two users to share video on a p5.js canvas
// using webRTC peer connections. It requires that a simple-peer-server
// is running to connect the two peers.
// See https://github.com/lisajamhoury/simple-peer-server

// Include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

let myVideo;
let partnerVideo;
let partnerStream = null;
let partnerStreamStarted = false;
let spw;

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas to fit resolution of webcams
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
    serverUrl: 'http://localhost:8081',
  };

  // Create a new simple-peer-wrapper with a webcam stream
  spw = new SimplePeerWrapper(options);

  // Make the peer connection
  spw.connect();

  // When a stream is received call gotStream
  spw.on('stream', gotStream);
}

function gotStream(stream) {
  // Store incoming stream in a global variable
  partnerStream = stream;
  partnerVideo.elt.srcObject = partnerStream; // set the partner video stream
  if (!partnerStreamStarted) partnerStreamStarted = true;
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
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
