import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    regNo: { 
        type: String, 
        required: true, 
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{8}$/.test(v); // Ensures exactly 8 digits
            },
            message: props => `${props.value} is not a valid 8-digit registration number!`
        }
    },
    role: {
        type: String, 
        required: true,   
    }
});

const User = mongoose.model('User', userSchema);

export default User;
