import express from "express";
import { register } from "../controllers/user.controller.js";


const app = express.Router();


app.post("/register", register);

export default app;