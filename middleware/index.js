module.exports = function(app, express) {

	var bodyParser = require('body-parser');
	var path = require('path');
	var routes = require('../routes');

	app.set("view engine", "jade");
	app.use(bodyParser.urlencoded({extended: true}));
	app.use('/public', express.static(path.join(__dirname, '../public')));

	routes(app);
}