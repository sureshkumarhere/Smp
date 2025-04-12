export const checkValidSignInFrom = (email, password) => {
	// valid email and return different different values depending----------
	if (!email.endsWith('@mnnit.ac.in')) {
		return res.status(400).json({ error: 'Only MNNIT email IDs are allowed' });
	}
	if (password.length < 4) return "Invalid password";
	return null;
};


export const checkValidSignUpFrom = (firstName, lastName, email, password, regNo) => {
	const isFirstValid = /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+/.test(firstName);
	const isLastValid = /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+/.test(lastName);


	// Extract 8 chars before @mnnit.ac.in
	const emailPattern = /([a-zA-Z0-9._-]+)\@mnnit\.ac\.in$/;
	const match = email.match(emailPattern);
	const emailRegPart = match ? match[1].slice(-8) : null;
	const isEmailValid = match && emailRegPart === regNo;
	console.log(regNo.length);
	if (!isFirstValid) return "Invalid FirstName Format";
	if (!isLastValid) return "Invalid LastName Format";
	if (regNo.length!=8) return "Registration Number must be exactly 8 digits";
	if (!isEmailValid) return "Email must end with @mnnit.ac.in and contain regNo before it";
	if (password.length < 4) return "Min 4 characters";


	return null;
};

export const checkValidForgotFrom = (email) => {
	const isEmailValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
		email
	);
	if (!isEmailValid) return "Invalid email format";
	return null;
};
