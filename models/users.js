var crypto = require('crypto');
var mongoose = require('../lib/mongoose');
var Schema = mongoose.Schema;

/**
 * User Schema
 */

var User = new Schema({
	login: String,
	password: String,
	email: String,
	storage: Number,
	firstname: String,
	lastname: String,
	city: String,
	company: String,
	phone: String,
	avatar: String
});

/**
 * User Validators
 */

User.path('login').validate(function (login) {
	var RegExpLogin = /^([\w\-\_]){3,20}$/;

	if (RegExpLogin.test(login)) return true;
	else return false;
}, "Ooops! Login is incorrect!\n");

User.path('email').validate(function (email) {
	var RegExpEmail = /^([\w\-\_\.]+)\@(\w+)\.([a-zA-Z]+)$/;

	if(RegExpEmail.test(email)) return true
	else return false;
}, "Ooops! E-Mail is incorrect!\n");

User.path('firstname').validate(function (firstname) {
	var RegExpFirstname = /^([a-zA-ZА-Яа-я]{2,20})$/;

	if(RegExpFirstname.test(firstname) || !firstname) return true
	else return false;
}, "Ooops! Fristname is incorrect!!\n");

User.path('lastname').validate(function (lastname) {
	var RegExpLastname = /^([a-zA-ZА-Яа-я]{2,20})$/;

	if(RegExpLastname.test(lastname) || !lastname) return true
	else return false;
}, "Ooops! Lastname is incorrect!!\n");

User.path('phone').validate(function (phone) {
	var RegExpPhone = /^[\+]{0,1}[\d]{11,18}$/;

	if(RegExpPhone.test(phone) || !phone) return true
	else return false;
}, "Ooops! Phone is incorrect!!\n");

User.path('city').validate(function (city) {
	var RegExpCity = /^[a-zA-ZА-Яа-я\-\s]{2,24}$/;

	if(RegExpCity.test(city) || !city) return true
	else return false;
}, "Ooops! City is incorrect!!\n");

User.path('company').validate(function (company) {
	var RegExpCompany = /^[a-zA-ZА-Яа-я\-\s]{2,24}$/;

	if(RegExpCompany.test(company) || !company) return true
	else return false;
}, "Ooops! Company is incorrect!!\n");

/**
 * User Pre save hook
 */

/*User.pre('save', function(next) {
	var sha1 = crypto.createHash('sha1').update(this.password).digest('hex');
	this.password = sha1;
	this.avatar = 'no-avatar.gif';
	next();
})*/

/**
 * User Methods
 */

User.methods = {

	/**
	* Passwords - check if the passwords are the same
	*
	* @param {String} password
	* @param {String} password_repeated
	* @param {Callback} callback
	* @return {Callback}
	* @api public
	*/

	passwords: function (password, password_repeated, callback) {
		var PASSWORD_MIN_LEN = 6;

		if (password === password_repeated) {
			if (password.length >= PASSWORD_MIN_LEN) return callback(false)
			else return callback("Ooops! Password's length should be from six chars.");
		}
		else return callback("Ooops! Passwords are not idential!\n"); 
	},

	/**
	* Create - create password's hash and save this field to model
	* @param {String} password
	* @return {Void}
	* @api public
	*/

	makePasswordHashed: function (password) {
		var sha1 = crypto.createHash('sha1').update(password).digest('hex');
		this.password = sha1;
	},

	/**
	* Create - save user and generate errors
	* @param {Callback} callback
	* @return {Callback}
	* @api public
	*/

	create: function (callback) {
		this.save(function (error) {
			var message = '';
			if (error) {
				Object.keys(error.errors).forEach(function (err) {
					message += error.errors[err].message;
				});
			}
			return callback(message);
		});
	}
}


module.exports = mongoose.model('User', User);