// WebRTC Simple Peer Example — Mouse over webRTC
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to draw on the same p5 canvas
// using webRTC peer connections. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// Use keys 1-4 to switch between four animation states

// p5 code goes here

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Peer variables
let startPeer;
let partnerMousePosition;
let myMousePosition = {};

let signal;

// What interaction are we running?
// We start with interaction 1
let state = 1;

// Globals for lerping in heartbeat animation
let step = 0.1;
let amount = 0;

// Globals for growing animation
const origSize = 50;
let size = origSize;

// Colors used for drawing mouse ellipses
const colors = {
  x: 'rgba(0, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(500, 500);

  // Fix the framerate to throttle data sending and receiving
  frameRate(30);

  const options = {
    // debug: true,
  };

  signal = new WebRTCPeerClient(options);

  signal.connect();
  signal.on('data', gotData);
}

function gotData(data) {
  partnerMousePosition = data.data;
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer connection is started
  if (!signal.isConnectionStarted()) {
    console.log('returning');
    return;
  }

  // Get and send my mouse position over peer connection
  myMousePosition = { x: mouseX, y: mouseY };
  signal.send(myMousePosition);

  // Draw a white background with alpha of 50
  background(255, 50);

  // Don't draw the stroke
  noStroke();

  // Use color x for my mouse position
  fill(colors.x);

  // Draw an ellipse at my mouse position
  ellipse(myMousePosition.x, myMousePosition.y, size);

  // Make sure there is a partner mouse position before drawing
  if (typeof partnerMousePosition !== 'undefined') {
    // Use color y for my parter's mouse position
    fill(colors.y);

    // Draw an ellipse at my partner's mouse position
    ellipse(partnerMousePosition.x, partnerMousePosition.y, size);
  }
}
