var mongoose = require('../lib/mongoose');
var User = require('../models/users');
var Friends = require('../models/friends');
var Stat = require('../models/stat');
var File = require('../models/files');
var fs = require('fs');
var crypto = require('crypto');
var fstream = require('fstream');

exports.register = function (request, response) {
	if (request.session.login == undefined) response.render("register")
	else response.redirect("/home");
}

exports.signup = function (request, response) {
	User.find({$or: [{email: request.body.email}, {login: request.body.login}]}, function (error, users) {
		if (error) {
			response.render("register", {error: error});
			return console.error(error);
		}

		if (users.length) return response.render("register", {error: "Ooops! Login or e-mail already exsists!"});

		var user = new User(request.body);
		user.passwords(request.body.password, request.body.passwordRepeat, function (error) {
			if (error) return response.render("register", {error: error});

			user.makePasswordHashed(request.body.password);
			user.avatar = 'no-avatar.gif';
			user.storage = 10000;

			user.create(function (error) {
				if (error) return response.render("register", {error: error});

				var friends = new Friends({owner: user.login, friends: []});
				friends.save();

				request.session.login = user.login;
				fs.mkdir('storage/' + user.login, 0755);
				response.redirect("/home");
			});
		});
	});
}

exports.login = function (request, response) {
	if (request.session.login == undefined) response.render("main")
	else response.redirect("/home");
}

exports.singin = function (request, response) {
	var sha1 = crypto.createHash('sha1').update(request.body.password).digest('hex');
	User.find({login: request.body.login, password: sha1}, function (error, users) {
		if (error) {
			response.render("main", {error: "Ooops! Error at database connection!"});
			return console.error(error);
		}
		if (users.length) {
			request.session.login = users[0].login;
			response.redirect("/home");
		}
		else response.render("main", {error: "Ooops! Login or password is invalid!"});
	});
}

exports.edit = function (request, response) {
	if (request.session.login != undefined) {
		User.find({login: request.session.login}, function (error, users) {
			if (error) {
				response.render("main", {error: "Ooops! Error at database connection!"});
				return console.error(error)
			}
			if (users.length) response.render('edit', {user: users[0]});
		});
	}
	else response.redirect('/');
}

exports.update = function (request, response) {
	User.find({login: request.session.login}, function (error, users) {

		request.pipe(request.busboy);


		request.busboy.on('field', function (key, value) {
			users[0][key] = value
		});

		request.busboy.on('file', function (fieldname, file, filename) {
			if (filename !== '') {
				var sha1 = crypto.createHash('sha1').update(filename).update(new Date().toString()).digest('hex');
				var fstream = fs.createWriteStream('public/avatars/' + sha1);
				file.pipe(fstream);

				fstream.on('close', function () {
					if (users[0].avatar != 'no-avatar.gif') {
						fs.unlink('public/avatars/' + users[0].avatar);
					}
					users[0].avatar = sha1;
					users[0].create(function (error) {
						if (error) return response.render("edit", {user: users[0], status: 'fail', errors: error});
						response.render('edit', {user: users[0], status: 'ok', errors: undefined});
					});
				});
			}
			else {
				users[0].create(function (error) {
					if (error) return response.render("edit", {user: users[0], status: 'fail', errors: error});
					response.render('edit', {user: users[0], status: 'ok', errors: undefined});
				});
			}
		});
	});
}

exports.private = function (request, response) {
	if (request.session.login != undefined) {
		response.render('private');
	}
	else {
		response.redirect('/');
	}
}

exports.updatePasswords = function (request, response) {
	User.find({login: request.session.login}, function (error, users) {
		var sha1 = crypto.createHash('sha1').update(request.body.password).digest('hex');

		if (users[0].password == sha1) {
			if (request.body.newPassword1 == request.body.newPassword2) {
				var sha1 = crypto.createHash('sha1').update(request.body.newPassword1).digest('hex');
				users[0].password = sha1;
				users[0].save();
				response.render('private', {status : 'ok'});
			}
			else response.render('private', {error : 'Ooops! New passwords does not match!'});
		}
		else response.render('private', {error : 'Ooops! Old password is incorrect!'});
	});
}

exports.statistics = function (request, response) {
	if (request.session.login != undefined) {
		User.find({login: request.session.login}, function (error, users) {
			Stat.find({owner: request.session.login}, function (error, statistic) {
				console.log(users[0].storage);
				if (statistic.length) 
					response.render('statistics', {statistic: statistic, storage: Math.floor(users[0].storage)})
				else response.render('statistics', {statistic: undefined})
			});
		})
	}
	else response.redirect('/');
}

exports.logout = function (request, response) {
	request.session.login = undefined;
	response.redirect('/');
}

exports.search = function (request, response) {
	if (request.session.login != undefined) response.render('search');
	else response.redirect('/');
}

exports.getUsers = function (request, response) {
	var pattern = new RegExp(request.body.value, 'i');
	User.find({$or: [{login: pattern}, {firstname: pattern}, {lastname: pattern}]}, function (error, users) {
		Friends.find({owner: request.session.login}, function (error, friends) {
			response.send({users: users, friends: friends[0].friends, owner: request.session.login});
		})
	});
}

exports.friendsActions = function (request, response) {
	Friends.find({owner: request.session.login}, function (error, friends) {
		if (error) return response.send({status: "fail"});

		if (request.body.action == 'add') {
			friends[0].friends.push({login: request.body.login, avatar: request.body.avatar, fullname: request.body.fullname});
		}
		else if (request.body.action == 'remove') {
			for(i = 0; i < friends[0].friends.length; i++) {
				if (friends[0].friends[i].login == request.body.login) {
					friends[0].friends.splice(i, 1);
					break;
				}
			}
		}
		friends[0].save();
		response.send({status: "ok"});
	});
}

exports.userPage = function (request, response) {
	var login = request.params[0];
	var path = '';
	if (request.params[1] == undefined) var path = '';
	else path = request.params[1];

	if (login == request.session.login) return response.redirect('/home');
	
	User.find({login: login}, function (error, users) {
		if (error) return response.redirect('404');

		if (users.length) {
			File.find({owner: login, general: true, path: path}, function (error, files) {
				if (error) return response.redirect('404');
					console.log(login, path);
					response.render('userpage', {
						login: login,
						firstname: users[0].firstname,
						lastname: users[0].lastname,
						avatar: users[0].avatar,
						city: users[0].city,
						phone: users[0].phone,
						company: users[0].company,
						email: users[0].email,
						files: files.length ? files : undefined
					});

			});
		}
		else response.redirect('404');
	});
}