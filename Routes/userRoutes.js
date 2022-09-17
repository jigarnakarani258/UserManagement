const express = require('express');
const { SignUp , SignIn} = require('../Controllers/authController')
const passport = require('passport')
const userRouter = express.Router();

//authentication User management routes
userRouter.route('/SignUp').post(SignUp)
userRouter.route('/SignIn').post(SignIn)
userRouter
  .route("/SignIn")
  .get(passport.authenticate("jwt", { session: false }), (req, res) => {
    return res.status(200).send({
      status: "success",
      user: req.user,
    });
  });

module.exports.userRouter = userRouter