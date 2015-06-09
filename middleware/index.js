module.exports = function(app, express) {

	var bodyParser = require('body-parser');
	var path = require('path');
	var routes = require('../routes');
	var cookies = require('cookie-parser');
	var sessions = require('express-session');
	var busboy = require('connect-busboy');

	app.set("view engine", "jade");
	app.use(sessions({
		secret: "SecretKey",
		resave: false,
		saveUninitialized: false
	}));
	app.use(cookies('secret'));
	app.use(busboy());
	app.use(bodyParser.urlencoded({extended: true}));
	app.use(bodyParser.text({ type: 'text/html' }));
	app.use(bodyParser.json({ type: 'application/json' }));
	app.use('/public', express.static(path.join(__dirname, '../public')));
	app.use('/bower_components', express.static(path.join(__dirname, '../bower_components')));
	routes(app);
}