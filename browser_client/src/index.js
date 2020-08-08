const WebRTCPeerClient = require('./webrtc_peer_client.js');

module.exports = {
  init: WebRTCPeerClient.init,
  isInitiator: WebRTCPeerClient.isInitiator,
  sendData: WebRTCPeerClient.sendData,
  getData: WebRTCPeerClient.getData,
  isPeerStarted: WebRTCPeerClient.isPeerStarted,
};
