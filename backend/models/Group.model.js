import mongoose from "mongoose";

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: function () {
            return `${this.branch} ${this.groupNumber} ${this.year}`;
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

const Group = mongoose.model("Group", groupSchema);

export default Group;
