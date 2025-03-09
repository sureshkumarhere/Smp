import mongoose from "mongoose";
// this is getting used in the email verification of the user 


const verificationTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Token expires in 1 hour
    }
});

const VerificationToken = mongoose.model("VerificationToken", verificationTokenSchema);
export default VerificationToken;
