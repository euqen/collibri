multiparty = require 'multiparty'
fs = require 'fs'
crypto = require 'crypto'
pather = require 'path'
fileModel = require '../models/files'
User = require '../models/users'
Friends = require '../models/friends'
Stat = require '../models/stat'

###
 # File's methods for exports. Every methods call into routes module.
###

###
* home - Rendering user home page, check path correction

* @param {Object} request
* @param {Object} response
* @api public
###

exports.home = (request, response) ->
	unless request.session.login then return response.redirect '/'
	path = if request.params[0] then request.params[0] else ''

	getUserFileList request.session.login, path, (error, files) ->
		return response.redirect '/' if error

		User.find login: request.session.login, (error, users) ->
			return response.redirect '/' if error

			Friends.find owner: request.session.login, (error, friends) ->
				return response.redirect '/' if error

				response.render 'home',
					files: files
					error: error
					login: request.session.login
					avatar: users[0].avatar
					friends: if friends.length then friends[0].friends else []
					firstname: users[0].firstname
					lastname: users[0].lastname
					storage: Math.ceil 10000 - users[0].storage

###
* uploadFile - Uploading file using moudle multiparty, checking correction of path,
* 			   checking of user's free space, setting right file extension, if file
* 			   has unknown extension, update user's statistic, checking existence of
* 			   uploaded file and removing if it exists.

* @param {Object} request
* @param {Object} response
* @api public
###

exports.uploadfile = (request, response) ->
	unless request.session.login then return response.redirect '/'
	form = new do multiparty.Form
	sha1 = crypro.createHash 'sha1'

	form.parse request

	form.on 'field', (name, value) ->
		if name is 'hash' then value = sha1.update(file.filename).digest 'hex'
		else if name is 'path' then value = getPath value
		else if name is 'size'
			getFreeStorage request.session.login, (storage) ->
				if storage < value then is_valid = false
		file[name] = value

	form.on 'part', (part) ->
		if part.filename
			out = fs.createWriteStream "storage/#{request.session.login}#{file.path}/#{file.hash}"
			part.pipe out
	
	form.on 'error', (error) ->
		response.status(403).send error

	form.on 'aborted', ->
		fs.unlink "storage/#{request.session.login}#{file.path}/#{file.hash}"
		do response.end

	form.one 'close', ->
		fileExsists file.filename, request.session.login, file.path, 'file', (result) ->
			if result
				fs.unlink("storage/#{request.session.login}/#{file.hash}")
				response.status(403).send "Ooops! #{file.filename} file currently exsists!"
			else
				getFreeStorage request.session.login, (storage) ->
					if storage < (file.size / 1024 / 1024)
						fs.unlink "storage/#{request.session.login}/#{file.hash}"
						response.status(403).send 'Ooops! There are no a lot of free storage on your cloud'
					else
						setRightExtension file, (file) ->
							file.general = false
							File = new fileModel file
							File.save (error) ->
								if error then return response.status(403).send 'Ooops! Error to database connection. Please check your internet connection!'
								User.find login:request.session.login, (error, users) ->
									users[0].storage -= file.size / 1024 /1024
									users[0].save (error) ->
										if error then response.status(403).send 'Ooops! Error to database connection. Please check your internet connection!'
								Stat.find owner: request.session.login, month: new Date().getMonth().toLocaleString(), (error, stats) ->
									if stats.length
										stats[0].uploaded++
										stats[0].save (error) ->
											if (error) then response.status(403).send 'Ooops! Error to database connection. Please check your internet connection!'
									else
										stat = new Stat owner: request.session.login, month: new Date().getMonth().toLocaleString(), uploaded: 1, deleted: 0, downloaded: 0
										stat.save (error) ->
											if (error) then response.status(403).send 'Ooops! Error to database connection. Please check your internet connection!'
								response.send status: 'ok', text: 'Uploading complete!'
