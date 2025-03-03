import dotenv from 'dotenv';
dotenv.config(); // 
import express, { application } from 'express';
import mongoose from 'mongoose';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.config.js';
import errorMiddleware from './middlewares/error.middleware.js'
import post from './routes/Post.routes.js'

const app = express();
app.use(cors());
app.use(express.json());
app.use(errorMiddleware);
app.use('/post', post);




const PORT = process.env.PORT || 5000;
app.use(cookieParser);



const server = app.listen(PORT, () => {
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  console.log("");
  connectDB();

  console.log(`listening on port ${PORT} successfully `);
})


process.on("unhandledRejection", err => {
  console.log("error encountered : ", err.message);
  console.log("shutting down the server due to unhandled promise rejection");

  server.close(() => {
    process.exit(1);//
  })
})
// console.log(t);

process.on("uncaughtException", err => {
  console.log("error encountered : ", err.message);
  console.log("shutting down the server due to unhandled promise rejection");
  process.exit(1);
})