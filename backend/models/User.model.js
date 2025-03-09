import { hash } from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/^[a-zA-Z0-9._%+-]+@mnnit\.ac\.in$/, 'Invalid MNNIT email format'],
    },
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

    password: {
        type: String,
        required: true,
        minlength: 5,
        default: function () { return this.registrationNumber; },
        select : false,
    },
    isVerified: {   // this is for the verification of the user using his email
        // if he will verify his email once then he will be able to change the password 
        // once he changes his password then he never need not to verify his email again 
        type: Boolean,
        default: false,
    },
    mentorInGroup: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    }],
    studentInGroup: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
    }],
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
    isAdmin: {
        type: Boolean, 
        default : false,
    }
    
});

// this function will always run before saving the object 
userSchema.pre('save', async function (next) {
    // this condition will become true when user will update something ie avatar 
    if (!this.isModified('password')) next(); // if password if not modified then just go to the next function 
    this.password = await hash(this.password, 10); // this hashes the password - hash is from the bcrypt
})

const User = mongoose.model('User', userSchema);

export default User;
