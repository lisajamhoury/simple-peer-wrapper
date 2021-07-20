// Simple Peer Wrapper Example — Data with Multiple Users
// https://github.com/lisajamhoury/simple-peer-wrapper

// This example allows for multiple users to draw on the same p5.js canvas
// using webRTC peer connections. It requires that a simple-peer-server
// is running to connect the two peers.
// See https://github.com/lisajamhoury/simple-peer-server

// Include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

let myMousePosition = {};
let otherMouses = [];
let spw;
let newData;

const size = 50;

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(500, 500);

  // Fix the framerate to throttle data sending
  frameRate(30);

  // Set color mode
  colorMode(HSB, 255);

  // Include wrapper options here
  const options = {
    debug: false,
    serverUrl: 'http://localhost:8081',
  };

  // Create a new simple-peer-wrapper
  spw = new SimplePeerWrapper(options);

  // Make the peer connection
  spw.connect();

  // When data recieved over the connection call gotData
  spw.on('data', gotData);
}

function gotData(data) {
  // Store incoming data in a global variable
  newData = data;
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer connection is started
  if (!spw.isConnectionStarted()) {
    console.log('Returning. Waiting for connection to begin.');
    return;
  }

  // get and send my mouse position over peer
  myMousePosition = { x: mouseX, y: mouseY };
  spw.send(myMousePosition);

  // Only proceed if we have at least one other mouse position
  if (typeof newData === 'undefined') {
    console.log('Returning. Waiting for another mouse to join.');
    return;
  }

  let foundMatch = false;

  // see if the data is from a user that already exists
  for (let i = 0; i < otherMouses.length; i++) {
    // if the user exists
    if (newData.userId === otherMouses[i].userId) {
      // update their position
      otherMouses[i].position = newData.data;
      // we found a match!
      foundMatch = true;
    }
  }

  // if the user doesn't exist
  if (!foundMatch) {
    // create a new user
    let newUser = {
      userId: newData.userId,
      position: newData.data,
      color: random(50, 150),
    };

    // add them to the array
    otherMouses.push(newUser);
  }

  // make sure we have at least one partner before drawing
  if (otherMouses.length < 1) return;

  // use some opacity on background for trails
  background(255, 50);
  noStroke();

  // draw my mouse
  fill(25, 255, 255);
  ellipse(myMousePosition.x, myMousePosition.y, size, size);

  // draw all the other mice
  for (let i = 0; i < otherMouses.length; i++) {
    fill(otherMouses[i].color, 255, 255);
    ellipse(
      otherMouses[i].position.x,
      otherMouses[i].position.y,
      size,
      size,
    );
  }
}

// Close simple-peer connections before exiting
window.onbeforeunload = () => {
  spw.close();
};
