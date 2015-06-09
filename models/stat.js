var mongoose = require('../lib/mongoose'),
	Schema = mongoose.Schema;

var Stat = new Schema({
	owner: String,
	month: String,
	uploaded: Number,
	deleted: Number,
	downloaded: Number
});

module.exports = mongoose.model('Stat', Stat);