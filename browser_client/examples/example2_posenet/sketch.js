// p5 code goes in this file

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;

// posenet variables
let video;
let poseNet;

// hold poses
let myPose = {};
let partnerPose = {};

// hold noses
let myNose;
let partnerNose;

// confidence threshold for keypoints
const scoreThreshold = 0.5;

// what example are we running?
let state = 1;

// use for developing without partner
let mirror = false;

const origSize = 10;
let size = origSize;

const colors = {
  x: 'rgba(255,0,0,1.0)',
  y: 'rgba(0,255,0,1.0)',
  // x: 'rgba(0, 63, 84, 0.5)',
  // y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

function setup() {
  // create p5 canvas
  createCanvas(640, 480);

  // create webcam capture for posenet
  video = createCapture(VIDEO);
  video.size(width, height);

  // Use for slower computers
  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    maxPoseDetections: 5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  // use for faster computers
  // const options = {
  //   architecture: 'ResNet50',
  //   outputStride: 32,
  //   detectionType: 'single',
  //  flipHorizontal: true,
  //   quantBytes: 2,
  // };

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, options, modelReady);

  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', (results) => getPose(results));

  // Hide the video element, and just show the canvas
  video.hide();

  // start socket client automatically on load
  // by default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // to connect to server remotely pass the ngrok address
  // WebRTCPeerClient.initSocketClient('https://6ed3b38dbb28.ngrok.io');

  // start the peer client
  WebRTCPeerClient.initPeerClient();
}

function getPose(poses) {
  // we're doing single detection so we'll only have one pose
  myPose = poses[0];

  // send my pose over peer
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

function modelReady() {
  console.log('Model Loaded');
}

function draw() {
  // only proceed if the peer is started
  // and if we have a pose from posenet
  if (
    !WebRTCPeerClient.isPeerStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning!');
    return;
  }

  // update

  // to test with one mirrored mouse
  if (mirror) {
    // use lodash to deep clone my pose
    // see https://lodash.com/docs#cloneDeep
    partnerPose.pose = _.cloneDeep(myPose.pose);
    partnerPose.skeleton = _.cloneDeep(myPose.skeleton);

    mirrorPose(partnerPose.pose);
    mirrorSkeleton(partnerPose.skeleton);
  } else {
    partnerPose = WebRTCPeerClient.getData();
  }

  if (partnerPose !== null) {
    myNose = getNose(myPose, false);
    partnerNose = getNose(partnerPose, true);
  } else {
    console.log('waiting for partner');
    return;
  }

  // draw

  background(255);

  // draw my pose
  drawKeypoints(myPose, colors.x, 0);
  drawSkeleton(myPose, colors.x, 0);

  // make sure we have a partner pose before drawing
  if (partnerPose !== null) {
    drawKeypoints(partnerPose, colors.y, 0);
    drawSkeleton(partnerPose, colors.y, 0);
  }

  // if our noses are touching
  if (touching(myNose, partnerNose)) {
    console.log('touching');
    // make us disappear
    //background(255);
    size *= 1.01;
  } else {
    size = origSize;
  }

  // draw framerate
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}

function getNose(pose, mirror) {
  if (mirror) pose.pose.nose.x = width - pose.pose.nose.x;

  return pose.pose.nose;
}

function touching(nose1, nose2) {
  // get the distance between the two noses
  const d = dist(nose1.x, nose1.y, nose2.x, nose2.y);

  // if the distance is less than 50 we are touching!
  if (d < 50) {
    return true;
  }

  // otherwise we are not touching!
  return false;
}

// Maybe remove offset once sketch is finished!
// A function to draw ellipses over the detected keypoints
function drawKeypoints(pose, clr, offset) {
  // loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > scoreThreshold) {
      fill(clr);
      noStroke();
      ellipse(
        keypoint.position.x + offset,
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
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];

    if (
      partA.score > scoreThreshold &&
      partB.score > scoreThreshold
    ) {
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

function keyPressed() {
  noLoop();
}

// A function to mirror the pose for testing with one person
function mirrorPose(pose) {
  // loop through all keypoints
  for (let j = 0; j < pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // reverse keypoint
    keypoint.position.x = width - keypoint.position.x;
  }
}

function mirrorSkeleton(skeleton) {
  let mirroredParts = [];

  // check if there are any parts to connect
  if (skeleton.length < 1) return;

  // Loop through all body connections
  for (let i = 0; i < skeleton.length; i++) {
    // get the joints
    const jointA = skeleton[i][0];
    const jointB = skeleton[i][1];

    // check if the part is mirrored already
    const jointAMirrored = mirroredParts.includes(jointA.part);

    // mirror jointA
    if (!jointAMirrored) {
      jointA.position.x = width - jointA.position.x;
    }

    // check if the part is mirrored already
    const jointBMirrored = mirroredParts.includes(jointB.part);

    // mirror joint B
    if (!jointBMirrored) {
      jointB.position.x = width - jointB.position.x;
    }

    // Add mirrored joints to array
    mirroredParts.push(jointA.part);
    mirroredParts.push(jointB.part);
  }
}
