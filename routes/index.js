var express = require('express'),
	user = require('../controllers/user'),
    file = require('../controllers/file');
	index = express.Router();

module.exports.map = function(app) {

	index.route('/')
		.get(user.login);

	index.route('/register')
		.get(user.register);

	index.route('/edit')
		.get(user.edit);

	index.route('/statistics')
	   .get(user.statistics);

	index.route('/search')
	   .get(user.search);

	index.route('/private')
	   .get(user.private);

	index.route('/logout')
	   .get(user.logout);

	index.route(/\/users\/([\w\-\_]{3,20})([\/[\w|%|\s]+]*)*$/)
	   .get(user.userPage);

	index.route(/\/home(\/[[\w|%|\s]+]*)*$/)
	   .get(file.home);

	index.get('*', function (request, response) {
		response.render('404');
	});

	app.use(index);
};