
// this utility is for making and sending the jsonwebtoken

import jwt from 'jsonwebtoken'

const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days is the limit we have set for the token , 
    sameSite: "none", 
    httpOnly: true, 
    secure : true , 
}


const sendToken = (res, user, code, message) => {
    try {
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "15d" });

        // console.log("Generated Token:", token);

        return res.status(code)
            .cookie("jwtToken", token, cookieOptions)
            .json({
                success: true,
                message,
            });

    } catch (error) {
        console.error("JWT Error:", error);
        return res.status(500).json({ success: false, message: "Token generation failed" });
    }
};




export default sendToken; 