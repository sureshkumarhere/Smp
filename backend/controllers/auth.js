const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../config/jwtProvider");

const getAllowedDomains = () => {
	const envVal = process.env.ALLOWED_EMAIL_DOMAINS || "*";
	return envVal
		.split(",")
		.map((d) => d.trim().toLowerCase().replace(/^@/, ""))
		.filter(Boolean);
};

const isEmailDomainValid = (email) => {
	if (!email || typeof email !== "string") return false;
	const isBasicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	if (!isBasicEmail) return false;

	const allowedDomains = getAllowedDomains();
	if (allowedDomains.includes("*") || allowedDomains.length === 0) {
		return true;
	}

	const emailDomain = email.split("@")[1]?.toLowerCase();
	return allowedDomains.includes(emailDomain);
};

const registerUser = async (req, res, next) => {
	let { firstName, lastName, email, password, regNo, accountType } = req.body;
	if (!firstName || !lastName || !email || !password || !regNo || !accountType) {
		return res.status(400).json({ message: "Required: All Fields" });
	}

	if (!isEmailDomainValid(email)) {
		const allowed = getAllowedDomains();
		return res.status(400).json({
			message: `Registration is only allowed for: ${allowed.map((d) => "@" + d).join(", ")}`,
		});
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
		regNo,
		accountType,
	});
	console.log(userData);
	const user = await userData.save();
	const jwt = generateToken(user._id);
	res.status(200).json({
		message: "Registration Successfully",
		data: { _id: user._id, firstName: user.firstName, email: user.email, regNo: user.regNo, accountType: user.accountType },
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

// Reset password controller: verify current password and update to new one
const resetPassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	// fetch full user record (including password)
	const fullUser = await User.findById(req.user._id);
	if (!fullUser) {
		return res.status(404).json({ message: "User not found" });
	}
	// verify current password
	const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
	if (!isMatch) {
		return res.status(400).json({ message: "Incorrect current password" });
	}
	// hash and save new password
	fullUser.password = bcrypt.hashSync(newPassword, 8);
	await fullUser.save();
	return res.json({ message: "success" });
};

module.exports = { registerUser, loginUser, resetPassword };
