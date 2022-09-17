const { AppError } = require('../Utility/appError');

const sendErrToDevlopment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrToProduction = (err, res) => {
  //Operational,trusted error : send message to client
  if (err.isOperational == true) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //programming and unknown error: don't leak error details.
    //1)Log error
    console.error('Error', err);

    //2)send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

const HandleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};

const HandleDuplicateFieldsDB = (err) => {
  //console.log(err.keyValue)
  const message = `Duplicate field value: ${err.keyValue.email} , user email already exist`;
  return new AppError(message, 400);
};

const HandleValidationErrorDB = (err) => {
  //console.log(err.properties)
  const errMessage = Object.values(err.errors).map(
    (el) => el.properties.message
  );
  const message = `Input valid value: ${errMessage.join(' , ')}`;
  return new AppError(message, 400);
};

//Global error Middleware 
const globalErrController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'devlopment') {
    sendErrToDevlopment(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //here moongose err object store into error
    let error = { ...err };
    if (err.name === 'CastError') {
      error = HandleCastErrorDB(error);
    }
    if (err.code === 11000) {
      error = HandleDuplicateFieldsDB(error);
    }
    if (err.name === 'ValidationError') {
      error = HandleValidationErrorDB(error);
    }

    sendErrToProduction(err, res);
  }
};

module.exports = { globalErrController };
