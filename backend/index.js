import dotenv from 'dotenv';
// dotenv.config({
//   path : "./.env"
// }); //

dotenv.config();
import express from 'express';


import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.config.js';
import errorMiddleware from './middlewares/error.middleware.js'
import postRoutes from './routes/Post.routes.js'
import userRoutes from "./routes/user.routes.js";
import { singleAvatar } from './middlewares/multer.middleware.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded());
app.use(errorMiddleware);
app.use('/post', postRoutes);
app.use('/user',singleAvatar ,  userRoutes);



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