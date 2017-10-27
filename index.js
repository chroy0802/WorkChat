const express = require('express'),
  socketio = require('socket.io'),
  path = require('path');


var app = express();
var server = app.listen(8080);
var io = socketio.listen(server);



app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  // socket.broadcast.emit('user.events', 'Someone has joined!');
  console.log("Another tab joined!!!");
  socket.on('message sent', (message) => {
  	io.sockets.emit('message received', message);
  });
});

