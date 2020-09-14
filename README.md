# Browser to Browser Connection with Simple Peer, Socket.io and Express

This combines an Express Server with Socket.io Signal Server, and [Simple Peer](https://github.com/feross/simple-peer).

It runs a Socket.io signal server, then a peer connection over webRTC using Simple-Peer between two browser windows. Express serves the signal server. This currently runs over localhost. The express server is on port 3000. The socket server is on port 80.

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
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

## To Run Signal Server Online With NGROK

The signal server runs on localhost at port 80 (http://127.0.0.1:80) by default. If you'd like to run the server on a public network you can run it with [ngrok](https://ngrok.com/). It takes less than five minutes to set up!

1. Go to [ngrok.com](https://ngrok.com/) and setup an account.
2. Follow the three-step instructions under setup and installation (Unzip, connect, fire it up!)

For Windows 10 users: For step 2 and 3 use `ngrok` rather than `./ngrok`, so the command for step 2 would be `ngrok authtoken < your auth token >`. You can also double click on the ngrok icon to run on port 80 rather than using the command line for step 3.

3. Find your ngrok address and add it to your sketch code. For example:

```
// in file Browser-to-Browser-Simple-Peer-Express-Example/browser_client/examples/example1_mouse/sketch.js

// Delete this line, which connects your peer on localhost port 80
//WebRTCPeerClient.initSocketClient();

// Init signal server on public internet with ngrok
WebRTCPeerClient.initSocketClient('https://f54b8ef193dd.ngrok.io');
```

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
