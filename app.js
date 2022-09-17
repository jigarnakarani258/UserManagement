const express = require('express')
const app = express();
const { userRouter } = require(`${__dirname}/Routes/userRoutes.js`)

const {AppError} =require('./Utility/appError')
const {globalErrController} = require('./Controllers/errorController')
const passport = require('passport')

app.use( express.json() );
app.use( (req , res , next) =>{
    req.requestTime = new Date().toISOString();
    next()       //if you forgot to call next function then response will not get of API
})

//read static file
app.use(express.static(`${__dirname}/public`))
app.use('/app/v1', userRouter)


//passport authentication 
app.use(passport.initialize());
require(`${__dirname}/Utility/passport.js`)


//here app.all use for all method(get,post,put,delete)
//Unhandled Routes Handling 
app.all('*',(req,res,next)=>{
    next(new AppError( `Can not find route ${req.originalUrl} on this server.`,404))
})

//Global error Middleware // Ex->{ next(err)} 
app.use(globalErrController)

module.exports = app;
