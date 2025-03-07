import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorhandler.util.js";
import TryCatch from "../utils/TryCatch.util.js";
import User from "../models/User.model.js";

// isAuthenticated function gives the user in the request wherever used - it uses cookie ka jwtToken 

const isAuthenticated = TryCatch(async (req, res, next) => {
    
    const token = req.cookies.jwtToken;

    // console.log(token);
    if (!token) next(new ErrorHandler("Invalid jwt token", 401)); 

    const decoded =  jwt.verify(token, process.env.JWT_SECRET);

    try {
        req.user = await User.findById(decoded._id);

        if (!req.user) return next(new ErrorHandler("User not found", 404));
        
        next();
    }
    catch (err) {
        return next(new ErrorHandler("Invalid or expired Jwt token"), 401);
    }
    
})


export default isAuthenticated; 