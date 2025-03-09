import ErrorHandler from "../utils/errorhandler.util.js";

const isAdmin = (req, res, next) => {
    if (req.user.isAdmin) {
        next();
    }
    else {
        next(new ErrorHandler('Only admins can assign groups to mentors', 400));// this takes to global error handler 
    }
}


export default isAdmin;