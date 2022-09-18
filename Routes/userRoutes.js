const express = require('express');
const { SignUp , SignIn ,getCurrentUser, updateCurrentUserProfile} = require('../Controllers/authController')
const passport = require('passport')
const userRouter = express.Router();

//authentication User management routes
userRouter.route('/SignUp').post(SignUp)
userRouter.route('/SignIn').post(SignIn)
userRouter.route("/GetCurrentProfile")
  .get( passport.authenticate("jwt", { session: false }), getCurrentUser);
userRouter.route("/UpdateProfile")
  .put( passport.authenticate("jwt", { session: false }), updateCurrentUserProfile);

module.exports.userRouter = userRouter