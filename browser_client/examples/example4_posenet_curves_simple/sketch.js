// WebRTC Simple Peer Example — Posenet Curves Simple
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to interact on the same p5 canvas
// using posenet via ml5. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// See readme.md for additional instructions

// p5 code goes here

// Include this for to use autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
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

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Use for developing without partner
// This will mirror one user's pose
// and will ingnore the pose over peer connection
const mirror = true;

// Globals for growing animation
const origSize = 10;
let size = origSize;

// Color palette
const colors = {
  x: 'rgba(200, 63, 84, 0.5)',
  y: 'rgba(49, 128, 144, 0.5)',
  z: 'rgba(82, 100, 118, 0.5)',
};

// Create an array with keypoints ordered correctly to make a shape
let myOrderedPose = [
  { part: 'leftAnkle', position: { x: null, y: null } },
  { part: 'leftKnee', position: { x: null, y: null } },
  { part: 'leftHip', position: { x: null, y: null } },
  { part: 'leftWrist', position: { x: null, y: null } },
  { part: 'leftElbow', position: { x: null, y: null } },
  { part: 'leftShoulder', position: { x: null, y: null } },
  { part: 'leftEar', position: { x: null, y: null } },
  { part: 'rightEar', position: { x: null, y: null } },
  { part: 'rightShoulder', position: { x: null, y: null } },
  { part: 'rightElbow', position: { x: null, y: null } },
  { part: 'rightWrist', position: { x: null, y: null } },
  { part: 'rightHip', position: { x: null, y: null } },
  { part: 'rightKnee', position: { x: null, y: null } },
  { part: 'rightAnkle', position: { x: null, y: null } },
];

// Make the same array for my partner
// Use lodash to deep clone
// See https://lodash.com/docs#cloneDeep
let partnerOrderedPose = _.cloneDeep(myOrderedPose);

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Create p5 canvas
  createCanvas(640, 480);

  // Create and hide webcam capture for posenet
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

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

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // To connect to server remotely pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  // WebRTCPeerClient.initSocketClient('https://xxxxxxxxxxxxx.ngrok.io');

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
  // Get partner pose from peer connection
  if (!mirror) {
    // Get the incoming data from the peer connection
    const newData = WebRTCPeerClient.getData();

    // Check if there's anything in the data;
    if (newData === null) {
      return; // If nothing, return
      // If there is data
    } else {
      // Get the pose data from newData.data
      // Note: newData.data is the data sent by user
      // Note: newData.userId is the peer ID of the user
      partnerPose = newData.data;
    }
    // If mirror is true, mirror my pose.
    // Use this for testing/developing
  } else {
    mirrorPoseAndSkeleton();
  }

  // If partner data is empty
  if (partnerPose === null) {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  // Put the keypoints in drawing order
  orderKeypoints(myPose, myOrderedPose);
  orderKeypoints(partnerPose, partnerOrderedPose);

  // Remove any keypoints that are not used
  const cleanedMyPose = removeUnusedKeypoints(myOrderedPose);
  const cleanedPartnerPose = removeUnusedKeypoints(
    partnerOrderedPose,
  );

  // Draw white background
  background(255);

  // Draw my pose and my partner pose as curved shapes
  drawCurvedBody(cleanedMyPose, colors.x);
  drawCurvedBody(cleanedPartnerPose, colors.y);

  // Use for debugging
  // drawFramerate();
  // drawMyVideo();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Get pose from posenet and send pose over peer connection
function getPose(poses) {
  // We're using single detection so we only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

// Put keypoints in drawing order
function orderKeypoints(pose, orderedPose) {
  // Get the keyoints from the pose
  const keypoints = pose.pose.keypoints;
  // Go through all of the keypoints
  for (let j = 0; j < keypoints.length; j++) {
    // Get the current keypoint
    const keypoint = pose.pose.keypoints[j];
    // If the keypoint confidence score is high enough
    if (keypoint.score > scoreThreshold) {
      // Go through the ordered pose array
      for (let k = 0; k < orderedPose.length; k++) {
        // Find the keypoint in the ordered pose array by name
        if (orderedPose[k].part === keypoint.part) {
          // Add the keypoint position to the ordered pose array
          orderedPose[k].position = keypoint.position;
        }
      }
    }
  }
}

// Get rid of any keypoints that are not being used
function removeUnusedKeypoints(pose) {
  // Create an array to hold the used keypoints
  let cleanPose = [];
  // Iterate through each keypoint
  for (let i = 0; i < pose.length; i++) {
    // If the position exists for the keypoint
    if (pose[i].position.x !== null) {
      // Add the position to the keypoint in the clean array
      cleanPose.push({
        position: {
          x: pose[i].position.x,
          y: pose[i].position.y,
        },
      });
    }
  }

  // Return the clean array
  return cleanPose;
}

// Draw a curved shape with the posenet points
function drawCurvedBody(pose, clr) {
  // Make sure we have points in the pose array
  if (pose.length === 0) return;

  // Use the given color to draw the pose
  fill(clr);
  stroke(clr);

  // Begin drawing the shape
  // See p5 reference https://p5js.org/reference/#/p5/beginShape
  beginShape();

  // Go through all of the keypoints in the array
  // Add 3 extra points to complete the curved shaped
  for (let i = 0; i < pose.length + 3; i++) {
    // Get the index
    let index = i;
    // If the index is beyond the length of the array
    if (i >= pose.length) {
      // Use modulo to iterate through the additional points needed to complete the curve
      index = i % pose.length;
    }
    // Add the curve vertex to the shape
    curveVertex(pose[index].position.x, pose[index].position.y);
  }
  // Close and draw the shape
  endShape();
}

// Used in mirroring mode
function mirrorPoseAndSkeleton() {
  // Use lodash to deep clone my pose
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
    // Get the keypoint
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Reverse the keypoint by subtracting the x from the width
    keypoint.position.x = width - keypoint.position.x;
  }
}

// A function to mirror the pose for testing with one person
function mirrorSkeleton(skeleton) {
  // We need to keep track of which parts are mirrored because
  // posenet duplicates parts within the pose object
  let mirroredParts = [];

  // Check that there are parts, if not return
  if (skeleton.length < 1) return;

  // Loop through all skeleton connections
  for (let i = 0; i < skeleton.length; i++) {
    // Get the joints
    const jointA = skeleton[i][0];
    const jointB = skeleton[i][1];

    // Check if the joint is mirrored already
    const jointAMirrored = mirroredParts.includes(jointA.part);

    // If the joint is not mirrored, mirror jointA
    if (!jointAMirrored) {
      jointA.position.x = width - jointA.position.x;
    }

    // Check if the joint is mirrored already
    const jointBMirrored = mirroredParts.includes(jointB.part);

    // If the joint is not mirrored, mirror jointB
    if (!jointBMirrored) {
      jointB.position.x = width - jointB.position.x;
    }

    // Add mirrored joints to array
    mirroredParts.push(jointA.part);
    mirroredParts.push(jointB.part);
  }
}

// Draw framerate, use in draw for debugging
function drawFramerate() {
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}

// Draw webcam, use in draw for debugging
function drawMyVideo() {
  push();
  translate(0.25 * width, 0);
  // Make the video small
  scale(-0.25, 0.25);
  image(video, 0, 0, width, height);
  pop();
}

// Press any key to stop the sketch
function keyPressed() {
  noLoop();
}
