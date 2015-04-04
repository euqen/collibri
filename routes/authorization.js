var mongoose = require('../lib/mongoose');
var User = require('../models/users');;

exports.loginPage = function (request, response) {
	response.render("main");
}

exports.singIn = function (request, response) {
	mongoose.connection.on('error', function (error) {
		console.error(error);
	});

	User.find({login: request.body.login, password: request.body.password}, function(error, users) {
		if (error) {
			response.render("main", {error: "Error at databaseb connection"});
			return console.error(error);
		}
		if (users.length) {
			response.redirect("/home");
		} 
		else {
			response.render("main", {error: "Login or password is invalid"});
		}
	});	
}
