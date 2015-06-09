module.exports = function(app) {

	var user = require('../controllers/user');
	var file = require('../controllers/file');

	app.route('/').get(user.login).post(user.singin);
	app.route('/register').get(user.register).post(user.signup);
	app.route('/edit').get(user.edit).post(user.update);
	app.get('/statistics', user.statistics);
	app.route('/search').get(user.search).post(user.getUsers);
	app.route('/private').get(user.private).post(user.updatePasswords);
	app.get('/logout', user.logout);
	app.post('/friendsActions', user.friendsActions);
	app.get(/\/users\/([\w\-\_]{3,20})([\/[\w|%|\s]+]*)*$/, user.userPage);

	app.get(/\/home(\/[[\w|%|\s]+]*)*$/, file.home);
	app.post('/uploadFile', file.uploadFile);
	app.post('/createFolder', file.createFolder);
	app.post('/deleteFile', file.deleteFile);
	app.get('/downloadFile', file.downloadFile);
	app.post('/general', file.general);
	app.post('/rename', file.rename);

	app.get('*', function (request, response) {
		response.render('404');
	});
};