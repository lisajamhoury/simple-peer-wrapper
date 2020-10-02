// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// peer variables
let startPeer;

let allPoses = [];

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

// Posenet variables
let video;
let poseNet;

// Size of joints
const size = 10;

function setup() {
  createCanvas(800, 800);
  frameRate(60);
  colorMode(HSB, 255);

  initPosenet();
  initPeer();
}

function draw() {
  // only proceed if the peer is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    console.log('waiting for peer to start');
    return;
  }

  // make sure we have our pose before going on
  if (allPoses.length === 0) {
    console.log('waiting for my pose');
    return;
  }

  getOtherPoses();

  // make sure we have two poses before drawing
  if (allPoses.length < 2) {
    console.log('waiting for other poses');
    return;
  }

  background(255, 50);
  noStroke();

  //  draw all poses
  drawAllPoses();
}

function drawAllPoses() {
  const numPlayers = allPoses.length;

  const pWidth = width / numPlayers;

  let handsAtTop = true;

  if (allPoses.length > 0) {
    for (let i = 0; i < allPoses.length; i++) {
      const newColor = color(allPoses[i].color, 255, 255);

      if (handsAtTop) {
        handsAtTop = checkHands(allPoses[i].pose);
      }

      fill(newColor);
      rect(i * pWidth, 0, pWidth, height);
      const currentPose = allPoses[i].pose;
      drawKeypoints(currentPose, 'white', i, numPlayers, pWidth);
    }
  }

  // console.log('attop' + handsAtTop);
  if (handsAtTop) {
    fill(45, 255, 255);
    rect(0, 0, width, height);
    fill(255);

    textSize(70);
    textAlign(CENTER);
    text('Wow! Great Teamwork!', width / 2, height / 2);
  }
}

function checkHands(pose) {
  const lHandY = pose.pose.leftWrist.y;
  const rHandY = pose.pose.rightWrist.y;

  let atTop = true;

  if (lHandY > 100 || rHandY > 100) {
    atTop = false;
  }

  return atTop;
}

// A function to draw ellipses over the detected keypoints
// Include an offset if testing by yourself
// And you want to offset one of the skeletons
function drawKeypoints(pose, clr, index, numPlayers, pWidth) {
  // rect(i * playerW, 0, playerW, height);

  const keypoints = pose.pose.keypoints;
  // Loop through all keypoints
  for (let j = 0; j < keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > scoreThreshold) {
      const newX = keypoint.position.x / numPlayers + pWidth * index;
      const newY = keypoint.position.y / numPlayers;

      fill(clr);
      noStroke();
      ellipse(
        newX, // Offset useful if testing on your own
        newY,
        size,
        size,
      );
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
  console.log('starting peer');
  // Start socket client automatically on load
  // by default it connects to http://localhost:80
  // WebRTCPeerClient.initSocketClient();

  // to connect to server over public internet pass the ngrok address
  WebRTCPeerClient.initSocketClient('https://7842668a81f8.ngrok.io');

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

  if (allPoses.length === 0) {
    let newUser = {
      userId: 1, // how to get my id?
      pose: poses[0],
      color: random(0, 255),
    };
    allPoses.push(newUser);
  } else {
    allPoses[0].pose = poses[0];
  }

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(allPoses[0].pose);
  }
}

function getOtherPoses() {
  const newData = WebRTCPeerClient.getData();
  if (newData === null) {
    return;
  }

  let foundMatch = false;

  for (let i = 0; i < allPoses.length; i++) {
    if (newData.userId === allPoses[i].userId) {
      allPoses[i].pose = newData.data;
      foundMatch = true;
    }
  }

  if (!foundMatch) {
    let newUser = {
      userId: newData.userId,
      pose: newData.data,
      color: random(0, 255),
    };
    allPoses.push(newUser);
  }
}
