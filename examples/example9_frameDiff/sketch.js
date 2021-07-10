// WebRTC Simple Peer Example — Frame Difference over webRTC
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example combines two users images on the same p5 canvas
// using webRTC peer connections. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.

// p5 code goes here

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// global variables
let myWebCam;
let pastPixels = [];
let thresholdSlider;
let sendCanvas;
let partnerImage;
let combinedImg;

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas the size of my webcam
  createCanvas(640, 480);

  // create webcam then hide it
  myWebCam = createCapture(VIDEO);
  myWebCam.size(width, height);
  myWebCam.hide();

  // slider controls the threshold, how much pixel change is considered change
  thresholdSlider = createSlider(0, 255, 50);

  // create empty images for partner image and combined image
  partnerImg = createImage(width, height);
  combinedImg = createImage(width, height);

  // Fix the framerate to throttle data sending and receiving
  // try 30 fps if there is latency
  frameRate(60);

  // Set to true to turn on logging for the webrtc client
  WebRTCPeerClient.setDebug(false);

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

// Draw() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function draw() {
  // Only proceed if the peer connection is started
  if (!WebRTCPeerClient.isPeerStarted()) {
    console.log('waiting for peer to start');
    return;
  }

  processMyWebcam(myWebCam);
  getPartnerImage();

  image(combinedImg, 0, 0, width, height);
}

function processMyWebcam(webcam) {
  // load webcam pixels
  // if this is not familiar watch this coding train video
  // https://www.youtube.com/watch?v=nMUMZ5YRxHI
  webcam.loadPixels();
  const currentPixels = webcam.pixels;

  // get the threshold value
  let threshValue = thresholdSlider.value();

  // loop through webcam pixels
  for (let i = 0; i < currentPixels.length; i += 4) {
    // get the difference between the last frame and the current frame
    // for each channel of the image: r, g, b, channels
    const rDiff = abs(currentPixels[i + 0] - pastPixels[i + 0]);
    const gDiff = abs(currentPixels[i + 1] - pastPixels[i + 1]);
    const bDiff = abs(currentPixels[i + 2] - pastPixels[i + 2]);

    // set past pixels to current pixels
    // do this before we alter the current pixels in the coming lines of code
    pastPixels[i + 0] = currentPixels[i + 0];
    pastPixels[i + 1] = currentPixels[i + 1];
    pastPixels[i + 2] = currentPixels[i + 2];
    pastPixels[i + 3] = currentPixels[i + 3];

    // get the average difference for the pixel from the 3 color channels
    const avgDiff = (rDiff + gDiff + bDiff) / 3; // 0-255

    // if the difference between frames is less than the threshold value
    if (avgDiff < threshValue) {
      // turn the current pixel black
      currentPixels[i + 0] = 0;
      currentPixels[i + 1] = 0;
      currentPixels[i + 2] = 0;
      currentPixels[i + 2] = 0; // transparent
    } else {
      // otherwise, turn it a soft red
      currentPixels[i + 0] = 255;
      currentPixels[i + 1] = 200;
      currentPixels[i + 2] = 200;
      // an alpha of 100 creates some nice smoothing
      currentPixels[i + 3] = 255;
    }
  }

  // update pixels
  // if this is not familiar watch the coding train video referenced above
  webcam.updatePixels();

  // send the webcam over the peer connection
  sendMyWebcam(webcam);
}

function sendMyWebcam(webcam) {
  // create a canvas
  sendCanvas = createGraphics(width, height);
  // mirror the canvas drawing
  sendCanvas.translate(width, 0);
  sendCanvas.scale(-1, 1);
  // draw the webcam image on the canvas
  sendCanvas.image(webcam, 0, 0, width, height);

  // get a dataurl from the canvas
  // make it a lossless webp
  const myDataUrl = sendCanvas.canvas.toDataURL('image/webp', 1.0);

  // send the dataurl over the peer connection
  WebRTCPeerClient.sendData(myDataUrl);
}

function getPartnerImage() {
  // get incoming data from peer
  const newData = WebRTCPeerClient.getData();

  // create a local variable for the incoming dataurl
  let partnerDataUrl;

  // if there is no data return
  if (newData === null) {
    return;
    // If there is data
  } else {
    // Get the dataurl from newData.data
    // Note: newData.data is the data sent by user
    // Note: newData.userId is the peer ID of the user
    partnerDataUrl = newData.data;
  }

  // loading an image is asynchronous,
  // so we need to load it like this
  loadImage(partnerDataUrl, (pImg) => combineImages(pImg));
}

function combineImages(pImg) {
  {
    // get the pixels from my image, partner image, and an empty image
    combinedImg.loadPixels();
    pImg.loadPixels();
    sendCanvas.loadPixels();

    // go through all the pixels
    for (let i = 0; i < combinedImg.pixels.length; i += 4) {
      if (pImg.pixels[i] > 0 && sendCanvas.pixels[i] > 0) {
        // if both partners are on the pixel, make it white
        combinedImg.pixels[i] = 255;
        combinedImg.pixels[i + 1] = 255;
        combinedImg.pixels[i + 2] = 255;
        combinedImg.pixels[i + 3] = 255;
      } else if (pImg.pixels[i] > 0) {
        // partner pixels are red
        combinedImg.pixels[i] = 255;
        combinedImg.pixels[i + 1] = 200;
        combinedImg.pixels[i + 2] = 200;
        combinedImg.pixels[i + 3] = 100;
      } else if (sendCanvas.pixels[i] > 0) {
        // my pixels are blue
        combinedImg.pixels[i] = 200;
        combinedImg.pixels[i + 1] = 200;
        combinedImg.pixels[i + 2] = 255;
        combinedImg.pixels[i + 3] = 100;
      } else {
        // none is black
        combinedImg.pixels[i] = 0;
        combinedImg.pixels[i + 1] = 0;
        combinedImg.pixels[i + 2] = 0;
        combinedImg.pixels[i + 3] = 255;
      }
    }

    // update all the pixels
    pImg.updatePixels();
    sendCanvas.updatePixels();
    combinedImg.updatePixels();
  }
}
