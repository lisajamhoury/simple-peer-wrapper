const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const livereload = require('livereload');
const connectLiveReload = require('connect-livereload');
const http = require('http');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

const server = http.createServer(app);
const ioServer = require('socket.io')(server);
server.listen(80);

const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

// for browser reload
app.use(connectLiveReload());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

//
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('errors');
});

liveReloadServer.server.once('connection', () => {
  setTimeout(() => {
    liveReloadServer.refresh('/');
  }, 100);
});

// app.get("/", function (req, res) {
//   res.sendFile(path.join(__dirname + "/index.html"));
// });

ioServer.sockets.on('connection', function (socket) {
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function (message) {
    console.log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function (room) {
    console.log('Received request to create or join room ' + room);

    // I can't console.log or debug this. Why?
    var clientsInRoom = ioServer.sockets.adapter.rooms[room];
    var numClients = clientsInRoom
      ? Object.keys(clientsInRoom.sockets).length
      : 0;
    console.log(
      'Room ' + room + ' now has ' + numClients + ' client(s)',
    );

    if (numClients === 0) {
      socket.join(room);
      console.log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {
      // change number of clients allowed in room here
      console.log('Client ID ' + socket.id + ' joined room ' + room);
      ioServer.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      ioServer.sockets.in(room).emit('ready'); // not being used anywhere
    } else {
      // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function () {
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
  });

  socket.on('bye', function () {
    console.log('received bye');
  });
});

module.exports = app;
