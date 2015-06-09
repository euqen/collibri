var express = require('express');
var app = express();
var middleware = require("./middleware")(app, express);
var server;

server = app.listen(3334, function() {
	console.log('Server running at 3334th port.');
});

server.on('disconnect', function() {
	mongoose.disconnect();
});