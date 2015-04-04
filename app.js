var express = require('express');
var app = express();
var middleware = require("./middleware")(app, express);
var server;

server = app.listen(3338, function() {
	console.log('Server running at http://127.0.0.1:1337/');
});

server.on('connection', function (socket) {
	console.log("app.js: User connected -> " + socket.remoteAddress + ':' + socket.remotePort);
});

server.on('disconnect', function() {
	mongoose.disconnect();
});