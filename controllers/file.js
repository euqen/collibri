var multiparty = require('multiparty');
var fs = require('fs');
var crypto = require('crypto');
var pather = require('path');
var fileModel = require('../models/files');
var User = require('../models/users');
var Friends = require('../models/friends');
var Stat = require('../models/stat');

/**
 * File's methods for exports. Every methods call into routes module.
 **/


/**
* home - Rendering user home page, check path correction

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.home = function (request, response)
{
	if (!request.session.login) return response.redirect('/');

	if (request.params[0] == undefined) var path = ''
	else var path = request.params[0];

	getUserFileList(request.session.login, path, function (error, files) {
		if (error) return response.redirect('/');
		User.find({login: request.session.login}, function (error, users) {
			if (error) return response.redirect('/');
			Friends.find({owner: request.session.login}, function (error, friends) {
				if (error) return response.redirect('/');
				response.render('home', {
					files:files,
					error: error,
					login: request.session.login,
					avatar: users[0].avatar,
					friends: friends.length ? friends[0].friends : [],
					firstname: users[0].firstname,
					lastname: users[0].lastname,
					storage: Math.ceil(10000 - users[0].storage)
				});
			});
		});
	});
};

/**
* uploadFile - Uploading file using moudle multiparty, checking correction of path,
* 			   checking of user's free space, setting right file extension, if file
* 			   has unknown extension, update user's statistic, checking existence of
* 			   uploaded file and removing if it exists.

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.uploadFile = function (request, response)
{
	if (!request.session.login) return response.redirect('/');
	
	var form = new multiparty.Form();
	var file = {filename: null, size: null, date: null, type: 'file', hash: null, extname: null, path: null, owner: request.session.login};
	var sha1 = crypto.createHash('sha1');
	form.parse(request);

	form.on('field', function (name, value) {
		if (name == 'hash') value = sha1.update(file.filename).digest('hex');
		if (name == 'path') value = getPath(value);
		if (name == 'size') {
			getFreeStorage(request.session.login, function (storage) {
				if (storage < value) is_valid = false;
			});
		}
		file[name] = value;
	});

	form.on('part', function (part) {
		if (part.filename) {
			var out = fs.createWriteStream('storage/' + request.session.login + file.path + '/' + file.hash);
			part.pipe(out);
		}
	});

	form.on('error', function (error) {
		response.status(403).send(error);
	});

	form.on('aborted', function () {
		fs.unlink('storage/' + request.session.login + file.path + '/' + file.hash);
		response.end();
	});

	form.on('close', function() {
		fileExsists(file.filename, request.session.login, file.path, 'file', function (result) {
			if (result) {
				fs.unlink('storage/' + request.session.login + '/' + file.hash);
				response.status(403).send('Ooops! ' + file.filename + ' file currently exsists!');
			}
			else {
				getFreeStorage(request.session.login, function (storage) {
					if (storage < (file.size / 1024 / 1024)) { //MB
						fs.unlink('storage/' + request.session.login + '/' + file.hash);
						response.status(403).send('Ooops! There are no a lot of free storage on your cloud!');
					}
					else {
						setRightExtension(file, function(file) {
							file.general = false;
							var File = new fileModel(file);
							File.save(function (error) {
								if (error) return response.status(403).send('Ooops! Error to database connection. Please check your internet connection!');
								User.find({login: request.session.login}, function (error, users) {
									users[0].storage -= file.size / 1024 / 1024;
									users[0].save(function (error) {
										if (error) return response.status(403).send('Ooops! Error to database connection. Please check your internet connection!');
									});
								});
								Stat.find({owner: request.session.login, month: new Date().getMonth().toLocaleString()}, function (error, stats) {
									if (stats.length) {
										stats[0].uploaded++;
										stats[0].save(function (error) {
											if (error) return response.status(403).send('Ooops! Error to database connection. Please check your internet connection!');
										});
									}
									else {
										var stat = new Stat({owner: request.session.login, month: new Date().getMonth().toLocaleString(), uploaded: 1, deleted: 0, downloaded: 0});
										stat.save(function (error) {
											if (error) return response.status(403).send('Ooops! Error to database connection. Please check your internet connection!');
										});
									}
								});
								response.send({status: 'ok', text: 'Uploading complete!'});
							});
						});
					}
				});
			}
		});
	});
};

/**
* createFolder - Creating new folder, checking existence of old folders within such name

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.createFolder = function (request, response)
{
	if (!request.session.login) return response.redirect('/');
	var path = getPath(request.body.path);
	fileExsists(request.body.filename, request.session.login, path, 'folder', function (result) {
		if (!result) {
			var now = new Date();
			var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
			var folder = {filename: request.body.filename, date: today, general: false, type: "folder", hash: null, extname: 'folder', path: path, owner: request.session.login};
			fs.mkdir('storage/' + request.session.login + path + "/" + folder.filename, 0755);
			var folder = new fileModel(folder);
			folder.save(function (error) {
				if(error) return response.status(403).send(error);
				response.send({status: 'ok', text: 'Vse ok'});
			});
		}
		else return response.status(403).send('Ooops! ' + request.body.filename + ' folder currently exsist');
	});
};

/**
* deleteFile - Remove file, with requested file name, if requested type is folder, this method 
* 			   recursively call non exported method and scanning, deleting and frees users cloud.

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.deleteFile = function (request, response)
{
	if (!request.session.login) return response.redirect('/');
	var path = getPath(request.body.path);

	if (request.body.type == 'file') {
		fileModel.find({filename: request.body.filename, path: path, owner: request.session.login, type: request.body.type} , function (error, files) {
			if (error) return response.status(403).send(error);
			
				fs.unlink('storage/' + request.session.login + path + "/" + files[0].hash, function() {
					User.find({login: request.session.login}, function (error, users) {
						if (error) return response.status(403).send(error);
						users[0].storage += (files[0].size / 1024 / 1024);
						users[0].save(function(error) {
							if (error) return response.status(403).send(error);
						});
					});

					files[0].remove(function (error) {
						if (error) return response.status(403).send(error);
						response.send({status: 'ok'});
					});
				});
		});
	}
	else {
		var pattern = new RegExp(request.session.login + "(\/.*)$", "i");
		removeFilesIntoFolder('storage/' + request.session.login + path + "/" + request.body.filename, pattern, request.session.login, 0, function (errors, free_space) {
			if (errors) return response.status(403).send(errors);

			User.find({login: request.session.login}, function (error, users) {
				if (errors) return response.status(403).send(errors);

				if(users.length) {
					users[0].storage += free_space;
					users[0].save(function(error) {
						if (errors) return response.status(403).send(errors);
					});
				}
				else return response.status(403).send('Ooops! Unknown error, while trying to rename a folder!');
			});

			fs.rmdir('storage/' + request.session.login + path + "/" + request.body.filename, function() {
				fileModel.find({owner: request.session.login, path: '', type: 'folder', filename: request.body.filename}, function (error, files) {
					if (error) return response.status(403).send(error);
						files[0].remove(function (error) {
							if (error) return response.status(403).send(error);
							response.send({status: 'ok'});
						});
				});
			})
		});
	}
};

/**
* downloadFile - Allows download regular file, if user requested folder downloading it
* 				 call reqursive method which scanning directory and packing all files
* 				 into rar archive, using module Archiver.

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.downloadFile = function (request, response)
{

	var login = request.query.login ? request.query.login : request.session.login;

	if (request.query.type == 'file') { 
		if (request.query.page == 'home') {
			if (!request.session.login) return response.redirect('/');

			fileModel.find({filename: request.query.filename, owner: request.session.login, path: request.query.path}, function (error, files) {
				if (error) return response.redirect('/');
				if (files.length) {
					var sha1 = crypto.createHash('sha1').update(request.query.filename).digest('hex');
					response.download('storage/' + login + request.query.path + "/" + sha1, request.query.filename, function (error) {
						if (error) return response.redirect('/');
					});
				}
				else response.redirect('/');
			});
		}
		else if (request.query.page == 'user') {
			fileModel.find({filename: request.query.filename, owner: request.query.login, path: request.query.path, general: true}, function (error, files) {
				if (error) return response.redirect('/');
				if (files.length) {
					var sha1 = crypto.createHash('sha1').update(request.query.filename).digest('hex');
					response.download('storage/' + login + request.query.path + "/" + sha1, request.query.filename, function (error) {
						if (error) return response.redirect('/');
					});
				}
				else response.redirect('/');
			});
		}
	}
	else if (request.query.type == 'folder') {
		
		if (!request.session.login) return response.redirect('/');

		var archiver = require('archiver');
		var output = fs.createWriteStream('storage/' + login + '/' + request.query.filename + '.zip');
		var archive = archiver('zip');
		
		getArchive('storage/' + login + request.query.path + '/' + request.query.filename, login, archive, function (error, archive) {
			archive.finalize();
			archive.pipe(output);
		});

		output.on('close', function() {
			response.download('storage/' + login + '/' + request.query.filename + '.zip', function (error) {
				if (error) return response.redirect('/');
			});
		});

	}
};

/**
* general - Trigger model field which charge for displaying files or folders for another users. 
* 			It allows to make files public or private for users.

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.general = function (request, response)
{
	if (!request.session.login) return response.redirect('/');
	var path = getPath(request.body.path);

	fileModel.find({filename: request.body.filename, type: request.body.type, owner: request.session.login, path: path}, function (error, files) {
		if (error) return response.status(403).send(error);

		if (files.length) {
			files[0].general = files[0].general ? false : true;
			files[0].save(function (error) {
				if (error) return response.status(403).send(error);

				response.send({status: 'ok', result: files[0].general});
			});
		}
		else return response.status(403).send('Ooops! Unknown error, while trying to change file access a ' + request.body.type + '!');
	});
};

/**
* rename - Rename regular file, checking existence of renamed file. If user wants to 
* 		   rename folder it call method which change path model field to renamed, using
* 		   regular expression.

* @param {Object} request
* @param {Object} response
* @api public
**/

exports.rename = function (request, response)
{
	if (!request.session.login) return response.redirect('/');
	var path = getPath(request.body.path);

	if (request.body.type == 'file') {
		fileModel.find({filename: request.body.filename, owner: request.session.login, path: path, type: 'file'}, function (error, files) {
			if (error) return response.status(403).send(error);

			if (files.length) {
				fileModel.find({filename: request.body.rename, owner: request.session.login, path: path, type: 'file'}, function (error, renamedfiles) {
					if (error) return response.status(403).send(error);

					if (renamedfiles.length) return response.status(403).send('Oh, snap! This file currently exsists!');
					else {
						var sha1 = crypto.createHash('sha1').update(request.body.rename).digest('hex');
						fs.rename('storage/' + request.session.login + path + '/' + files[0].hash, 'storage/' + request.session.login + path + '/' + sha1, function() {
							files[0].filename = request.body.rename;
							files[0].hash = sha1;
							files[0].save(function (error) {
								if (error) return response.status(403).send(error);
								response.send({status: 'ok', result: files[0].general});
							});
						});
					}
				});
			}
			else return response.status(403).send('Ooops! Unknown error, while trying to rename a file!');
		});
	}
	else if (request.body.type == 'folder') {
		renameFolder(path, request.body.filename, request.body.rename, request.session.login, function (message) {
			if (message.status == 200) return response.send({status: 'ok', text: message.text});
			if (message.status == 403) return response.status(message.status).send(message.text);
		});
	}
};


/**
* Non exports methods. Every method called into exports methods.
 **/


var getUserFileList = function (login, path, callback)
{
	fileModel.find({owner: login, path: path}, function (error, files) {
		if (error) return callback(error, undefined);
		
		if (files.length) {
			setCorrectTime(files, function (files) {
				return callback(undefined, files);
			})
		}
		else {
			if (path != '') {
				var pattern = new RegExp("^.*\/(.*)$", "i");
				var foldername = pattern.exec(path);
				fileModel.find({owner: login, filename: foldername[1], type:'folder'}, function (error, folders) {
					if (error) return callback(error, undefined);

					if(!folders.length) return callback('Not found', undefined)
				});
			}
			else {
				return callback(error, undefined);
			}
			return callback(undefined, undefined);
		}
	});
};

var setCorrectTime = function (files, callback)
{
	var now = new Date();
	var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes());
	Object.keys(files).forEach(function (index) {
		var years = today.getFullYear() - files[index].date.getFullYear();
		if (years > 0) { files[index].times = "More " + years + " years ago"; return}

		var months = today.getMonth() - files[index].date.getMonth();
		if (months > 0) { files[index].times = "More " + months + " months ago"; return}

		var days = today.getDay() - files[index].date.getDay();
		if (days > 0) { files[index].times = "More " + days + " days ago"; return }

		var hours = today.getHours() - files[index].date.getHours();
		if (hours > 0) { files[index].times = "More " + hours + " hours ago"; return }

		var minutes = today.getMinutes() - files[index].date.getMinutes();
		if (minutes > 0) { files[index].times = "More " + minutes + " minutes ago"; return } 
		
		files[index].times = "Just now";
	}); 
	callback(files);
};

var getFreeStorage = function (login, callback)
{
	User.find({login: login}, function (error, user) {
		if (user.length) {
			return callback(user[0].storage);
		}
	});
};

var renameFolder = function (path, from, to, login, done)
{

	fileModel.find({owner: login, filename: from, type: 'folder', path: path}, function (error, folders) {
		if (error) return done({status: 403, text: error});

		if (folders.length) {
			fileModel.find({owner: login, filename: to, type: 'folder', path: path}, function (error, renamedfolders) {
				if (renamedfolders.length) return done({status: 403, text: 'Oh, snap! This folder currently exsists!'});

				fs.rename('storage/' + login + path + '/' + from, 'storage/' + login + path + '/' + to, function() {
					folders[0].filename = to;
					folders[0].save(function (error) {
						if (error) return done({status: 403, text: error});

						var pattern = new RegExp('^\/(' + from + ')\/?', 'i')
						fileModel.find({owner: login, path: pattern}, function (error, files) {
							for(var i = 0; i < files.length; i++) {
								files[i].path = '/' + to  + files[i].path.substr(from.length + 1);
								files[i].save();
							}
							done({status: 200, text: 'Everything is all right!'});
						});
					});
				});
			});
		}
		else done({status: 403, text: 'Ooops! Unknown error, while trying to rename a folder!'});
	});
};

var getArchive = function (dir, owner, archive, done)
{
	var pattern = new RegExp(owner + "(\/.*)$", "i");

	fs.readdir(dir, function (error, list) {
		var i = -1;
		(function next() {
			i++;
			if (!list[i]) return done(undefined, archive);

			var hash = list[i];
			var file = pather.resolve(dir, list[i]);

			fs.stat(file, function (error, stat) {
				var filepath = pattern.exec(dir);

				if (stat && stat.isDirectory()) {
					getArchive(file, owner, archive, function (errors) {
						if (errors) return done(errors);

						var pattern2 = new RegExp(filepath[1] + "\/(.*)$", "i");
						var foldername = pattern2.exec(file);

						fileModel.find({filename: foldername[1], path: filepath[1], owner: owner, type: 'folder'}, function (error, folders) {
							if (error) return done(error);

							if (folders.length) {
								archive.append(file);
							}
							else return done("Ooops! Error while archiving folder");

							next();
						});
					});
				}
				else {
					fileModel.find({path: filepath[1], owner: owner, hash: hash, type: 'file'}, function (error, files) {
						if (error) return done(error);

						if (files.length) {
							archive.append(file, {name: files[0].filename});
						}
						else return done("Ooops! Error while archiving folder");
						next();
					});
				}
			});
		})();
	});
};

var fileExsists = function (file, owner, path, type, callback)
{
	fileModel.find({filename: file,  owner: owner, path: path, type: type}, function (error, files) {
		if (files.length) callback(true);
		else callback(false);
	});
};

var getPath = function (params)
{
	var path = '';
	if (params != '/home') path = params.substr(5, params.length - 1);
	return path;
};

var removeFilesIntoFolder = function (dir, pattern, owner, free_space, done)
{

	fs.readdir(dir, function (error, list) {
		var i = -1;
		(function next() {
			i++;
			if (!list[i]) return done(undefined, free_space);

			var hash = list[i];
			var file = pather.resolve(dir, list[i]);

			fs.stat(file, function (error, stat) {
				var filepath = pattern.exec(dir);

				if (stat && stat.isDirectory()) {
					removeFilesIntoFolder(file, pattern, owner, free_space, function (errors) {
						if (errors) return done(errors);

						var pattern2 = new RegExp(filepath[1] + "\/(.*)$", "i");
						var foldername = pattern2.exec(file);
						fileModel.find({filename: foldername[1], path: filepath[1], owner: owner, type: 'folder'}, function (error, folders) {
							if (error) return done(error);

							if (folders.length) {
								fs.rmdir(file, function() {
									folders[0].remove(function(error) {
										if (error) return done(error);
									});
									next();
								});
							}
							else return done("Ooops! Error while deleting folder");
						});
					});
				}
				else {
					fileModel.find({hash: hash, path: filepath[1], owner: owner, type: 'file'}, function (error, files) {
						if (error) return done(error);
						fs.unlink(file, function() {
							if (files.length) {
								free_space += (files[0].size / 1024 / 1024);
								files[0].remove(function (error) {
									if (error) return done(error);
								});
							}
							else return done("Ooops! Error while deleting folder");
							next();
						});
					});
				}
			});
		})(); //next
	});
};

var setRightExtension = function (file, callback)
{
	fs.stat('public/img/PNG/' + file.extname + '.png', function (error, stat) {
		if (stat == undefined) file.extname = 'no'
		callback(file);
	});
};