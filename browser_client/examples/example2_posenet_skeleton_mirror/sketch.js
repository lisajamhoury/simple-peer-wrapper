// WebRTC Simple Peer Example — Posenet Skeleton
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to interact on the same p5 canvas
// using posenet via ml5. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// See readme.md for additional instructions

// p5 code goes here

// include this to use p5 autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Peer variables
let startPeer;

// Posenet variables
let video;
let poseNet;

// Variables to hold poses
let myPose = {};
let partnerPose = {};

// Variables to hold noses
let myNose;
let partnerNose;

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Use for developing without partner
// This will mirror one user's pose
// and will ingnore the pose over peer connection
const mirror = false;

// Globals for growing animation
const origSize = 10;
let size = origSize;

// Color palette
const colors = {
  x: 'rgba(200, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
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

  // Options for posenet
  // See https://ml5js.org/reference/api-PoseNet/
  // Use these options for slower computers, esp architecture
  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  // Computers with more robust gpu can handle architecture 'ResNet50'
  // It is more accurate at the cost of speed
  // const options = {
  //   architecture: 'ResNet50',
  //   outputStride: 32,
  //   detectionType: 'single',
  //  flipHorizontal: true,
  //   quantBytes: 2,
  // };

  // Create poseNet to run on webcam and call 'modelReady' when ready
  poseNet = ml5.poseNet(video, options, modelReady);

  // Everytime we get a pose from posenet, call "getPose"
  // and pass in the results
  poseNet.on('pose', (results) => getPose(results));

  // Hide the webcam element, and just show the canvas
  video.hide();

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  // WebRTCPeerClient.initSocketClient();

  // To connect to server remotely pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  WebRTCPeerClient.initSocketClient('https://37d95b00940d.ngrok.io');

  // Start the peer client
  WebRTCPeerClient.initPeerClient();
}

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer is started
  // And if there is a pose from posenet
  if (
    !WebRTCPeerClient.isPeerStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning!');
    return;
  }

  // If not mirroring
  // Get the partner pose from the peer connection
  if (!mirror) {
    // Get the incoming data from the peer connection
    const newData = WebRTCPeerClient.getData();

    // Check if there's anything in the data
    if (newData === null) {
      return;
      // If there is data
    } else {
      // Get the pose data from newData.data
      // newData.data is the data sent by user
      // newData.userId is the peer ID of the user
      partnerPose = newData.data;
    }

    // If mirror is true, mirror my pose.
    // Use this for testing/developing
  } else {
    mirrorPoseAndSkeleton();
  }

  // If we don't yet have a partner pose
  if (partnerPose === null) {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  // Get my nose from my pose
  myNose = getNose(myPose, false);

  // Get my partner's nose from their pose
  partnerNose = getNose(partnerPose, true);

  // Draw white background
  background(255);

  // Draw my keypoints and skeleton
  drawKeypoints(myPose, colors.x, 0); // draw keypoints
  drawSkeleton(myPose, colors.x, 0); // draw skeleton

  // Draw partner keypoints and skeleton
  drawKeypoints(partnerPose, colors.y, 0);
  drawSkeleton(partnerPose, colors.y, 0);

  // If our noses are touching
  if (touching(myNose, partnerNose)) {
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
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
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
function getNose(pose, mirror) {
  // If mirror is true, mirror the nose by subtracting it from the width
  if (mirror) pose.pose.nose.x = width - pose.pose.nose.x;

  // Return the nose
  return pose.pose.nose;
}

// Function to see if two points are "touching"
function touching(nose1, nose2) {
  // Get the distance between the two noses
  const d = dist(nose1.x, nose1.y, nose2.x, nose2.y);

  // If the distance is less than 50 pixels we are touching!
  if (d < 50) {
    return true;
  }

  // Otherwise we are not touching!
  return false;
}

function mirrorPoseAndSkeleton() {
  // Use lodash to deep clone my pose and nose
  // See https://lodash.com/docs#cloneDeep
  partnerPose.pose = _.cloneDeep(myPose.pose);
  partnerPose.skeleton = _.cloneDeep(myPose.skeleton);

  // Mirror all of the bones and joints in the pose
  mirrorPose(partnerPose.pose);
  mirrorSkeleton(partnerPose.skeleton);
}

// A function to mirror the pose for testing with one person
function mirrorPose(pose) {
  // Loop through all keypoints
  for (let j = 0; j < pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Reverse keypoint by subtracting the x from the width
    keypoint.position.x = width - keypoint.position.x;
  }
}

// A function to mirror the pose for testing with one person
function mirrorSkeleton(skeleton) {
  // We need to keep track of which parts are mirrored because
  // posenet duplicates parts within the pose object
  let mirroredParts = [];

  // Check that there are parts to connect
  if (skeleton.length < 1) return;

  // Loop through all body connections
  for (let i = 0; i < skeleton.length; i++) {
    // Get the joints
    const jointA = skeleton[i][0];
    const jointB = skeleton[i][1];

    // Check if the part is mirrored already
    const jointAMirrored = mirroredParts.includes(jointA.part);

    // If the part is not mirrored, mirror jointA
    if (!jointAMirrored) {
      jointA.position.x = width - jointA.position.x;
    }

    // Check if the part is mirrored already
    const jointBMirrored = mirroredParts.includes(jointB.part);

    // If the part is not mirrored, mirror jointB
    if (!jointBMirrored) {
      jointB.position.x = width - jointB.position.x;
    }

    // Add mirrored joints to array
    mirroredParts.push(jointA.part);
    mirroredParts.push(jointB.part);
  }
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
