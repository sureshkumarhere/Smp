import { compare } from "bcrypt";
import User from "../models/User.model.js";
import sendToken from "../utils/sendToken.util.js";
import TryCatch from "../utils/TryCatch.util.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
import VerificationToken from "../models/VerificationToken.model.js";


// create a new user and save it to the database 
const register = async (req, res) => {
    try {
        const { name, password, email, regNo } = req.body;
        
        // const avatar = {
        //     public_id: 'public_id h ye',
        //     url:'abcd', 
        // }

        const user = await User.create({
            name , email , password , regNo ,  
            // avatar: avatar , 
        })

        
        res.status(200).json({ 'message': "registered succesfully " });
    }
    catch(error) {
        res.status(500).json({ 
            message: "Error occurred in registering the user", 
            error: error.message, 
            stack: error.stack  
        });    }
    
};

const login = TryCatch(async (req, res) => {
    // try {


        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password");// as we had done select = false
        // console.log(user);
        // in password in userschema but we need it here so
        // compare is in bcrypt - it takes unencrypted , encrypted data and compares it 
        // console.log(password, " ", user.password);
        const isMatch = await compare(password, user.password); 
        // console.log(isMatch);
        if (!isMatch) {
            return res.status(400).json({ messsage: " Invalid Credentials " }); 
        }

        sendToken(res, user, 200, `Welcome ${user.name} `);
    //  }
    // catch (err) {
    //     console.log('some error occured in login ');
    //     res.status(500).json({ message: "Something went wrong", error: err.message });
    // }
    
})


const getMyProfile = (req, res) => {
    
}


// the below 3 functions are for verifying the email id of the user
// transproter is gitting used in sending the email .



const sendVerificationEmail = TryCatch(async (req, res ) => {
    

    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // console.log(transporter);


    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const token = crypto.randomBytes(32).toString("hex");
    await VerificationToken.create({ userId: user._id, token });

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
        to: user.email,
        subject: "Email Verification",
        html: `<p>Click <a href="${verificationLink}">here</a> to verify your email.</p>`
    });

    res.status(200).json({ message: "Verification email sent" });
});

const verifyEmail = TryCatch(async (req, res) => {
    
    const { token } = req.query;
    
    

    const verificationRecord = await VerificationToken.findOne({ token });
    if (!verificationRecord) return res.status(400).json({ message: "Invalid or expired token" });

    const user = await User.findById(verificationRecord.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    await user.save();
    await VerificationToken.deleteOne({ token });
    

    res.status(200).json({ message: "Email verified successfully" });
});




export { register , login , getMyProfile , sendVerificationEmail , verifyEmail};