# simple-peer-wrapper

Simple-peer-wrapper provides a server and peer client for [simple-peer-server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) and [simple-peer](https://github.com/feross/simple-peer). It is meant to be used with [simple-peer-server](https://github.com/lisajamhoury/simple-peer-server) as the signaling server.

# Why use simple-peer-wrapper

WebRTC peer connections are an excellent tool for building synchronous drawing, dancing, text, or video applications.

[Simple-peer](https://github.com/feross/simple-peer) is an great library for creating WebRTC peer connections, however, it does not include a signaling server, which is responsible for creating the initial connections between peers.

# How simple-peer-wrapper works

Simple-peer-wrapper wraps [simple-peer](https://github.com/feross/simple-peer) together with a [Socket.IO client](https://socket.io/docs/v3/client-api/index.html) that communicates with a [signaling server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling). Simple-peer-wrapper handles the signaling and the creation of the peer connection, then exposes the peer connection to be used in your client code.

# A note on STUN and TURN servers

Simple-peer-server and simple-peer-wrapper together provide a [signaling server](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling) and client that establish a connection between two or more peers.

They use [Socket.IO](https://socket.io/) to transport the signaling messages, then create the peer connections via [simple-peer](https://github.com/feross/simple-peer).

If you are launching your application on the public internet, you will likely need STUN and TURN servers as well. About [86% of connections can be created with just STUN servers](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/), but the remaining connections require TURN servers.

Default STUN servers are provided by simple-peer. Although they can be overwritten (see [documentation](#new-simplepeerwrapperoptions) on this below). TURN servers can be expensive to maintain and need to be provided by the application developer (that's probably you if you're reading this ;).

To learn more about signaling, STUN, and TURN servers, I recommend [this article by Sam Dutton](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/). If you are in need of a TURN server, you may find this article on [How to set up and configure your own TURN server using Coturn](https://gabrieltanner.org/blog/turn-server) by Gabriel Turner helpful. You could also check out paid services like [Twilio's Network Traversal Service](https://www.twilio.com/stun-turn).

Once you have your TURN servers setup, see the documentation below for how to include add them to your peer connections.

# Usage

## Four steps to get up and running with simple-peer-wrapper

### 1. Add simple-peer-wrapper to your project

You must first include this package in your client-side code. You can do this one of two ways.

Option 1: Install the package using npm or your favorite package manager. Then require the package in your app.

```bash
# in your terminal

npm install simple-peer-wrapper
```

```javascript
// in your client code

const SimplePeerWrapper = require('simple-peer-wrapper');
```

Option 2: Include the simple-peer-wrapper.min.js as a standalone script in a `<script>` tag. This exports a SimplePeerWrapper constructor on the window. (Find simple-peer-wrapper.min.js in /dist directory of this repository.)

```html
<script src="simple-peer-wrapper.min.js"></script>
```

### 2. Create an instance and connect

You can now create an instance of simple-peer-wrapper. This will create a socket connection to your [signaling server](https://github.com/lisajamhoury/simple-peer-server).

Important! You must include your [signaling server](https://github.com/lisajamhoury/simple-peer-server)'s url when you create an instance of simple-peer-wrapper.

```javascript
// in your client code

const options = {
  serverUrl: 'http://localhost:8081',
};

const spw = new SimplePeerWrapper(options);
```

Calling the `connect()` method initiates the peer connection via the socket connection and simple-peer.

```javascript
spw.connect();
```

### 3. Do something with the data

Now that you have a connection, you need to tell your program what you want to do with the information you are receiving from your peer(s). See the API documentation on the available options. Here's an example of receiving mouse data over the peer connection.

```javascript
// in your client code

// a global variable to hold data
let partnerMouse;

// when we receive data, call the gotData function
spw.on('data', gotData);

// this runs each time data is received
// the incoming data is passed into the function
function gotData(data) {
  // put the incoming data somewhere to use later
  partnerMouse = data.data;
}
```

You could also write the same thing like this:

```javascript
spw.on('data', (data) => {
  partnerMouse = data.data;
});
```

### 4. Remember to hangup

Remember to hang up when you've finished your call!

```javascript
// in your client code

// this runs whenever you close or refresh your browser window
window.onbeforeunload = () => {
  spw.close();
};
```

# API

## `new SimplePeerWrapper({options})`

Creates a new socket connection to the signaling server. You must have a signaling server running for this to work. See [simple-peer-server](https://github.com/lisajamhoury/simple-peer-server) for more info.

You must provide the serverUrl for a successful connection. Other parameters are optional, as follows:

```javascript

{
    serverUrl: 'http://localhost:8081', // required
    debug: true, // optional
    simplePeerOptions: {}, // optional
}
```

The options are as follows:

`serverUrl` the serverUrl of the signaling server you wish to connect to. This is required for a successful connection.

`debug` turns on additional logging. Defaults to false.

`simplePeerOptions` exposes the options available when creating a new WebRTC peer connection via simple-peer. See [simple-peer documentation](https://github.com/feross/simple-peer#peer--new-peeropts) for more info.

Note! This library sets the peer connections's `initiator` and `stream` options automatically. Overriding them with simplePeerOptions could break your application.

If you'd like to add your own STUN/TURN servers you can do so with simplePeerOptions as follows:

```javascript
simplePeerOptions: {
    config: {
    iceServers: [
    {
      'urls': 'stun:stun.l.google.com:19302'
    },
    {
      'urls': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'urls': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
    },
},
```

`simplePeerOptions` can also be provided on the server side via simple-peer-server. Any simple-peer options provided by the server will override the default options in simple-peer AND any options provided via simple-peer-wrapper client.

## `.connect()`

Creates a peer connection between the client and all other parties connected to the signaling server. Each connection is one-to-one, creating a mesh topology.

## `.isConnectionStarted()`

Returns `true` or `false`. Denotes whether a peer connection has been established or not.

## `.send(data)`

Sends data over the peer's data connection. The sender's ID is sent with the data. This is useful if identifying data arriving from multiple connected peers.

## `.on('connect', () => {})`

Called when the peer connection is created.

## `.on('data', (data) => {})`

Called when a data message is received from a remote peer via the data channel. `data` is an object containing `data.id`, the unique identifier of the remote peer, and `data.data`, the data sent by the remote peer.

## `.on('stream', (stream) => {})`

Received a video stream from remote peer. It can be displayed as follows:

```javascript
spw.on('stream', (stream) => {
  const video = document.querySelector('video');
  if ('srcObject' in video) {
    video.srcObject = stream;
  } else {
    video.src = window.URL.createObjectURL(stream);
  }
  video.play();
});
```

## `.on('close', () => {})`

Called when the peer connection has closed.

## `.on('error, (err) => {})`

Called when an error occurs.

## `.close()`

Terminates the peer connection(s).

# Running the examples

All of the current examples are written using [p5.js](https://p5js.org/), a JavaScript library for creative coding.

To run the examples, you must first run a [simple-peer-server](https://github.com/lisajamhoury/simple-peer-server).

Make sure you enter your serverUrl in the example code.

```javascript
// in sketch.js

const options = {
  serverUrl: 'http://localhost:8081',
};

const spw = new SimplePeerWrapper(options);
```

You will then need to run an http server in this project's folder. If this is new to you, either [http-server](https://www.npmjs.com/package/http-server) or [live-server](https://www.npmjs.com/package/live-server) are good options.

```bash
# in your terminal, navigate into project folder
cd simple-peer-wrapper

# run the http server of your choice
live-server
```

In your browser, navigate to your localhost at the port specified by your http server. This will usually look something like `http://localhost:8080`.

Go to the examples folder `http://localhost:8080/examples` and open the example you wish to view from there. You will need to open two instances of the example to create a peer connection.

In the [browser console](https://balsamiq.com/support/faqs/browserconsole/) you will see `"SIMPLE PEER IS CONNECTED"` when you have made a connection.

Have fun!
