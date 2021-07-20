# simple-peer-wrapper

Simple-peer-wrapper provides a [signaling server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) client for [simple-peer](https://github.com/feross/simple-peer). It is meant to be used with [simple-peer-server](https://github.com/lisajamhoury/simple-peer-server) as the signaling server.

# Why use simple-peer-wrapper

WebRTC peer connections are an excellent tool for building synchronous drawing, dancing, text, or video applications.

[Simple-peer](https://github.com/feross/simple-peer) is an excellent library for creating webRTC peer connections, however, it does not include a signaling server, which is necessary for establishing the peer connections used by simple-peer.

# How simple-peer-wrapper works

Simple-peer-wrapper wraps [simple-peer](https://github.com/feross/simple-peer) together with a [Socket.IO client](https://socket.io/docs/v3/client-api/index.html) that communicates with a [signaling server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling). Simple-peer-wrapper handles the signaling and the creation of the peer connection, then exposes the peer connection to be used in your client code.

# A note on STUN and TURN servers

Simple-peer-server and simple-peer-wrapper together provide a [signaling server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) and client that establish a connection between two or more peers.

They use [Socket.IO](https://socket.io/) to transport the signaling messages, then create the peer connections via [simple-peer](https://github.com/feross/simple-peer).

If you are launching your application on the public internet, you will likely need STUN and TURN servers as well. (About [86% of connections can be created with just STUN servers](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/), but the remaining connections require TURN servers.)

Default STUN servers are provided by simple-peer. Although they can be overwritten (see documentation on this below). TURN servers can be expensive to maintain and need to be provided by the application developer (that's probably you if you're reading this ;).

To learn more about signaling, STUN, and TURN servers, I recommend [this article by Sam Dutton](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/). You may find this article from Gabriel Turner on [How to set up and configure your own TURN server using Coturn](https://gabrieltanner.org/blog/turn-server) helpful. You could also check out paid services like [Twilio's Network Traversal Service](https://www.twilio.com/stun-turn).

Once you have your TURN servers setup, see the documentation below for how to include add them to your peer connections.

# Usage

TKTKTK

```javascript
simplePeerOptions: {
    config: {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
    ],
    },
},
```
