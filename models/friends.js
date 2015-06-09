var mongoose = require('../lib/mongoose'),
	Schema = mongoose.Schema;

var Friends = new Schema({
	owner: String,
	friends: Array
});

module.exports = mongoose.model('Friends', Friends);