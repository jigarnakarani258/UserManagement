const { Users } = require('../Models/userModel');
const passport = require('passport')

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRETKEY;


passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    
    Users.findOne({id: jwt_payload.id , email:jwt_payload.email}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));