import mongoose from "mongoose";
import User from "../models/User.model.js";
import Group from "../models/Group.model.js";
import ErrorHandler from "../utils/errorhandler.util.js";
import TryCatch from "../utils/TryCatch.util.js";
import Message from "../models/Message.model.js";
export const assignGroupsToMentors = TryCatch(async (req, res, next) => {
    // you have a array of resigtration numbers in req
    // so for each registration number find user from the User model
    // if user found - create a empty group - in group members push this user - in user mentorOfGroups push group
    // if not found - push it into another array - user not found

    // return the response for this and in that response return the array of not found users .
    

    

    const { registrationNumbers } = req.body; // Array of registration numbers from request
    if (!Array.isArray(registrationNumbers) || registrationNumbers.length === 0) {
        next(new ErrorHandler('Invalid data of registration numbers', 400));
    }

    let notFoundUsers = []; // Store registration numbers of users not found
    let createdGroups = []; // Store successfully created groups

    for (const regNo of registrationNumbers) {
        const user = await User.findOne({ regNo });

        if (!user) {
            notFoundUsers.push(regNo); // Push not found user regNo
            continue; // Skip to next iteration
        }

        // Create empty group
        const newGroup = new Group({
            members: [user._id], // Adding user to members list
            year: 0, // Assuming current year
            groupNumber: 0, // Assigning random group number
            branch: "To be updated " // Placeholder (can be updated later)
        });

        await newGroup.save(); // Save group to DB

        // Add group to user's mentorInGroup array
        user.mentorInGroup.push(newGroup._id);
        await user.save(); // Save user updates

        createdGroups.push(newGroup); // Store created group
    }

    res.status(201).json({
        success: true,
        message: "Groups initialized and assigned",
        createdGroups,
        notFoundUsers
    });
})


export const updateGroupDetails = TryCatch(async (req, res, next) => {
    // this is to update the avatar , groupNumber , branch , year
    // this is to be done by the mentor of this group only .
    
    // check for the user to be mentor of this group is already made as middleware 
    // get the things from the request and update them 
    const { groupId } = req.params;
    const { avatar, groupNumber, branch, year } = req.body;

    let group = await Group.findById(groupId);
    if (!group) {
        return next(new ErrorHandler("Group not found", 404));
    }

    // Updating fields if provided
    if (avatar) {
        group.avatar = avatar;
    }
    if (groupNumber) {
        group.groupNumber = groupNumber;
    }
    if (branch) {
        group.branch = branch;
    }
    if (year) {
        group.year = year;
    }

    // Saving updated group
    await group.save();

    res.status(200).json({
        success: true,
        message: "Group details updated successfully",
        group,
    });
})


// this takes array of regnos 
export const addStudents = TryCatch(async (req, res, next) => {
    const { groupId } = req.params;
    const { registrationNumbers } = req.body; 

    if (!groupId || !registrationNumbers || !Array.isArray(registrationNumbers)) {
        next(new ErrorHandler('Invalid input data' , 400));
    }

    const students = await User.find({ regNo: { $in: registrationNumbers } });

    if (students.length === 0) {

        next(new ErrorHandler('No students with these registration numbers', 404));
    }

    const studentIds = students.map(user => user._id);
    const foundRegNumbers = students.map(user => user.regNo);
    const notFound = registrationNumbers.filter(regNum => !foundRegNumbers.includes(regNum));

    let updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        { $addToSet: { members: { $each: studentIds } } }, // Ensure no duplicate students
        { new: true }
    );

    if (!updatedGroup) {
        next(new ErrorHandler('Group not found', 404)); 
    }

    await User.updateMany(
        { _id: { $in: studentIds } },
        { $addToSet: { studentInGroup: groupId } }
    );

    res.status(200).json({ 
        success: true, 
        message: "Students added successfully.", 
        group: updatedGroup,
        notFound
    });
})


// this takes a single mentor 
export const addMentor = TryCatch(async (req, res, next) => {
    const { groupId } = req.params;
    const { registrationNumber } = req.body;

    if (!groupId || !registrationNumber) {
        next(new ErrorHandler('Invalid input data', 400));

    }

    const mentor = await User.findOne({ regNo: registrationNumber });
    // console.log(mentor);
    
    if (!mentor) {
        next(new ErrorHandler('Mentor not found with this registration number', 404));
    }


    let updatedGroup = await Group.findByIdAndUpdate(
        groupId, 
        { $addToSet: { members: mentor._id } }, 
        {new : true },
    )

    if (!updatedGroup) {
        next('Group not found', 404);
    }

    await User.findByIdAndUpdate(
        mentor._id, 
        {$addToSet :{mentorInGroup :groupId}}
    )

    res.status(200).json({ 
        success: true, 
        message: "Mentor added successfully.", 
        group: updatedGroup
    });


})





export const getAllMembers = TryCatch(async (req, res, next) => {
    const { groupId } = req.params;

    const group = await Group.findById(groupId).populate("members");

    if (!group) {
        next(new ErrorHandler('Group not found', 404));
    }

    res.status(200).json({ success: true, members: group.members });
});


export const getAllMentors = TryCatch(async (req, res, next) => {
    const { groupId } = req.params;

    const mentors = await User.find({ mentorInGroup: groupId });

    if (mentors.length === 0) {
        next(new ErrorHandler('No mentors found in this group', 404));
    }

    res.status(200).json({ success: true, mentors });
});


export const getAllStudents = TryCatch(async (req, res, next) => {
    const { groupId } = req.params;

    const students = await User.find({ studentInGroup: groupId });

    if (students.length === 0) {
        next(new ErrorHandler('No student found in this group.', 404));
    }

    res.status(200).json({ success: true, students });
});
export const getGroups = TryCatch(async (req, res, next) => {
    const user = req.user;  // Retrieved from isAuthenticated middleware

    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find groups where the user is a mentor or a student
    const studentGroups = await Group.find({
        _id: { $in: [user.studentInGroup] }
    });
    const mentorGroups=await Group.find({
        _id: {$in: [user.mentorInGroup] }
    });

    res.status(200).json({
        success: true,
        studentGroups,
        mentorGroups
    });
   
});
export const getMessage = TryCatch(async (req, res, next) => {    
        const { groupId } = req.params;

        // Validate group existence
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Retrieve messages belonging to this group
        const messages = await Message.find({ group: groupId }).populate('sender', 'name email');
        res.status(200).json({
            success: true,
            messages
        });   
});