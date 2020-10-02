// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;

let myPose = {};
let otherPoses = [];

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Posenet variables
let video;
let poseNet;

// Size of joints
const size = 10;

function setup() {
  createCanvas(500, 500);
  frameRate(60);
  colorMode(HSB, 255);

  initPosenet();
  initPeer();
}

function draw() {
  // only proceed if the peer is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

  getOtherPoses();

  if (typeof myPose.pose === 'undefined') return;

  if (otherPoses.length < 1) return;

  background(255, 50);
  noStroke();

  // draw my mouse
  const myColor = color(25, 255, 255);

  drawKeypoints(myPose, myColor, 0);

  // make sure we have a partner mouse before drawing
  if (otherPoses.length > 0) {
    for (let i = 0; i < otherPoses.length; i++) {
      const newColor = color(otherPoses[i].color, 255, 255);
      drawKeypoints(otherPoses[i].pose, newColor, 50 * i);
    }
  }
}

function initPosenet() {
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
}

function initPeer() {
  // Start socket client automatically on load
  // by default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // to connect to server over public internet pass the ngrok address
  // WebRTCPeerClient.initSocketClient('https://65e0fc13a1c5.ngrok.io');

  // start the peer client
  WebRTCPeerClient.initPeerClient();
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

function getOtherPoses() {
  const newData = WebRTCPeerClient.getData();
  if (newData === null) {
    return;
  }

  let foundMatch = false;

  for (let i = 0; i < otherPoses.length; i++) {
    if (newData.userId === otherPoses[i].userId) {
      otherPoses[i].pose = newData.data;
      foundMatch = true;
    }
  }

  if (!foundMatch) {
    let newUser = {
      userId: newData.userId,
      pose: newData.data,
      color: random(50, 150),
    };
    otherPoses.push(newUser);
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
