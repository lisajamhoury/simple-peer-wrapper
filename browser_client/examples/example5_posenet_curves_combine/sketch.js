// WebRTC Simple Peer Example — Posenet Curves With Interaction
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to interact on the same p5 canvas
// using posenet via ml5. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// See readme.md for additional instructions

// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Peer variables
let startPeer;

// Posenet variables
let video;
let poseNet;

// Objects to hold poses
let myPose = {};
let partnerPose = {};

// Objects to hold edges
let myEdges = { left: 0, right: 0 };
let partnerEdges = { left: 0, right: 0 };

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Use for developing without partner
// This will mirror one user's pose
// and will ingnore the pose over peer connection
const mirror = true;

// Globals for growing animation
const origSize = 10;
let size = origSize;

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
  //   flipHorizontal: true,
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

      // Get the leftmost and rightmost points of the partner pose
      partnerEdges = getEdges(partnerPose);
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

  // Check if the two poses are touching, returns true or false
  const touching = checkEdges(myEdges, partnerEdges);

  // Draw white background
  background(0);

  // Put the keypoints in drawing order
  orderKeypoints(myPose, myOrderedPose);
  orderKeypoints(partnerPose, partnerOrderedPose);

  // If the poses are touching
  if (touching) {
    // Combine the poses
    const combinedPoses = combinePoses(
      myOrderedPose,
      partnerOrderedPose,
      myEdges,
      partnerEdges,
    );

    // Remove any keypoints that are not used
    const cleanCombinedPose = removeUnusedKeypoints(combinedPoses);

    // Draw the combined body
    drawCurvedBody(cleanCombinedPose);

    // If the poses are not touching
  } else {
    // Remove any keypoints that are not used
    const cleanedMyPose = removeUnusedKeypoints(myOrderedPose);
    const cleanedPartnerPose = removeUnusedKeypoints(
      partnerOrderedPose,
    );

    // Draw my pose and my partner pose as curved shapes
    drawCurvedBody(cleanedMyPose);
    drawCurvedBody(cleanedPartnerPose);
  }

  // Use for debugging
  drawEdges(); // draws left and right edge of poses
  // drawFramerate();
  // drawMyVideo();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Get pose from posenet and send pose over peer connection
function getPose(poses) {
  // We're using single detection so we'll only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Get the leftmost and rightmost points of my pose
  myEdges = getEdges(myPose);

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

// Find the leftmost and rightmost points on the pose
function getEdges(pose) {
  // An object to hold the leftmost point
  let leftMost = {};
  // Start the leftMost point at the right of the canvas
  leftMost.x = width;

  // An object to hold the rightmost point
  let rightMost = {};
  // Start the rightMost point at the left of the canvas
  rightMost.x = 0;

  // Get the keypoints
  const keypoints = pose.pose.keypoints;

  // Iterate through all the keypoints
  for (let i = 0; i < keypoints.length; i++) {
    // Get the current keypoint
    const keypoint = keypoints[i];
    // If the confidence score is high enough
    if (keypoint.score > scoreThreshold) {
      // Get the keypoint position
      const pos = keypoint.position;

      // If the keypoint position is farther left than the current left point
      if (pos.x < leftMost.x) {
        // Set the leftmost to the current keypoint
        leftMost.x = pos.x;
        leftMost.y = pos.y;
      }

      // If the keypoint position is farther right than the current right point
      if (pos.x > rightMost.x) {
        // Set the rightmost to the current keypoint
        rightMost.x = pos.x;
        rightMost.y = pos.y;
      }
    }
  }

  // Return the edges
  return { left: leftMost, right: rightMost };
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

// Combine the keypoints of the two poss
function combinePoses(pose1, pose2, edges1, edges2) {
  // Creat an array to hold the combined poses
  let combinedPose = [];

  // Create variables to hold each side of the combined pose
  let leftSide;
  let rightSide;

  // If pose1 is on the left side
  if (edges1.left.x < edges2.left.x) {
    // Put pose1 points in the left of the combined pose
    leftSide = _.cloneDeep(pose1);
    // And pose2 on the right side
    rightSide = _.cloneDeep(pose2);
  } else {
    // Otherwise, put pose2 on the left side
    leftSide = _.cloneDeep(pose2);
    // ANd pose1 on the right side
    rightSide = _.cloneDeep(pose1);
  }

  // Get first half of keypoints from the left side of one pose
  for (let i = 0; i < 7; i++) {
    combinedPose.push(leftSide[i]);
  }

  // If mirroring
  if (mirror) {
    // Repeat the leftside, backwards ¯\_(ツ)_/¯
    for (let i = 6; i >= 0; i--) {
      combinedPose.push(rightSide[i]);
    }
    // Othwerwise
  } else {
    // Get the second half of the keypoints from the right side of the other pose
    for (let i = 7; i < 14; i++) {
      combinedPose.push(rightSide[i]);
    }
  }

  // Return the combined pose
  return combinedPose;
}

// Draw a curved shape with the posenet points
function drawCurvedBody(pose) {
  // Make sure we have points in the pose array
  if (pose.length === 0) return;

  // Draw a white outline
  noFill();
  stroke(255);

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

  // Get the left and right edges of the partner's pose
  partnerEdges = getEdges(partnerPose);
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

// Check if users are overlapping
function checkEdges(edge1, edge2) {
  let touching = false;

  // Check if user 1 leftmost part is between left- and rightmost parts of user 2
  if (edge1.left.x > edge2.left.x && edge1.left.x < edge2.right.x) {
    touching = true;
  }

  // Check if user 2 rightmost part is between left- and rightmost parts of user 2
  if (edge1.right.x > edge2.left.x && edge1.right.x < edge2.right.x) {
    touching = true;
  }

  // Return true or false
  return touching;
}

// Draw the left and right edges for debugging
function drawEdges() {
  fill('red');
  ellipse(myEdges.left.x, myEdges.left.y, 20);
  ellipse(partnerEdges.left.x, partnerEdges.left.y, 20);

  fill('green');
  ellipse(myEdges.right.x, myEdges.right.y, 20);
  ellipse(partnerEdges.right.x, partnerEdges.right.y, 20);
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
