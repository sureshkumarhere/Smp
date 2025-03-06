const TryCatch = (passedFunc) => async (req, res, next) => {
    try {
        await passedFunc(req, res, next);
    }
    catch (error) {
        next(error );// this passes the control to the global error handler that is in index file 
        // app.use(errorMiddleware) ke naam se h 
    }
}


export default TryCatch;