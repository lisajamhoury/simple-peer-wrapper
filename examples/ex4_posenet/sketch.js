// Simple Peer Wrapper Example — PoseNet
// https://github.com/lisajamhoury/simple-peer-wrapper

// This example allows for two users to interact on the same p5 canvas
// using posenet via ml5 sent over webRTC peer connections.
// It requires that a simple-peer-server is running to connect the two peers.
// See https://github.com/lisajamhoury/simple-peer-server

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Variable to hold SimplePeerWrapper
let spw;

// Posenet variables
let video;
let poseNet;

// Variables to hold poses
let myPose = {};
let partnerPose = {};

// Variables to hold noses
let myNose;
let partnerNose;

// Use an offset if testing with just one person and webcam
// This allows you to see both skeletons
// Set to 0 if not needed
const partnerOffset = 100;

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Globals for growing animation
const origSize = 10;
let size = origSize;

// Color palette
const colors = {
  x: 'rgba(200, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
};

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Create p5 canvas
  createCanvas(640, 480);

  // Create webcam capture for posenet
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create poseNet to run on webcam and call 'modelReady' when ready
  poseNet = ml5.poseNet(video, modelReady);

  // Everytime we get a pose from posenet, call "getPose"
  // and pass in the results
  poseNet.on('pose', (results) => getPose(results));

  // Hide the webcam element, and just show the canvas
  video.hide();

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
  partnerPose = data.data;
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer is started
  // And if there is a pose from posenet
  if (
    !spw.isConnectionStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning! waiting for my pose');
    return;
  }

  // If we don't yet have a partner pose
  if (typeof partnerPose.pose === 'undefined') {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  // Get my nose from my pose
  myNose = getNose(myPose);

  // Get my partner's nose from their pose
  partnerNose = getNose(partnerPose);

  // Draw white background
  background(255);

  // Draw my keypoints and skeleton
  drawKeypoints(myPose, colors.x, partnerOffset); // draw keypoints
  drawSkeleton(myPose, colors.x, partnerOffset); // draw skeleton

  // Draw partner keypoints and skeleton
  drawKeypoints(partnerPose, colors.y, 0);
  drawSkeleton(partnerPose, colors.y, 0);

  // If our noses are touching
  if (touching(myNose, partnerNose, partnerOffset)) {
    console.log('touching');
    // Increase the keypoint size
    size *= 1.01;
  } else {
    // Otherwise, draw keypoints at original size
    size = origSize;
  }

  // Use for debugging
  // drawFramerate();
  // drawMyVideo();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Function to get and send pose from posenet
function getPose(poses) {
  // We're using single detection so we'll only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Send my pose over peer if the peer is started
  if (spw.isConnectionStarted()) {
    spw.send(myPose);
  }
}

// A function to draw ellipses over the detected keypoints
// Include an offset if testing by yourself
// And you want to offset one of the skeletons
function drawKeypoints(pose, clr, offset) {
  // Loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > scoreThreshold) {
      fill(clr);
      noStroke();
      ellipse(
        keypoint.position.x + offset, // Offset useful if testing on your own
        keypoint.position.y,
        size,
        size,
      );
    }
  }
}

// A function to draw the skeletons
function drawSkeleton(pose, clr, offset) {
  // Loop through all the skeletons detected
  const skeleton = pose.skeleton;

  // For every skeleton, loop through all body connections
  for (let j = 0; j < skeleton.length; j++) {
    // Get the ends "joints" for each bone
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];

    // If the score is high enough
    if (
      partA.score > scoreThreshold &&
      partB.score > scoreThreshold
    ) {
      // Draw a line to represent the bone
      stroke(clr);
      line(
        partA.position.x + offset,
        partA.position.y,
        partB.position.x + offset,
        partB.position.y,
      );
    }
  }
}

// Function to get nose out of the pose
function getNose(pose) {
  // Return the nose
  return pose.pose.nose;
}

// Function to see if two points are "touching"
function touching(nose1, nose2, offset) {
  // Get the distance between the two noses
  const d = dist(nose1.x, nose1.y, nose2.x + offset, nose2.y);

  // If the distance is less than 50 pixels we are touching!
  if (d < 50) {
    return true;
  }

  // Otherwise we are not touching!
  return false;
}

function drawFramerate() {
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}

function drawMyVideo() {
  // Draw my video for debug
  push();
  translate(0.25 * width, 0);
  scale(-0.25, 0.25);
  image(video, 0, 0, width, height);
  pop();
}

// Press any key to stop the sketch
function keyPressed() {
  noLoop();
}
