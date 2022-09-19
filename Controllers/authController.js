const { Users } = require('./../Models/userModel')
const { catchAsync } = require('./../Utility/catchAsync')
const { AppError } = require('../Utility/appError')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const csv = require("csvtojson");
const excelToJson = require("convert-excel-to-json");
const path = require("path");

// set up multer for storing uploaded files
const multer = require('multer');
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        cb(null, file.originalname + '-' + Date.now() ) 
    }
});
const upload = multer({ storage: storage }).single('file');

const signToken = (id,email) =>{
    return jwt.sign({ id: id, email: email }, process.env.JWT_SECRETKEY, {
        expiresIn: process.env.JWT_EXPIRESIN,
      });
}

//SignUp API
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

//SignIn API
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

//GetCurrentUser API , Authenticated with Passport JS
const getCurrentUser = catchAsync(async (req, res, next) => {  
  const id = req.user._id
  let currentUser= await Users.findById(id)
  return res.status(200).send({
      status: "success",
      requestAt: req.requestTime,
      user: currentUser
    });
});

//UpdateCurrentUserProfile API , Authenticated with Passport JS
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

//getAllUserList API , Authenticated with Passport JS
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

//UploadFile API , User can upload csv or excel file and save their data.
let newuser = {};
const UploadFile = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    } else {
      if (req.file) {
        const extension = path.extname(req.file.originalname);
        if (extension == ".csv") {
          csv()
            .fromFile(`./uploads/${req.file.filename}`)
            .then(async (response) => {
              //I assume that csv file contains only one record of user(user wise csv file).
              newuser = response[0];

              //store hobbies in array
              let hobbies = (newuser.hobbies).split(',')
              newuser.hobbies = hobbies

              //Default Password for NewUser Default@123
              newuser.password = "Default@123" 
              newuser.Confirmpassword = newuser.password;
              Users.create(newuser, (err, data) => {
                if (err) {
                  return next(new AppError(err.message, 400));
                } else {
                  res.status(201).json({
                    status: "success",
                    requestAt: req.requestTime,
                    data: {
                      newUser: {
                        email : newuser.email,
                        name : newuser.name
                      },
                    },
                    message: "User SignUp Successfully!!",
                  });
                }
              });
            });
        } else if (extension == ".xlsx") {
          const result = excelToJson({
            sourceFile: `./uploads/${req.file.filename}`,
            header: {
              rows: 1,
            },
          });

          //I assume that excel file contains only one record of user with order of attributes
          //name,age,gender,email,city,state,hobbies(user wise excel file).
          newuser.name = result.Sheet1[0].A ;
          newuser.age = result.Sheet1[0].B ;
          newuser.gender = result.Sheet1[0].C ;
          newuser.email = result.Sheet1[0].D ;
          newuser.city = result.Sheet1[0].E ;
          newuser.state = result.Sheet1[0].F ;
          
          //store hobbies in array
          let hobbies = (result.Sheet1[0].G).split(',')
          newuser.hobbies = hobbies

          //Default Password for NewUser Default@123
          newuser.password = "Default@123" 
          newuser.Confirmpassword = newuser.password;

          Users.create(newuser, (err, data) => {
                if (err) {
                  return next(new AppError(err.message, 400));
                } else {
                  res.status(201).json({
                    status: "success",
                    requestAt: req.requestTime,
                    data: {
                      newUser: {
                        email : newuser.email,
                        name : newuser.name
                      },
                    },
                    message: "User SignUp Successfully!!",
                  });
                }
              });
              
        } else {
          return next(new AppError("Please upload csv or excel file", 400));
        }
      }
      else{
        return next(new AppError("Please upload a file", 400));
      }
    }
  });
});

module.exports = { 
    SignUp,
    SignIn,
    getCurrentUser,
    updateCurrentUserProfile,
    getAllUserList ,
    UploadFile
}