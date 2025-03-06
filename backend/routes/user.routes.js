import express from "express";
import { login, register, sendVerificationEmail, verifyEmail } from "../controllers/user.controller.js";


const app = express.Router();


app.post("/register", register);
app.post('/login', login);
app.post('/sendVerificationEmail', sendVerificationEmail);
app.post('/verifyEmail', verifyEmail);

export default app;