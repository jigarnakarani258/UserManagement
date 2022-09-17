const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

//global uncaughtException for api
process.on('uncaughtException',err=>{
  console.log(err.name , err.message);
})

mongoose
  .connect(   
    process.env.DATABASE_LOCAL,{                 
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then((con) => {
    console.log('MongoDB Connection done sucessfully!!');
  })
  .catch( err => {
    console.log(err);
  })

// 4) Start server
const app = require('./app');
const server = app.listen(process.env.PORT, 'localhost', (err, address) => {
  if (err) console.log(err);
  console.log(`Server Listening on http://localhost:${process.env.PORT}/`);
});


//global unhandledRejection for api
process.on('unhandledRejection',err=>{
  console.log(err.name , err.message);
  console.log("unhandledRejection")
  server.close( ()=>{
    process.exit(1);
  })
})