// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// variable to hold all poses
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
    return;
  }

  getOtherPoses();

  // make sure we have two poses before drawing
  if (allPoses.length < 2) {
    return;
  }

  background(255, 50);
  noStroke();

  //  draw all poses
  drawAllPoses();
}

function initPosenet() {
  // Create webcam capture for posenet
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
}

function initPeer() {
  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  WebRTCPeerClient.initSocketClient();

  // To connect to server over public internet pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  // const options = {
  //   serverUrl: 'https://9bf0ae2ca82a.ngrok.io',
  // };
  // WebRTCPeerClient.initSocketClient(options);

  // Start the peer client
  WebRTCPeerClient.initPeerClient();
}

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Function to get and send pose from posenet
function getPose(poses) {
  // check the pose array
  // if my pose isn't there yet
  // make me the first user in the array
  if (allPoses.length === 0) {
    let newUser = {
      userId: 1, // give myself an arbitrary id
      pose: poses[0], // get first pose from posenet array
      color: random(0, 255), // give me a random color
    };
    allPoses.push(newUser); // add to array
  } else {
    // otherwise, update my position
    allPoses[0].pose = poses[0];
  }

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(allPoses[0].pose);
  }
}

function getOtherPoses() {
  // get new data from peer
  const newData = WebRTCPeerClient.getData();

  // make sure there's data
  if (newData === null) {
    return;
  }

  let foundMatch = false;

  // see if the data is from a user that already exists
  for (let i = 0; i < allPoses.length; i++) {
    // if the user exists
    if (newData.userId === allPoses[i].userId) {
      // update their pose
      allPoses[i].pose = newData.data;
      // we found a match!
      foundMatch = true;
    }
  }

  // if the user doesn't exist
  if (!foundMatch) {
    // create a new user
    let newUser = {
      userId: newData.userId,
      pose: newData.data,
      color: random(0, 255),
    };
    // add them to the array
    allPoses.push(newUser);
  }
}

function drawAllPoses() {
  // how many poses do we have
  const numPlayers = allPoses.length;

  // how much space do they each get
  const pWidth = width / numPlayers;

  // check if everyone has their hands up!
  let handsAtTop = true;

  // double check we have poses
  if (allPoses.length > 0) {
    // go through all the poses
    for (let i = 0; i < allPoses.length; i++) {
      // ge the color
      const newColor = color(allPoses[i].color, 255, 255);

      // check that the hands are up
      // if anyone has their hands down, this becomes false
      if (handsAtTop) {
        handsAtTop = checkHands(allPoses[i].pose);
      }

      // use the user's color
      fill(newColor);
      // draw a rectanble for the pose
      rect(i * pWidth, 0, pWidth, height);

      // get the user's pose
      const currentPose = allPoses[i].pose;

      // draw the pose
      drawKeypoints(currentPose, 'white', i, numPlayers, pWidth);
    }
  }

  // if everyone has their hands up
  // tell them they did a good job!
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
  // get left and right hands
  const lHandY = pose.pose.leftWrist.y;
  const rHandY = pose.pose.rightWrist.y;

  let atTop = true;

  // if either hand is not up, then hands are down
  if (lHandY > 100 || rHandY > 100) {
    atTop = false;
  }

  // return true or false
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
      ellipse(newX, newY, size, size);
    }
  }
}
