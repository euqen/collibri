module.exports = function(app) {

	var authorization = require('./authorization');
	var registration = require('./registration');

	app.route('/').get(authorization.loginPage).post(authorization.singIn);

	app.route('/register').get(registration.registerPage).post(registration.signUp);

};