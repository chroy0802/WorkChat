var client = require('./redis').client,
	q = require('q'),
	flow = require('flow-maintained');
	models = require('./models');

// exports.addUser = function addUser(user, email, password,cb){
//     client.multi()
// 		.hset('user:' + user, 'email', email)
//         .hset('user:' + user, 'password', password)
// 		.zadd('users', Date.now(), user)
// 		.exec(function(err){
// 			if(err){
// 			return cb(err,null);	
// 			}
// 			else{
// 				return cb(null,user);
// 			}
			
// 		});
// };

exports.addUser = function addUser(username, email, password, cb){
client.incr('next:user:id', function(err, userid){
    flow.exec(
      function(){
        var user_string = 'user:' + userid;
        client.set('user:' + username, userid, this.MULTI());
        client.hset(user_string, 'email', email, this.MULTI());
        client.hset(user_string, 'username', username, this.MULTI());
        client.hset(user_string, 'password', password, this.MULTI());
      },function(args){
        return cb(userid);
      }
    );
  });
}

exports.findByUsername = function findByUsername(username, cb){
		client.get('user:' + username, function(err, user){
			if(err)
				return cb(err,null);
			else{
				client.hgetall('user:'+user, function(err, profile){
				return cb(null,profile);
			    });
			}
		});
};

exports.addRoom = function addRoom(room){
	if (room !== '') client.zadd('rooms', Date.now(), room);
};

exports.getRooms = function getRooms(cb){
	client.zrevrangebyscore('rooms', '+inf', '-inf', function(err, data){
		return cb(data);
	});
};

exports.addChat = function addChat(chat){
	client.multi()
	.zadd('rooms:' + chat.room + ':chats', Date.now(), JSON.stringify(chat))
	.zadd('users', Date.now(), chat.user)
	.zadd('rooms', Date.now(), chat.room)
	.exec();
};

exports.getRoomChats = function(room, cb){
    client.zrevrangebyscore('rooms:' + room + ':chats', '+inf', '-inf', function(err, data){
    	return cb(null, data);
    })
}

exports.addUserToRoom = function addUserToRoom(user, room){
	client.multi()
	.zadd('rooms:' + room, Date.now(), user)
	.zadd('users', Date.now(), user)
	.zadd('rooms', Date.now(), room)
	.set('user:' + user + ':room', room)
	.exec();
}

exports.removeUserFromRoom = function removeUserFromRoom(user, room){
	client.multi()
	.zrem('rooms:' + room, user)
	.del('user:' + user + ':room')
	.exec();
};

exports.getUsersinRoom = function getUsersinRoom(room){
	return q.Promise(function(resolve, reject, notify){
		client.zrange('rooms:' + room, 0, -1, function(err, data){
			var users = [];
			var loopsleft = data.length;
			data.forEach(function(u){
			client.hgetall('user:' + u, function(err, userHash){
				users.push(models.User(u, userHash.name, userHash.type));
				loopsleft--;
				if(loopsleft === 0) resolve(users);
			    });
		    });
	    });
    });
};

