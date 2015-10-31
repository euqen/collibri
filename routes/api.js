var express = require('express'),
    user = require('../controllers/user'),
    file = require('../controllers/file'),
    api = express.Router();

module.exports.map = function(app) {

    api.route('/')
        .post(user.singin);

    api.route('/register')
        .post(user.signup);

    api.route('/edit')
       .post(user.update);

    api.route('/search')
       .post(user.getUsers);

    api.route('/private')
       .post(user.updatePasswords);

    api.route('/friendsActions')
       .post(user.friendsActions);

    api.route('/uploadFile')
       .post(file.uploadFile);

    api.route('/createFolder')
       .post(file.createFolder);

    api.route('/deleteFile')
        .post(file.deleteFile);

    api.route('/downloadFile')
       .get(file.downloadFile);

    api.route('/general')
       .post(file.general);

    api.route('/rename')
       .post(file.rename);

    app.use(api);
};