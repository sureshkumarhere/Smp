const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../config/jwtProvider");

const registerUser = async (req, res, next) => {
	let { firstName, lastName, email, password , regNo} = req.body;
	if (!firstName || !lastName || !email || !password || !regNo) {
		return res.status(400).json({ message: "Required: All Fields" });
	}
	const existingEmail = await User.findOne({ email: email });
	if (existingEmail) {
		return res.status(400).json({ message: `User with this email already exists` });
	}

	const existingRegNo = await User.findOne({ regNo: regNo });
	if (existingRegNo) {
		return res.status(400).json({ message: `User with this registration number already exists` });
	}

	password = bcrypt.hashSync(password, 8);
	const userData = new User({
		firstName,
		lastName,
		email,
		password,
		regNo , 
	});
	console.log(userData);
	const user = await userData.save();
	const jwt = generateToken(user._id);
	res.status(200).json({
		message: "Registration Successfully",
		data: { _id: user._id, firstName: user.firstName, email: user.email, regNo: user.regNo },
		token: jwt,
	});
	
};

const loginUser = async (req, res) => {
	let { email, password } = req.body;
	let user = await User.findOne({ email: email });
	if (!user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		return res.status(401).json({ message: "Invalid Password" });
	}
	const jwt = generateToken(user._id);
	user.password = null;
	res.status(200).json({
		message: "Login Successfully",
		data: user,
		token: jwt,
	});
};

module.exports = { registerUser, loginUser };
