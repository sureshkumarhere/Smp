import express from "express";
import { getMyProfile, login, logout, register, sendVerificationEmail, updatePassword, verifyEmail } from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.middleware.js";


const app = express.Router();


app.post("/register", register);
app.post('/login', login);
app.post('/sendVerificationEmail', sendVerificationEmail);
app.post('/verifyEmail', verifyEmail);


app.use(isAuthenticated);// all below these will automatically
//  first use isAuthenticated
app.get('/getmyprofile', getMyProfile); // already equivalent to app.get('/getmyprofile',isAuthenticated ,  getMyProfile);
app.get('/logout', logout);
app.post('/updatepassword', updatePassword);
export default app;