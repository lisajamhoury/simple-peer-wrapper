// WebRTC Simple Peer Example — Mouse over webRTC
// https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
// Created for The Body Everywhere and Here
// https://github.com/lisajamhoury/The-Body-Everywhere-And-Here/

// This example allows for two users to draw on the same p5 canvas
// using webRTC peer connections. By default it runs over localhost.
// Use with ngrok pointing to localhost:80 to run over the public internet.
// Use keys 1-4 to switch between four animation states

// p5 code goes here

// Include this for to use p5 autofill in vscode
// See https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

// Peer variables
let startPeer;

// Use for developing without partner
// This will mirror one user's mouse
// and will ingnore the mouse over peer connection
const mirror = true;

let myVideo;
let pastPixels = [];
let thresholdSlider;

let sendCanvas;
let partnerCanvas;
let partnerImage;
let combinedImg;

// Setup() is a p5 function
// See this example if this is new to you
// https://p5js.org/examples/structure-setup-and-draw.html
function setup() {
  // Make a p5 canvas 500 pixels wide and 500 pixels high
  createCanvas(640, 480);

  myVideo = createCapture(VIDEO);
  myVideo.size(width, height);
  myVideo.hide();

  thresholdSlider = createSlider(0, 255, 50);

  partnerCanvas = createGraphics(width, height);
  partnerImg = createImage(width, height);
  combinedImg = createImage(width, height);
  // Fix the framerate to throttle data sending and receiving
  frameRate(60);

  // Set to true to turn on logging for the webrtc client
  WebRTCPeerClient.setDebug(false);

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  // WebRTCPeerClient.initSocketClient();

  // To connect to server over public internet pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  WebRTCPeerClient.initSocketClient('https://17af03341f19.ngrok.io');

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

  myVideo.loadPixels();
  const currentPixels = myVideo.pixels;
  let threshValue = thresholdSlider.value();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // get the current position (index) in the array
      // if this is new to you watch the coding train video referenced above
      const i = (y * width + x) * 4;

      // get the difference between the new last frame and the current frame
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
        currentPixels[i + 0] = 255; // to show the natural video color
        currentPixels[i + 1] = 200; // comment out
        currentPixels[i + 2] = 200; // these three lines
        // an alpha of 100, which creates some nice smoothing
        currentPixels[i + 3] = 255;
      }
    }
  }

  // update pixels
  // if this is not familiar watch the coding train video referenced above
  myVideo.updatePixels();

  sendCanvas = createGraphics(width, height);
  sendCanvas.translate(width, 0);
  sendCanvas.scale(-1, 1);
  sendCanvas.image(myVideo, 0, 0, width, height);
  // image(sendCanvas, 0, 0, width, height);

  const myDataUrl = sendCanvas.canvas.toDataURL('image/webp', 1.0);
  // console.log('sending data');
  WebRTCPeerClient.sendData(myDataUrl);

  const newData = WebRTCPeerClient.getData();
  let partnerDataUrl;

  if (newData === null) {
    console.log('data is null');
    return;
    // If there is data
  } else {
    // console.log('getting data');
    // Get the mouse data from newData.data
    // Note: newData.data is the data sent by user
    // Note: newData.userId is the peer ID of the user
    partnerDataUrl = newData.data;
  }

  loadImage(partnerDataUrl, (pImg) => {
    combinedImg.loadPixels();
    pImg.loadPixels();
    sendCanvas.loadPixels();

    for (let i = 0; i < combinedImg.pixels.length; i += 4) {
      if (pImg.pixels[i] > 0 && sendCanvas.pixels[i] > 0) {
        combinedImg.pixels[i] = 255;
        combinedImg.pixels[i + 1] = 255;
        combinedImg.pixels[i + 2] = 255;
        combinedImg.pixels[i + 3] = 255;
      } else if (pImg.pixels[i] > 0) {
        combinedImg.pixels[i] = 255;
        combinedImg.pixels[i + 1] = 200;
        combinedImg.pixels[i + 2] = 200;
        combinedImg.pixels[i + 3] = 100;
      } else if (sendCanvas.pixels[i] > 0) {
        combinedImg.pixels[i] = 200;
        combinedImg.pixels[i + 1] = 200;
        combinedImg.pixels[i + 2] = 255;
        combinedImg.pixels[i + 3] = 100;
      } else {
        combinedImg.pixels[i] = 0;
        combinedImg.pixels[i + 1] = 0;
        combinedImg.pixels[i + 2] = 0;
        combinedImg.pixels[i + 3] = 255;
      }
    }

    pImg.updatePixels();
    sendCanvas.updatePixels();
    combinedImg.updatePixels();
    console.log('drawing image');

    // partnerCanvas.image(img, 0, 0);
  });

  image(combinedImg, 0, 0, width, height);

  // image(myVideo, 0, 0, width, height);

  // loadImage(partnerDataUrl, (img) => {
  //   img.loadPixels();
  //   partnerImage.loadPixels();

  //   for (let i = 0; i < img.pixels.length; i++) {
  //     partnerImage.pixels[i] = img.pixels[i];
  //   }

  //   partnerImage.updatePixels();

  //   // partnerCanvas.image(img, 0, 0);
  // });

  // partnerCanvas.image(partnerImage, 0, 0, width, height);

  // translate(width, 0);
  // scale(-1, 1);
  // tint(255, 100);
  // image(partnerCanvas, 0, 0, width, height);
}
