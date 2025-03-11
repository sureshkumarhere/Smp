import dotenv from 'dotenv';
// dotenv.config({
//   path : "./.env"
// }); //
import http, { get } from 'http';
dotenv.config();
import express from 'express';
import {Server} from 'socket.io';
import Message from './models/Message.model.js';
import Group from './models/Group.model.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.config.js';
import errorMiddleware from './middlewares/error.middleware.js'
import postRoutes from './routes/Post.routes.js'
import userRoutes from "./routes/user.routes.js";
import groupRoutes from './routes/group.routes.js'
import { singleAvatar } from './middlewares/multer.middleware.js';
import seedUsers from './seeders/user.seeder.js';
import TryCatch from './utils/TryCatch.util.js';
import { group } from 'console';
const app = express();
const server1=http.createServer(app);
const io=new Server(server1,{
  cors:{
    origin:"*",
    methods:["GET","POST"]
  }
});
const activeCalls={};
io.on("connection",(socket)=>{
  console.log("user conected");
  socket.on("joinGroup",(groupId)=>{
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });
  socket.on("sendMessage",TryCatch(async (groupId,senderId,content,attachments)=>{
    
      const group=await Group.findById(groupId);
      if (!group){
        return socket.emit("Group not found");
      }
      const newMessage = new Message({
        sender: senderId,
        group: groupId,
        content: content,
        attachments:attachments
    });
      await newMessage.save();
      io.to(groupId).emit("receiveMessage",{
        _id: newMessage._id,
        sender: senderId,
        group: groupId,
        content: content,
        attachments:attachments,
        //can send timestamp to.....
      });
  }));
  socket.on("startCall", ({ groupId, userId, isMentor }) => {
    if (!isMentor) return; // Only mentors can start calls
    if (activeCalls[groupId]) return; // Call already active

    activeCalls[groupId] = { mentors: [userId], participants: [socket.id] };
    socket.join(`video_${groupId}`); // Join video call room
    io.to(`video_${groupId}`).emit("callStarted", { groupId });
  });

  // --- JOIN VIDEO CALL ---
  socket.on("joinCall", ({ groupId, userId, isMentor }) => {
    if (!activeCalls[groupId]) return; // No active call exists

    socket.join(`video_${groupId}`);

    if (isMentor && !activeCalls[groupId].mentors.includes(userId)) {
      activeCalls[groupId].mentors.push(userId);
    }
    
    activeCalls[groupId].participants.push(socket.id);

    io.to(`video_${groupId}`).emit("userJoined", { userId, socketId: socket.id });
  });

  // --- HANDLE WEBRTC SIGNALING ---
  socket.on("offer", ({ groupId, offer, senderId }) => {
    socket.to(`video_${groupId}`).emit("offer", { senderId, offer });
  });

  socket.on("answer", ({ groupId, answer, senderId }) => {
    socket.to(`video_${groupId}`).emit("answer", { senderId, answer });
  });

  socket.on("iceCandidate", ({ groupId, candidate }) => {
    socket.to(`video_${groupId}`).emit("iceCandidate", candidate);
  });

  // --- LEAVE VIDEO CALL ---
  socket.on("leaveCall", ({ groupId, userId, isMentor }) => {
    if (!activeCalls[groupId]) return;

    activeCalls[groupId].participants = activeCalls[groupId].participants.filter(s => s !== socket.id);

    if (isMentor) {
      activeCalls[groupId].mentors = activeCalls[groupId].mentors.filter(m => m !== userId);
      if (activeCalls[groupId].mentors.length === 0) {
        io.to(`video_${groupId}`).emit("callEnded", { groupId });
        delete activeCalls[groupId];
      }
    }

    socket.leave(`video_${groupId}`);
    io.to(`video_${groupId}`).emit("userLeft", { userId, socketId: socket.id });
  });
  //--HANDLE ENDCALL--//
  socket.on("endcall",({groupId,userId,isMentor})=>{
    if(!isMentor)return;
    io.to(`video_${groupId}`).emit("callEnded",{groupId});
    delete activeCalls[groupId];
  });
  // --- HANDLE DISCONNECT ---
  socket.on("disconnect", () => {
    console.log(`${socket.id} has disconnected...`);
  });
});
app.use(cors());
app.use(express.json());
app.use(cookieParser());
// app.use(express.urlencoded());
app.use(errorMiddleware);
app.use('/post', postRoutes);
app.use('/group', groupRoutes);
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
  // seedUsers(30);    // if you want to add users into your database - every thing is already configured correctly 

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