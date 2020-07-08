# Browser to Browser Connection with Simple Peer, Socket.io and Express

This combines an Express Server with [Realtime Communication with WebRTC](https://codelabs.developers.google.com/codelabs/webrtc-web/#0) Socket.io Signal Server from Codelabs, and [Simple Peer](https://github.com/feross/simple-peer).

It runs a Socket.io signal server, then a peer connection over webRTC using Simple Peer between two browser windows. Express serves the signal server. This currently runs over localhost. The express server is on port 3000. The socket server is on port 80.

## To Use

For Mac OS use master branch. Windows 10 does not allow for two apps to simultaniously use the webcam, so the master branch getUserMedia example will not work.

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/lisajamhoury/Browser-to-Browser-Simple-Peer-Express-Example
# Go into the Express application folder
cd Browser-to-Browser-Simple-Peer-Express-Example/express_server
# Install dependencies
npm install
# Run the Express app — this will start the signaling server and first client
# It will watch and autorefresh on changes
npm run watch
# In a new command line window, go into the client folder
cd Browser-to-Browser-Simple-Peer-Express-Example/browser_client
# Install dependencies
npm install
# Run a simple python server on your localhost
# If python 2
python -m SimpleHTTPServer 8000
# If python 3
python -m http.server 8000

# To make changes to client, run watchify in separate command line window
npm run watch
```

Open http://localhost:3000 in your browser to see first client. Open http://localhost:8000/dist in your browser to start the second client. Open the developer console (option+command+I) to see communication between Server and clients.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
