// p5 code goes here
let startPeer;
let partnerMousePosition;

function setup() {
  createCanvas(500, 500);
  frameRate(30);

  startPeer = createButton('Start Peer');
  startPeer.mousePressed(WebRTCPeerClient.init);
}

function draw() {
  background(0, 50);
  noStroke();
  //   console.log(WebRTCPeerClient.isPeerStarted());
  if (WebRTCPeerClient.isPeerStarted()) {
    const myMousePosition = { x: mouseX, y: mouseY };

    WebRTCPeerClient.sendData(myMousePosition);

    partnerMousePosition = WebRTCPeerClient.getData();

    fill(100);
    circle(myMousePosition.x, myMousePosition.y, 20);

    if (partnerMousePosition !== null) {
      //   console.log(partnerMousePosition.x);
      fill(200);
      circle(
        partnerMousePosition.x + 100,
        partnerMousePosition.y + 100,
        40,
      );
    }
  }
  //   fill(100);
  //   circle(mouseX, mouseY, 20);
}
