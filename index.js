const express = require('express'),
  socketio = require('socket.io');

var app = express();
var server = app.listen(8080);
var io = socketio.listen(server);

app.use(express.static('public'));


io.on('connection', (socket) => {
  // socket.broadcast.emit('user.events', 'Someone has joined!');
  console.log("Another tab joined!!!");
  socket.on('message sent', (message) => {
  	io.sockets.emit('message received', message);
  });
    
  });

