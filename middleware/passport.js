var BearerStrategy = require('passport-http-bearer').Strategy,
    passport = require('passport'),
    User = require('../models/users');

passport.use(new BearerStrategy(
    function(token, callback) {
        User.findOne({token: token}, function(err, user) {
            if (err) {
               return callback(err);
            }

            if (!user) {
                return callback(null, false);
            }

            return callback(null, user);
        })
    }
));

