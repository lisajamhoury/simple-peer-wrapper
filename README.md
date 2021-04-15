# Browser to Browser Connection with Simple Peer, Socket.io and Express

This combines an Express Server with Socket.io Signal Server, and [Simple Peer](https://github.com/feross/simple-peer).

It runs a Socket.io signal server, then a peer connection over webRTC using Simple-Peer between two browser windows. Express serves the signal server. This currently runs over localhost. The express server is on port 3000. The socket server is on port 80.

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. If you're using Windows 10, make sure you've enabled [Developer Mode](https://mywindowshub.com/how-to-enable-developer-mode-in-your-windows-10-computer/).

From your command line:

```bash
# Clone this repository (Mac only, see next line for Windows instructions)
git clone https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples
# If on Windows you must allow for symlinks as follows
git clone -c core.symlinks=true https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples

# Install and Run the Server and First Client
# Go into the Express application folder
cd WebRTC-Simple-Peer-Examples/express_server
# Install dependencies
npm install
# Run the Express app — this will start the signaling server and first client
# It will watch and autorefresh on changes
npm run watch

# Install and Run the Second Client
# In a new command line window, go into the client folder
cd WebRTC-Simple-Peer-Examples/browser_client
# Install dependencies
npm install
# Run a simple python server on your localhost
# If python 2
python -m SimpleHTTPServer 8000
# If python 3
python -m http.server 8000

# To make changes to the client module
# In a third command line window, go into the client folder
cd WebRTC-Simple-Peer-Examples/browser_client
# Run watchify
npm run watch
```

Open http://localhost:3000 in your browser to see first client. Open http://localhost:8000/examples in your browser to start the second client. Open the developer console (option+command+I) to see communication between Server and clients.

## API

### .initSocketClient({options})

Makes a connection from the client to the socket server. Must be called before .initPeerClient().

#### options

serverUrl — Pass the url of your socket server. By default it will be at http://localhost:8081. To make available to the public internet, use your own server or run with ngrok (instructions below).
stream — Pass a video stream.

```javascript
const options = {
  serverUrl: 'https://9bf0ae2ca82a.ngrok.io',
  stream: stream,
};

WebRTCPeerClient.initSocketClient(options);
WebRTCPeerClient.initPeerClient();
```

### .initPeerClient()

Makes a request for a peer connection to each of the available peers on the network.

### .isInitiator()

The initiator is the peer who initiated the peer connection. Returns true or false.

### .sendData(data)

Used to send data to all other peers on the network. Data should be sent in JSON format.

### .getData()

Retrieves data from the peer. Provides data from and id of the sending peer. `{ data: data, userId: socket.id }`

### .isPeerStarted()

Logs if the peer connection is started or not. Returns true of false.

### .setDebug(debug)

Turns server and peer logs on and off. Takes a boolean: true or false.

## To Run Signal Server Online With NGROK

The signal server runs on localhost at port 80 (http://127.0.0.1:80) by default. If you'd like to run the server on a public network you can run it with [ngrok](https://ngrok.com/). It takes less than five minutes to set up!

1. Go to [ngrok.com](https://ngrok.com/) and setup an account.
2. Follow the three-step instructions under setup and installation (Unzip, connect, fire it up!)

```bash

cd folder_containing_ngrok
$ ./ngrok http 8081

```

For Windows 10 users: For step 2 and 3 use `ngrok` rather than `./ngrok`, so the command for step 2 would be `ngrok authtoken < your auth token >`. You can also double click on the ngrok icon to run on port 80 rather than using the command line for step 3.

3. Find your ngrok address and add it to your sketch code. For example:

```javascript
// in file /browser_client/examples/example1_mouse/sketch.js

const options = {
  serverUrl: 'https://9bf0ae2ca82a.ngrok.io',
  stream: stream,
};

WebRTCPeerClient.initSocketClient(options);
WebRTCPeerClient.initPeerClient();
```

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
