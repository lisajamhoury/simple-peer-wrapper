const DEBUG = false;

let rooms = [];
let roomCounter = 0;

if (!DEBUG) {
  console.log = function () {};
}

const handleMessage = (message, socket) => {
  console.log('Client said: ', message);
  // for a real app, would be room-only (not broadcast)
  socket.broadcast.emit('message', message);
};

const handleInitiatePeer = (room, socket) => {
  console.log('Server initiating peer in room ' + room);
  socket.to(room).emit('initiate peer', room);
};
const handleSendSignal = (message, socket) => {
  console.log('Handling send signal to room ' + message.room);
  socket.to(message.room).emit('sending signal', message);
};

// autocreate rooms, user doesn't specify name
const handleCreateOrJoin = (unusedRoom, socket, ioServer) => {
  const clientIds = Object.keys(ioServer.sockets.sockets);
  const numClients = clientIds.length;
  console.log('NUMCLIENTS, ' + numClients);

  if (numClients === 1) {
    const room = createRoom();
    socket.join(room);
    socket.emit('created', room, socket.id);

    console.log('Client ID ' + socket.id + ' created room ' + room);
  } else if (numClients === 2) {
    const room = rooms[0];
    ioServer.sockets.in(room).emit('join', room);
    socket.join(room);
    socket.emit('joined', room, socket.id);
    ioServer.sockets.in(room).emit('ready'); // not being used anywhere

    console.log('Client ID ' + socket.id + ' joined room ' + room);
  } else if (numClients > 2) {
    for (let i = 0; i < numClients; i++) {
      if (socket.id !== clientIds[i]) {
        // create a room and join it
        const room = createRoom();
        socket.join(room);
        console.log(
          'Client ID ' + socket.id + ' created room ' + room,
        );
        socket.emit('created', room, socket.id);
        socket.emit('join', room);

        //
        console.log(
          'Client ID ' + clientIds[i] + ' joined room ' + room,
        );

        // ioServer.sockets.in(room).emit('join', room);
        ioServer.sockets.sockets[clientIds[i]].join(room);
        ioServer.sockets.sockets[clientIds[i]].emit(
          'joined',
          room,
          clientIds[i],
        );
        // ioServer.sockets.in(room).emit('ready'); // not being used anywhere
      }
    }
  }
};

const createRoom = () => {
  const room = 'room' + roomCounter;
  rooms.push(room);
  console.log('number of rooms ' + rooms.length);
  roomCounter++;
  return room;
};

const handleIpAddress = (socket) => {
  let ifaces = os.networkInterfaces();
  for (let dev in ifaces) {
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

const handleHangup = () => {
  console.log('received hangup');
};

const handleDisconnect = (reason) => {
  console.log('disconnecting bc ' + reason);
};

const initSocketServer = function (ioServer) {
  ioServer.sockets.on('connection', function (socket) {
    // convenience function to log server messages on the client

    socket.on('message', (message) => handleMessage(message, socket));
    socket.on('initiate peer', (room) =>
      handleInitiatePeer(room, socket),
    );
    socket.on('sending signal', (message) =>
      handleSendSignal(message, socket),
    );

    socket.on('create or join', () =>
      handleCreateOrJoin(null, socket, ioServer),
    );

    socket.on('ipaddr', () => handleIpAddress(socket));

    socket.on('hangup', () => handleHangup(socket));
    socket.on('disconnect', (reason) => handleDisconnect(reason));
  });
};

module.exports = initSocketServer;
