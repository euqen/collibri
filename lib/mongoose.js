var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/collibri');

module.exports = mongoose;