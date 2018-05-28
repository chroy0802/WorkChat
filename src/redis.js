var redis = require('redis'),
config = require('./config.js');
var client = redis.createClient(config.redis_port, config.redis_host);
exports.client = client;