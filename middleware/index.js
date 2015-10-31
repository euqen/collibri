var bodyParser = require('body-parser'),
	path = require('path'),
    cookies = require('cookie-parser'),
    sessions = require('express-session'),
    busboy = require('connect-busboy'),
	passport = require('./passport');

module.exports = function(app, express) {

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

	require('../routes/api').map(app);
	require('../routes/index').map(app);
	require('../routes/desktop').map(app);

};