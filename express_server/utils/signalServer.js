const DEBUG = false;

const log = function (message) {
  if (!DEBUG) {
    return;
  }
  log(message);
};

const handleMessage = function (message, socket) {
  log('Client said: ', message);
  // for a real app, would be room-only (not broadcast)
  socket.broadcast.emit('message', message);
};

const handleCreateOrJoin = function (room, socket, ioServer) {
  log('Received request to create or join room ' + room);

  // I can't log or debug this. Why?
  var clientsInRoom = ioServer.sockets.adapter.rooms[room];
  var numClients = clientsInRoom
    ? Object.keys(clientsInRoom.sockets).length
    : 0;
  log('Room ' + room + ' now has ' + numClients + ' client(s)');

  if (numClients === 0) {
    socket.join(room);
    log('Client ID ' + socket.id + ' created room ' + room);
    socket.emit('created', room, socket.id);
  } else if (numClients === 1) {
    // change number of clients allowed in room here
    log('Client ID ' + socket.id + ' joined room ' + room);
    ioServer.sockets.in(room).emit('join', room);
    socket.join(room);
    socket.emit('joined', room, socket.id);
    ioServer.sockets.in(room).emit('ready'); // not being used anywhere
  } else {
    // max two clients
    socket.emit('full', room);
  }
};

const handleIpAddress = function (socket) {
  var ifaces = os.networkInterfaces();
  for (var dev in ifaces) {
    ifaces[dev].forEach(function (details) {
      if (
        details.family === 'IPv4' &&
        details.address !== '127.0.0.1'
      ) {
        socket.emit('ipaddr', details.address);
      }
    });
  }
};

const handleBye = function () {
  log('received bye');
};

const initSocketServer = function (ioServer) {
  ioServer.sockets.on('connection', function (socket) {
    // convenience function to log server messages on the client

    socket.on('message', (message) => handleMessage(message, socket));

    socket.on('create or join', (room) =>
      handleCreateOrJoin(room, socket, ioServer),
    );

    socket.on('ipaddr', () => handleIpAddress(socket));

    socket.on('bye', handleBye);
  });
};

module.exports = initSocketServer;
