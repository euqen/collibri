var mongoose = require('../lib/mongoose'),
	Schema = mongoose.Schema;

var User = new Schema({
	login: String,
	password: String,
	email: String,
	storage: Number
});

module.exports = mongoose.model('User', User);