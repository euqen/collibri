var mongoose = require('../lib/mongoose'),
	Schema = mongoose.Schema;

var File = new Schema({
	filename: String,
	extname: String,
	hash: String,
	owner: String,
	date: Date,
	type: String,
	path: String,
	size: Number,
	general: Boolean
});

module.exports = mongoose.model('File', File);