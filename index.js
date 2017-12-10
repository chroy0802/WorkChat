const express = require('express'),
  config = require('./config.js'),
  socketio = require('socket.io'),
  siofu = require('socketio-file-upload'),
  path = require('path'),
  mime = require('mime');


var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var server = app.use(siofu.router).listen(8080);
var io = socketio.listen(server);
var session = require('express-session');

var redis = require('redis');
const RedisStore = require('connect-redis')(session);
var rClient = redis.createClient(config.redis_port, config.redis_host);
var sessionStore = new RedisStore({client:rClient});
var redisAdapter = require('socket.io-redis');

var socketIOExpressSession = require('socket.io-express-session');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({store:sessionStore, secret:'your secret here', resave: true, saveUninitialized: true}));
io.use(socketIOExpressSession(session({store:sessionStore, secret:'your secret here', resave: true, saveUninitialized: true})));
app.use('/public', express.static(path.join(__dirname, 'public')));
io.adapter(redisAdapter({ host: config.redis_host, port: config.redis_port }));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/login.html'));
});

//var SessionSockets = require('session.socket.io');
//var sessionSockets = new SessionSockets(io, sessionStore, cookieParser, 'jsessionid');

app.get('/download', (req, res) => {
	var filename = req.query['file'];
	console.log(path.join(__dirname, 'upload_files/'+filename));
  res.download(path.join(__dirname, 'upload_files/'+filename));
});

app.post('/login', function (req, res) {
    //store user info in session after login.
    console.log(req.session);
    //req.session.user = req.body.user;
    //TODO
    res.sendFile(path.join(__dirname, 'public/index.html'))
});

io.on('connection', function (socket) {
  // socket.broadcast.emit('user.events', 'Someone has joined!');
  console.log(socket);
  var uploader = new siofu();
    uploader.dir = path.join(__dirname, 'upload_files');
    uploader.listen(socket);
    uploader.on("saved", (event) => {
    	var type = mime.getType(event.file.name);
    	console.log(type);
        io.sockets.emit('file received', event.file, type);
    });
  socket.on('message sent', (message) => {
  	io.sockets.emit('message received', message);
  });
});

