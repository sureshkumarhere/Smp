const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../config/jwtProvider");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// Generates a unique generic registration number if none is available
const resolveRegNo = async (email, providedRegNo = "") => {
	const mnnitMatch = email.match(/^([a-z0-9-]+)\.([0-9]{8})@mnnit\.ac\.in$/i);
	if (mnnitMatch) {
		return mnnitMatch[2];
	}

	if (providedRegNo && String(providedRegNo).trim()) {
		return String(providedRegNo).trim();
	}

	let candidate = "";
	let exists = true;
	let attempts = 0;
	while (exists && attempts < 10) {
		attempts++;
		const randomSuffix = Math.floor(100000 + Math.random() * 900000);
		candidate = `GEN${randomSuffix}`;
		const userWithReg = await User.findOne({ regNo: candidate });
		if (!userWithReg) {
			exists = false;
		}
	}
	return candidate || `GEN${Date.now().toString().slice(-6)}`;
};

const registerUser = async (req, res, next) => {
	let { firstName, lastName, email, password, regNo, accountType } = req.body;
	if (!firstName || !email || !password || !accountType) {
		return res.status(400).json({ message: "Required: All Fields" });
	}
	lastName = lastName ? String(lastName).trim() : "";

	if (!isEmailDomainValid(email)) {
		const allowed = getAllowedDomains();
		return res.status(400).json({
			message: `Registration is only allowed for: ${allowed.map((d) => "@" + d).join(", ")}`,
		});
	}

	// Auto-extract MNNIT roll number or assign generic if missing
	regNo = await resolveRegNo(email, regNo);

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

const googleAuth = async (req, res) => {
	const { token } = req.body;
	if (!token) {
		return res.status(400).json({ message: "Google ID Token is required" });
	}

	let payload;
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: token,
			audience: process.env.GOOGLE_CLIENT_ID,
		});
		payload = ticket.getPayload();
	} catch (err) {
		console.error("Google verifyIdToken error:", err.message);
		return res.status(401).json({ message: "Invalid or expired Google Token" });
	}

	const { email, name, given_name, family_name, picture } = payload;

	if (!isEmailDomainValid(email)) {
		const allowed = getAllowedDomains();
		return res.status(400).json({
			message: `Registration is only allowed for: ${allowed.map((d) => "@" + d).join(", ")}`,
		});
	}

	let user = await User.findOne({ email: email });

	if (!user) {
		// New user -> Auto-register
		let regNo = await resolveRegNo(email);
		const existingReg = await User.findOne({ regNo });
		if (existingReg) {
			regNo = `${regNo}-${Math.floor(100 + Math.random() * 900)}`;
		}

		const firstName = given_name || (name ? name.split(" ")[0] : "Student");
		const lastName = family_name || (name && name.split(" ").slice(1).join(" ")) || "";
		const randomPassword = bcrypt.hashSync(Math.random().toString(36).slice(-10) + Date.now(), 8);

		user = new User({
			firstName,
			lastName,
			email,
			password: randomPassword,
			regNo,
			image: picture || undefined,
			accountType: "student",
		});
		await user.save();
	} else if (picture && (!user.image || user.image.includes("dicebear"))) {
		user.image = picture;
		await user.save();
	}

	const jwt = generateToken(user._id);
	user.password = null;

	return res.status(200).json({
		message: "Google Login Successfully",
		data: user,
		token: jwt,
	});
};

// Reset password controller: verify current password and update to new one
const resetPassword = async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	const fullUser = await User.findById(req.user._id);
	if (!fullUser) {
		return res.status(404).json({ message: "User not found" });
	}
	const isMatch = await bcrypt.compare(currentPassword, fullUser.password);
	if (!isMatch) {
		return res.status(400).json({ message: "Incorrect current password" });
	}
	fullUser.password = bcrypt.hashSync(newPassword, 8);
	await fullUser.save();
	return res.json({ message: "success" });
};

module.exports = { registerUser, loginUser, googleAuth, resetPassword };
