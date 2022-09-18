const { Users } = require('./../Models/userModel')
const { catchAsync } = require('./../Utility/catchAsync')
const { AppError } = require('../Utility/appError')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// set up multer for storing uploaded files
const multer = require('multer');
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + Date.now() ) 
    }
});
const upload = multer({ storage: storage }).single('photo');

const signToken = (id,email) =>{
    return jwt.sign({ id: id, email: email }, process.env.JWT_SECRETKEY, {
        expiresIn: process.env.JWT_EXPIRESIN,
      });
}

const SignUp = catchAsync(async (req, res, next) => {
  upload(req, res, (err) => {
      if(err){
        return next(
          new AppError(err.message, 400)
        );
      }
      else
      {
        const user = new Users({
          name: req.body.name,
          age: req.body.age,
          gender: req.body.gender,
          email: req.body.email,
          password: req.body.password,
          city: req.body.city,
          state: req.body.state,
          hobbies: req.body.hobbies,
          Confirmpassword: req.body.Confirmpassword,
          photo: {
            data: req.file.filename,
            contentType: "image/png",
          },
        });
        user
          .save()
          .then(() => {
            res.status(201).json({
              status: "success",
              requestAt: req.requestTime,
              data: {
                newUser: {
                  id : user._id,
                  email : user.email,
                  name : user.name
                },
              },
              message: "User SignUp Successfully!!",
            });
          })
          .catch(err => {
            return next(
              new AppError(err.message, 400)
            );
          });
      }
         
  });
});

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
    const token = signToken(SignInUser._id , SignInUser.email);
    res.status(200).json({
      status: 'Success',
      requestAt: req.requestTime,
      token: `Bearer ${token}`,
      message: 'User SignIn successfully!!',
    });
  } else {
    return next(
      new AppError('Invalid password , Please enter valid user password!', 401)
    );
  }

});

const getCurrentUser = catchAsync(async (req, res, next) => {  
  const id = req.user._id
  let currentUser= await Users.findById(id)
  return res.status(200).send({
      status: "success",
      requestAt: req.requestTime,
      user: currentUser
    });
});

const updateCurrentUserProfile = catchAsync(async (req, res, next) => { 
  upload(req, res,async (err) => {
      if(err){
        return next(
          new AppError(err.message, 400)
        );
      }
      else
      {
          const id = req.user._id
          let updatedata ;
          if(req.body.password){
            req.body.password = await bcrypt.hash(req.body.password , 12);
          }
          if(req.file){
            updatedata = {
              name: req.body.name,
              age: req.body.age,
              gender: req.body.gender,
              email: req.body.email,
              password: req.body.password,
              city: req.body.city,
              state: req.body.state,
              hobbies: req.body.hobbies,
              Confirmpassword: req.body.Confirmpassword,
              photo: {
                data: req.file.filename,
                contentType: "image/png",
              },
            }
          }
          else{
            updatedata = {
              name: req.body.name,
              age: req.body.age,
              gender: req.body.gender,
              email: req.body.email,
              city: req.body.city,
              password: req.body.password,
              state: req.body.state,
              hobbies: req.body.hobbies,
              Confirmpassword: req.body.Confirmpassword
            };
          }

          let updatedUser = await  Users.findByIdAndUpdate(id,updatedata,{
              new: true,
              runValidators: true,
          });
          if(updatedUser === undefined || updatedUser === "" || updatedUser === null ) 
          {
               return next(new AppError("No user found with that id", 404));
          } 
          else {
            return res.status(200).json({
              status: "Success",
              requestAt: req.requestTime,
              message: `User profile updated successfully!!`,
              updatedUser: updatedUser,
            });
          }
      }         
  }); 
  
});

const getAllUserList = catchAsync(async (req, res, next) => {  
  let userList= await Users.find()

  return res.status(200).send({
    status: "success",
    requestAt: req.requestTime,
    NoResults: userList.length,
    data: {
      users: userList,
    },
  });
});

module.exports = { 
    SignUp,
    SignIn,
    getCurrentUser,
    updateCurrentUserProfile,
    getAllUserList
}