const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'Please tell us your name!']
    },
    age: {
      type: Number,
      required: [true, 'Please provide your age'],
      integer: true,
      min : 0,
      max : 100 
    },
    gender: {
      type: String,
      required: [true, 'Please provide your gender'],
      enum : {
        values : ['Male','Female','Transgender'],
        message : "gender value is either :- Male,Female,Transgender"
      }
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false
    },
    city: {
      type: String,
      required: [true, 'Please provide a city name']
    },
    state: {
      type: String,
      required: [true, 'Please provide a state name']
    },
    hobbies : {
      type: [String],
      required: [true, 'Please provide your hobbies']
    },
    Confirmpassword: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate : {
        //this validation work only on create or save document not for update document 
        validator : function(el){
          return el === this.password
        },
        message : 'Password and Confirmpassword not same!'
      }
    },
    photo:  {
      data: Buffer,
      contentType: String
    }
  });

//encrypt password  
userSchema.pre('save' , async function(next){
  //only run this function if password was actully modified
  if( !this.isModified('password')) return next();

  // hash the password with cost 12
  this.password = await bcrypt.hash(this.password , 12);

  //delete Confirmpassword field
  this.Confirmpassword = undefined ;
  next();
})

userSchema.methods.ValidatePassword = async function (
  candidatePassword,
  userPassword
){
  return await bcrypt.compare( candidatePassword , userPassword)
};

const Users = mongoose.model('User', userSchema);

module.exports = {Users};