import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // i removed this default function because it only works for the 
        // first time the object is created 
        // default: function () { 
        //     return `${this.branch} ${this.groupNumber} ${this.year}`;
        // }
    },
    avatar: {
        public_id: {
            type: String, 
            // required: true, 
        },
        url: {
            type: String, 
            // required: true, 
        }
    },
    year: {
        type: Number,
        required: true,
    },
    groupNumber: {
        type: Number,
        required: true,
    },
    branch: {
        type: String,
        required: true,
    },
    members: [{
        type: mongoose.Types.ObjectId,
        ref: 'User',
    }]
}, { timestamps: true });


// as i want to create empty object for the first time when admin makes it and then uses its _id to push in
// the user's - mentorInGroups array - for further use . 
// but from the second time if the object of the group is updated then these fields must be present . 
groupSchema.pre('save', async function (next) {
    if (!this.isNew) {  // Check only during updates
        if (!this.name || !this.year || !this.groupNumber || !this.branch) {
            throw new Error("Fields marked as required must be present when updating.");
        }
        this.name = `${this.branch} Group-${this.groupNumber} ${this.year}`;

    }
    next();
});


const Group = mongoose.model("Group", groupSchema);

export default Group;
