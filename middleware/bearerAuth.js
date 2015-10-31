var passport = require('passport');

module.exports = function(req, res, next) {
    passport.authenticate('bearer', {session: false}, function(err, user) {
        if (err) {
            res.status(401).send('Access token is missing or invalid');
        }
        else {
            if(!user) {
                res.status(401).send('Access token expired');
            }
            else {
                req.user = user;
                next();
            }
        }
    })(req, res, next)
};