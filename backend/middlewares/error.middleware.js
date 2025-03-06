import ErrorHandler from "../utils/errorhandler.util.js";

 const errorHandler = (err, req, res, next)=>{
    err.statusCode = err.statusCode || 501;
    err.message = err.message || "Internal Server Error";

     // mongodb cast error
     if (err.name === "CastError") {
         const message = `resource not found ${err.path}`;
         err = new ErrorHandler(message, 404);
     }
    // mongoose duplicate key error
     if (err.code === 11000) {
         const message = `Duplicate ${Object.keys(err.keyValue)} Entered `;
         err = new ErrorHandler(message, 400);
     }
    // wrong jwt error
     if (err.name === "JsonWebTokenError") {
         const message = `Json Web Token is invalid , Try again`
         err = new ErrorHandler(message, 400);
     }
     // jwt expire error
     if (err.name === "TokenExpiredError") {
         const message = `Json Web Token is Expired , Try again`
         err = new ErrorHandler(message, 400);
     }
     

     const obj = {
         success: false,
         message: err.message,
         error: err.stack,
     };
    
    res.status(err.statusCode).json({
        success: false,
        message : err.message,
        error: err.stack,
    })
    
}



export default errorHandler;