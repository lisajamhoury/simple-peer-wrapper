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

// For recording data
let recordButton;
let recordedData = [];
let startTime;
let recordingStarted = false;

// For playing back data
const livePartner = false; // flip this boolean to use live data or recorded data
let recordedMouse;
let mousePosCounter = 0;
let getPosTime;

function preload() {
  // If no live partner, load recorded data
  if (!livePartner) {
    recordedMouse = loadJSON('mousedata.json');
  }
}

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(500, 500);

  // Add a button for recording data
  recordButton = createButton('Toggle Recording');
  recordButton.mousePressed(toggleRecording);

  // Fix the framerate to throttle data sending and receiving
  frameRate(30);

  // Set to true to turn on logging for the webrtc client
  WebRTCPeerClient.setDebug(false);

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // To connect to server over public internet pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  // WebRTCPeerClient.initSocketClient('http://xxxxxxxxx.ngrok.io');

  // Start the peer client
  WebRTCPeerClient.initPeerClient();
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer connection is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

  // Get and send my mouse position over peer connection
  myMousePosition = { x: mouseX, y: mouseY };
  WebRTCPeerClient.sendData(myMousePosition);

  // If mirror is true, use my mouse as my partners mouse
  if (!livePartner) {
    // If my partner's mouse positin isn't defined,
    if (typeof partnerMousePosition === 'undefined') {
      // Get it from recorded data
      partnerMousePosition = recordedMouse[0].mousePosition;
      // Move counter forward
      mousePosCounter++;
      // Log the time we retrieved the position
      getPosTime = Date.now();
    }
    // How long since we last retrieved a recorded position
    const timeSinceLastPos = Date.now() - getPosTime;
    // How long between mouse recordings
    const timeBeforeNextMouse =
      recordedMouse[mousePosCounter].currentTime -
      recordedMouse[mousePosCounter - 1].currentTime;

    if (timeSinceLastPos > timeBeforeNextMouse) {
      partnerMousePosition =
        recordedMouse[mousePosCounter].mousePosition;
      getPosTime = Date.now();

      // Check that weren't not at the end of the recorded positions
      if (mousePosCounter < Object.keys(recordedMouse).length - 1) {
        mousePosCounter++;
      } else {
        console.log('resetting');
        mousePosCounter = 1;
      }
    }

    // This runs if not mirroring mouse
  } else {
    // Get the incoming data from the peer connection
    const newData = WebRTCPeerClient.getData();

    // Check if there's anything in the data;
    if (newData === null) {
      return;
      // If there is data
    } else {
      // Get the mouse data from newData.data
      // Note: newData.data is the data sent by user
      // Note: newData.userId is the peer ID of the user
      partnerMousePosition = newData.data;

      if (recordingStarted) {
        recordData(newData.data);
      }
    }
  }

  // Updates drawing based on choosen animation state (1-4)
  chooseAnimation();

  // Draw a white background with alpha of 50
  background(255, 50);

  // Don't draw the stroke
  noStroke();

  // Use color x for my mouse position
  fill(colors.x);

  // Draw an ellipse at my mouse position
  ellipse(myMousePosition.x, myMousePosition.y, size);

  // Make sure there is a partner mouse position before drawing
  if (partnerMousePosition !== null) {
    // Use color y for my parter's mouse position
    fill(colors.y);

    // Draw an ellipse at my partner's mouse position
    ellipse(partnerMousePosition.x, partnerMousePosition.y, size);
  }
}

function recordData(data) {
  console.log('recording data');
  let newData = {
    mousePosition: data,
    currentTime: Date.now(),
  };
  recordedData.push(newData);
}

function toggleRecording() {
  if (!recordingStarted) {
    recordingStarted = true;
  } else {
    downloadObjectAsJson(recordedData, 'mousedata');
    recordingStarted = false;
  }
}

// from https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
function downloadObjectAsJson(exportObj, exportName) {
  var dataStr =
    'data:text/json;charset=utf-8,' +
    encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', exportName + '.json');
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

// Animation state 1
function grow() {
  // If my mouse and my partner's mouse are touching
  if (touching(myMousePosition, partnerMousePosition)) {
    // Grow the size by .01
    size *= 1.01;
    // If not touching
  } else {
    // Draw them at their original size
    size = origSize;
  }
}

// Animation state 2
function dissapear() {
  // If my mouse and my partner's mouse are touching
  if (touching(myMousePosition, partnerMousePosition)) {
    // Mouse ellipse size is 0
    size = 0;
    // If they are not touching
  } else {
    // Draw them at their original size
    size = origSize;
  }
}

// Animation state 3
function beat() {
  // If my mouse and my partner's mouse are touching
  if (touching(myMousePosition, partnerMousePosition)) {
    // If my lerp amount is above or below the threshold, change direction
    if (amount > 1 || amount < 0) {
      step *= -1;
    }

    // Change the lerp amount by the step amount
    amount += step;

    // Lerp the size by the lerp amount
    size = lerp(origSize * 3, origSize * 4, amount);
    // If they are not touching
  } else {
    // Draw them at their original size
    size = origSize;
  }
}

// Animation state 4
function flash() {
  // If my mouse and my partner's mouse are touching
  if (touching(myMousePosition, partnerMousePosition)) {
    // Get a random number between 1 and 2
    const myRand = random(2);

    // If this number is greater than 1
    if (myRand > 1) {
      // Use the z color as the background
      background(colors.z);
      // Otherwise,
    } else {
      // Make the background black
      background(0);
    }

    // The mouse circles are size 0
    size = 0;
    // If they are not touching
  } else {
    // Draw them at their original size
    size = origSize;
  }
}

function touching(mouse1, mouse2) {
  // Get the distance between the two mice
  const d = dist(mouse1.x, mouse1.y, mouse2.x, mouse2.y);

  // If the distance if larger than the original size of the mouse
  if (d > origSize) {
    // They are not touching, return true
    return false;
    // Otherwise
  } else {
    // They are touching, return true
    return true;
  }
}

function chooseAnimation() {
  // Switch statements are similar to a series of if statements
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch

  // This changes the animation based on the value of the variable "state"
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

function keyTyped() {
  console.log('pressed ' + key);

  // Switch statements are similar to a series of if statements
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch

  // This changes the value of the variable "state" on key press
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
