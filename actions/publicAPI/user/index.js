var User = require('../../../models/users');
var fs = require('fs');
var crypto = require('crypto');
var fstream = require('fstream');
var Friends = require('../../../models/friends');

exports.signup = function (request, response) {
    User.find({$or: [{email: request.body.email}, {login: request.body.login}]}, function (error, users) {
        if (error) {
            return response.send(500, {error:error});
        }

        if (users.length)  {
            return response.send(500, {error: "Ooops! Login or e-mail already exsists!"});
        }

        var user = new User(request.body);
        user.passwords(request.body.password, request.body.passwordRepeat, function (error) {
            if (error) {
                return response.send(500, {error:error});
            }

            user.makePasswordHashed(request.body.password);
            user.avatar = 'no-avatar.gif';
            user.storage = 10000;

            user.generateAccessToken(function(token) {
                if (token) {
                    user.token = token;
                }
                else {
                    return response.send(500, 'Error while generating secure token');
                }

                user.create(function (error) {
                    if (error) {
                        return response.send(500, {error:error});
                    }

                    var friends = new Friends({owner: user.login, friends: []});
                    friends.save();

                    request.session.login = user.login;
                    fs.mkdir('storage/' + user.login, 0755);
                    response.send(200, {user:user});
                });
            });
        });
    });
};

exports.signin = function (request, response) {
    var sha1 = crypto.createHash('sha1').update(request.body.password).digest('hex');
    User.find({login: request.body.login, password: sha1}, function (error, users) {
        if (error) {
            response.status(500).send({error: "Ooops! Error at database connection!"});
            return console.error(error);
        }
        if (users.length) {
            request.session.login = users[0].login;
            response.status(200).send(user[0]);
        }
        else response.status(500).send({error: "Ooops! Login or password is invalid!"});
    });
};