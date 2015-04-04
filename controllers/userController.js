exports.validateRegistrationFields = function (fields) {
	var RegExpLogin = /^([\w\-\_]){3,20}$/,
		RegExpEmail = /^([\w\-\_\.]+)\@(\w+)\.([a-zA-Z]+)$/,
		PASSWORD_MIN_LEN = 6;

	if(RegExpLogin.test(fields.login)) {
		if(RegExpEmail.test(fields.email)) {
			if (fields.password === fields.passwordRepeat) {
				if (fields.password.length >= PASSWORD_MIN_LEN) {
					return false;
				}
				else return "Password's length should be from six chars.";
			}
			else return "Passwords are not idential!\n";
		}
		else return "E-Mail is incorrect!\n";
	}
	else return "Login is incorrect!\n";
}

exports.saveUser = function(User) {

	User.save(function(error) {
		console.log(error);
	});

}