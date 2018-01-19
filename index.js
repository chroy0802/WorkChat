const express = require('express'),
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

const RedisStore = require('connect-redis')(session);
var rClient = require('./redis').client;
var sessionStore = new RedisStore({client:rClient});
var redisAdapter = require('socket.io-redis');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var chat = require('./chat.js');
var User = require('./models.js').User;
var config = require('./config.js');

var socketIOExpressSession = require('socket.io-express-session');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({store:sessionStore, secret:'your secret here', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());
io.use(socketIOExpressSession(session({store:sessionStore, secret:'your secret here', resave: true, saveUninitialized: true})));
app.use('/public', express.static(path.join(__dirname, 'public')));
io.adapter(redisAdapter({ host: config.redis_host, port: config.redis_port }));

passport.use(new LocalStrategy(function(username, password,done){
  console.log(username + " " + password);
    chat.findByUsername(username,function(err,user){
      console.log(user);
        if(err) { return done(err); }
        if(!user){
            return done(null, false, { message: 'Incorrect username.' });
        }

          if (password == user.password) return done(null, user);
          done(null, false, { message: 'Incorrect password.' });
        });
    })
);

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/download', (req, res) => {
	var filename = req.query['file'];
	console.log(path.join(__dirname, 'upload_files/'+filename));
  res.download(path.join(__dirname, 'upload_files/'+filename));
});

app.get('/login', (req, res) => {
  var login_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=337bad47-4398-4ff2-b5eb-187684f4e031&response_type=id_token+token&redirect_uri=http%3A%2F%2Flocalhost%3A8080&scope=Calendars.ReadWrite%20Contacts.ReadWrite%20Files.ReadWrite.All%20Mail.ReadWrite%20openid%20User.ReadWrite%20User.ReadBasic.All%20Notes.ReadWrite.All%20Sites.ReadWrite.All%20Tasks.ReadWrite&response_mode=fragment&nonce=" + (Math.random() * 100000).toFixed(0)
  res.send("<body><a href=\"" + login_url + "\">Login with Microsoft</a></body>");
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.post('/login', passport.authenticate('local',{ successRedirect: '/', failureRedirect: '/login'}), function(req, res){});

app.post('/register', function (req, res){
  console.log(req.body);
  if (req.body.username && req.body.password)
  {
      chat.addUser(req.body.username, req.body.email, req.body.password, function(user){
        passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            })
      });
  }else{
    //req.flash('error', 'Please fill out all the fields');
    res.redirect('/register');
  }
});

io.on('connection', function (socket) {
  // socket.broadcast.emit('user.events', 'Someone has joined!');
  console.log('connection successful');
  socket.emit('connection successful');

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

  socket.on('diff', (edits) => {
    socket.broadcast.emit('patch',edits);
  });
});

