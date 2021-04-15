const WebRTCPeerClient = require('./webrtc_peer_client.js');

module.exports = {
  initSocketClient: WebRTCPeerClient.initSocketClient,
  initPeerClient: WebRTCPeerClient.initPeerClient,
  isInitiator: WebRTCPeerClient.isInitiator,
  sendData: WebRTCPeerClient.sendData,
  getData: WebRTCPeerClient.getData,
  getStream: WebRTCPeerClient.getStream,
  isPeerStarted: WebRTCPeerClient.isPeerStarted,
  setDebug: WebRTCPeerClient.setDebug,
};
