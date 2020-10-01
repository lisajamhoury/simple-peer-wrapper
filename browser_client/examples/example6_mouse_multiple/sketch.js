// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;

let myMousePosition = {};
let otherUsers = [];

const size = 50;

function setup() {
  createCanvas(500, 500);
  frameRate(60);
  colorMode(HSB, 255);

  // Start socket client automatically on load
  // by default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // to connect to server over public internet pass the ngrok address
  // WebRTCPeerClient.initSocketClient('https://65e0fc13a1c5.ngrok.io');

  // start the peer client
  WebRTCPeerClient.initPeerClient();
}

function draw() {
  // only proceed if the peer is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

  // UPDATE

  // get and send my mouse position over peer
  myMousePosition = { x: mouseX, y: mouseY };
  WebRTCPeerClient.sendData(myMousePosition);

  const newData = WebRTCPeerClient.getData();
  if (newData === null) {
    return;
  }

  let foundMatch = false;
  for (let i = 0; i < otherUsers.length; i++) {
    if (newData.userId === otherUsers[i].userId) {
      otherUsers[i].position = newData.data;
      foundMatch = true;
    }
  }

  if (!foundMatch) {
    let newUser = {
      userId: newData.userId,
      position: newData.data,
      color: random(50, 150),
    };
    otherUsers.push(newUser);
  }

  if (otherUsers.length < 1) return;

  // DRAW

  background(255, 50);
  noStroke();

  // draw my mouse
  fill(25, 255, 255);
  ellipse(myMousePosition.x, myMousePosition.y, size, size);

  // make sure we have a partner mouse before drawing
  if (otherUsers.length > 0) {
    for (let i = 0; i < otherUsers.length; i++) {
      fill(otherUsers[i].color, 255, 255);
      ellipse(
        otherUsers[i].position.x,
        otherUsers[i].position.y,
        size,
        size,
      );
    }
  }
}
