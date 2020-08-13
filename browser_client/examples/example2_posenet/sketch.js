// p5 code goes in this file

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;
let partnerPose;
let myMousePosition = {};

// posenet variables
let video;
let poseNet;
let myPose = [];

// what example are we running?
let state = 1;

// use for developing without partner
let mirror = false;

const colors = {
  x: 'rgba(0, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

function setup() {
  // create p5 canvas
  createCanvas(640, 480);

  // create webcam capture for posenet
  video = createCapture(VIDEO);
  video.size(width, height);

  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: false,
    minConfidence: 0.5,
    maxPoseDetections: 5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, options, modelReady);

  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function (results) {
    myPose = results;
  });

  // Hide the video element, and just show the canvas
  video.hide();

  // start socket client automatically on load
  // by default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // to connect to server remotely pass the ngrok address
  // WebRTCPeerClient.initSocketClient('http://f54b8ef193dd.ngrok.io');

  // start the peer client
  WebRTCPeerClient.initPeerClient();
}

function modelReady() {
  console.log('Model Loaded');
}

function update() {
  // send my pose over peer
  WebRTCPeerClient.sendData(myPose);

  // to test with one mirrored mouse
  if (mirror) {
  } else {
    partnerPose = WebRTCPeerClient.getData();
  }
}

function draw() {
  // only proceed if the peer is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    return;
  }

  update();

  background(255);

  // draw my pose
  drawKeypoints(myPose, colors.x);
  drawSkeleton(myPose, colors.x);

  // make sure we have a partner pose before drawing
  if (partnerPose !== null) {
    drawKeypoints(partnerPose, colors.y);
    drawSkeleton(partnerPose, colors.y);
  }

  stroke(0);
  text(getFrameRate(), 10, 10);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints(poses, clr) {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(clr);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton(poses, clr) {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(clr);
      line(
        partA.position.x,
        partA.position.y,
        partB.position.x,
        partB.position.y,
      );
    }
  }
}
