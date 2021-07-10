// p5 code goes here

// include this for to use autofill in vscode
// see https://stackoverflow.com/questions/30136319/what-is-reference-path-in-vscode
/// <reference path="../shared/p5.d/p5.d.ts" />
/// <reference path="../shared/p5.d/p5.global-mode.d.ts" />

let myMousePosition = {};
let otherUsers = [];
let spw;
let newData;

const size = 50;

function setup() {
  createCanvas(500, 500);
  frameRate(60); // try 30 if latency
  colorMode(HSB, 255);

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
  spw = new SimplePeerWrapper();
  spw.connect();
  spw.on('data', gotData);
}

function gotData(data) {
  newData = data;
}

function draw() {
  // only proceed if the peer is started
  if (!spw.isConnectionStarted()) {
    return;
  }

  // get and send my mouse position over peer
  myMousePosition = { x: mouseX, y: mouseY };
  spw.send(myMousePosition);

  if (typeof newData === 'undefined') {
    console.log('returning ');
    return;
  }

  let foundMatch = false;

  // see if the data is from a user that already exists
  for (let i = 0; i < otherUsers.length; i++) {
    // if the user exists
    if (newData.userId === otherUsers[i].userId) {
      // update their position
      otherUsers[i].position = newData.data;
      // we found a match!
      foundMatch = true;
    }
  }

  // if the user doesn't exist
  if (!foundMatch) {
    // create a new user
    let newUser = {
      userId: newData.userId,
      position: newData.data,
      color: random(50, 150),
    };

    // add them to the array
    otherUsers.push(newUser);
  }

  // make sure we have at least one partner before drawing
  if (otherUsers.length < 1) return;

  // use some opacity on background for trails
  background(255, 50);
  noStroke();

  // draw my mouse
  fill(25, 255, 255);
  ellipse(myMousePosition.x, myMousePosition.y, size, size);

  // draw all the other mice
  for (let i = 0; i < otherUsers.length; i++) {
    fill(otherUsers[i].color, 255, 255);
    ellipse(
      otherUsers[i].position.x,
      otherUsers[i].position.y,
      size,
      size,
    );
  }
}

// Close simple-peer connections before exiting
window.onbeforeunload = () => {
  spw.close();
};
