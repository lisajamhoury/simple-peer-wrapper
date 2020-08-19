// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;
let partnerMousePosition;
let myMousePosition = {};

// what example are we running?
let state = 1;

// use for developing without partner
let mirror = false;

// to lerp beat
let step = 0.1;
let amount = 0;

const colors = {
  x: 'rgba(0, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

const origSize = 50;
let size = origSize;

function setup() {
  createCanvas(500, 500);
  frameRate(30);

  // Start socket client automatically on load
  // by default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // to connect to server over public internet pass the ngrok address
  // WebRTCPeerClient.initSocketClient('http://f54b8ef193dd.ngrok.io');

  // start the peer client
  WebRTCPeerClient.initPeerClient();
}

function update() {
  // get and send my mouse position over peer
  myMousePosition = { x: mouseX, y: mouseY };
  WebRTCPeerClient.sendData(myMousePosition);

  // to test with one mirrored mouse
  if (mirror) {
    if (typeof partnerMousePosition === 'undefined') {
      partnerMousePosition = { x: 0, y: 0 };
    }

    partnerMousePosition.x = width - myMousePosition.x;
    partnerMousePosition.y = myMousePosition.y;
  } else {
    partnerMousePosition = WebRTCPeerClient.getData();
  }

  if (partnerMousePosition === null) return;

  switch (state) {
    case 1:
      dissapear();
      break;
    case 2:
      beat();
      break;
    case 3:
      flash();
      break;
    case 4:
      grow();
      break;
  }
}

function draw() {
  // only proceed if the peer is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

  update();

  background(255, 50);
  noStroke();

  // draw my mouse
  fill(colors.x);
  circle(myMousePosition.x, myMousePosition.y, size);

  // make sure we have a partner mouse before drawing
  if (partnerMousePosition !== null) {
    fill(colors.y);
    circle(partnerMousePosition.x, partnerMousePosition.y, size);
  }
}

function grow() {
  if (touching(myMousePosition, partnerMousePosition)) {
    size *= 1.01;
  } else {
    size = origSize;
  }
}

function dissapear() {
  if (touching(myMousePosition, partnerMousePosition)) {
    size = 0;
  } else {
    size = origSize;
  }
}

function beat() {
  if (touching(myMousePosition, partnerMousePosition)) {
    if (amount > 1 || amount < 0) {
      step *= -1;
    }

    amount += step;

    size = lerp(origSize * 3, origSize * 4, amount);
  } else {
    size = origSize;
  }
}

function flash() {
  if (touching(myMousePosition, partnerMousePosition)) {
    // colorMode(HSB, 255);
    // background(random(255), 255, 255);
    // colorMode(RGB, 255);

    const myRand = random(2);

    if (myRand > 1) {
      background(colors.z);
    } else {
      background(0);
    }

    size = 0;
  } else {
    size = origSize;
  }
}

function touching(mouse1, mouse2) {
  const d = dist(mouse1.x, mouse1.y, mouse2.x, mouse2.y);

  if (d > origSize) {
    return false;
  } else {
    return true;
  }
}

function keyTyped() {
  console.log('pressed ' + key);

  switch (key) {
    case '1':
      state = 1;
      break;
    case '2':
      state = 2;
      break;
    case '3':
      state = 3;
      break;
    case '4':
      state = 4;
      break;
  }
}
