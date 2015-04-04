var mongoose = require('../lib/mongoose');
var User = require('../models/users');
var controller = require('../controllers/userController');

exports.registerPage = function (request, response) {
	response.render("register");
}

exports.signUp = function (request, response) {

	var ValidateError = controller.validateRegistrationFields(request.body);

	if (ValidateError) {
		response.render("register", {error: ValidateError});
	}
	else {
		User.find({$or: [{email: request.body.email}, {login: request.body.login}]}, function(error, users) {
			if (error) {
				response.render("register", {error: "Error at database connection"});
				return console.error(error);
			}
			if (users.length) {
				response.render("register", {error: "Login or e-mail already exsists"});
			}
			else {
				request.body.storage = 10;
				var user = new User(request.body);
				controller.saveUser(user);
				response.redirect("/home");
			}
		});
	}
}