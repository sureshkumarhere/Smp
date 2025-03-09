// this middleware checks if the user is mentor of the current group on which he is operating
// also admin can bypass anything

import ErrorHandler from "../utils/errorhandler.util.js";
import TryCatch from "../utils/TryCatch.util.js";


const isMentorOfGroup = TryCatch(async (req, res, next) => {
    // get the mentorOfGroups array from req which already contains the user
    // get the group from the req.params
    // check if the array has this group or not 
    // if contains the group then pass control to next 
    // else call the error handler 
    
    const { mentorInGroup } = req.user;
    const { groupId } = req.params;

    if (req.user.isAdmin) {// admin can do anything.
        next();
    }

    if (!mentorInGroup.includes(groupId)) {
        return next(new ErrorHandler("Only mentor is authorised to perform this action ", 403));
    }

    next();
    
})

export default isMentorOfGroup;