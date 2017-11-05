const express = require('express'),
  socketio = require('socket.io'),
  siofu = require('socketio-file-upload'),
  path = require('path');


var app = express();
var server = app.use(siofu.router).listen(8080);
var io = socketio.listen(server);

app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/download', (req, res) => {
	var filename = req.body.file;
	console.log(path.join(__dirname, 'upload_files/'+filename));
  res.download(path.join(__dirname, 'upload_files/'+filename));
});

io.on('connection', function (socket) {
  // socket.broadcast.emit('user.events', 'Someone has joined!');
  console.log("Another tab joined!!!");
  var uploader = new siofu();
    uploader.dir = path.join(__dirname, 'upload_files');
    uploader.listen(socket);
    uploader.on("saved", (event) => {
    	console.log(event);
        io.sockets.emit('file received', event.file);
    });
  socket.on('message sent', (message) => {
  	io.sockets.emit('message received', message);
  });
});

