const { Users } = require('./../Models/userModel')
const { catchAsync } = require('./../Utility/catchAsync')
const { AppError } = require('../Utility/appError')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');

const signToken = (id) =>{
    return jwt.sign({ id: id }, process.env.JWT_SECRETKEY, {
        expiresIn: process.env.JWT_EXPIRESIN,
      });
}

const SignUp = catchAsync ( async (req , res, next) =>{
    const newUser = await Users.create(req.body);
    // const token = signToken(newUser._id);
    res.status(201).json({
        status : 'success',
        //token : token,
        data : {
            newUser : newUser
        },
        message : 'User SignUp Successfully!!'
    })

})

const SignIn = catchAsync(async (req, res, next) => {
   const { email, password } = req.body;

  //1) Check email and password exists.
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2) Check if user exist
  const ValidUser = await Users.findOne({ email: email });
  if (ValidUser) {
    var SignInUser = await Users.findOne({ email: email }).select('+password');
  } else {
    return next(
      new AppError('Invalid User, Please enter valid user email!', 401)
    );
  }

  //3) password is correct
  const CorrectPassword = await ValidUser.ValidatePassword(
    password,
    SignInUser.password
  );
  if (CorrectPassword) {
    const token = signToken(SignInUser._id);
    res.status(200).json({
      status: 'Success',
      token: `Bearer ${token}`,
      message: 'User SignIn successfully!!',
    });
  } else {
    return next(
      new AppError('Invalid password , Please enter valid user password!', 401)
    );
  }

});

module.exports = { 
    SignUp,
    SignIn
}