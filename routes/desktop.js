var express = require('express'),
    desktop = express.Router(),
    passport = require('passport'),
    bearer = require('../middleware/bearerAuth'),
    userAPI = require('../actions/publicAPI/user');

module.exports.map = function(app) {
    app.use('/api/v1/auth', desktop);

    desktop.route('/sign-up')
           .post(userAPI.signup);

    desktop.route('/sign-in')
           .post(userAPI.signin);
};