// Simple Peer Wrapper Example — Data
// https://github.com/lisajamhoury/simple-peer-wrapper

// This example allows for two users to draw on the same p5.js canvas
// using webRTC peer connections. It requires that a simple-peer-server
// is running to connect the two peers.
// See https://github.com/lisajamhoury/simple-peer-server

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

let partnerMousePosition;
let myMousePosition = {};

let spw;

// Colors used for drawing mouse ellipses
const colors = {
  x: 'rgba(16, 157, 227, 0.5)',
  y: 'rgba(227, 86, 16, 0.5)',
};

const size = 50;

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(500, 500);

  // Fix the framerate to throttle data sending
  frameRate(30);

  // Include wrapper options here
  const options = {
    // debug: true,
  };

  // Create a new simple-peer-wrapper
  spw = new SimplePeerWrapper(options);

  // Make the peer connection
  spw.connect();

  // When data recieved over the connection call gotData
  spw.on('data', gotData);
}

function gotData(data) {
  partnerMousePosition = data.data;
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer connection is started
  if (!spw.isConnectionStarted()) {
    console.log('returning');
    return;
  }

  // Get and send my mouse position over peer connection
  myMousePosition = { x: mouseX, y: mouseY };
  spw.send(myMousePosition);

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

// Close simple-peer connections before exiting
window.onbeforeunload = () => {
  spw.close();
};
