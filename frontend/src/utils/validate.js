// validate.js

// Sign In validation
export const checkValidSignInFrom = (email, password) => {
	if (!email.endsWith('@mnnit.ac.in')) {
	  return "Only MNNIT email IDs are allowed";
	}
	if (password.length < 4) return "Password should be at least 4 characters";
	return null;
  };
  
  // Sign Up validation
  export const checkValidSignUpFrom = (firstName, lastName, email, password, regNo) => {
	const isFirstValid = /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+/.test(firstName);
	const isLastValid = /\b([A-ZÀ-ÿ][-,a-z. ']+[ ]*)+/.test(lastName);
  
	const emailPattern = /([a-zA-Z0-9._-]+)\@mnnit\.ac\.in$/;
	const match = email.match(emailPattern);
	const emailRegPart = match ? match[1].slice(-8) : null;
	const isEmailValid = match && emailRegPart === regNo;
  
	if (!isFirstValid) return "Invalid First Name format";
	if (!isLastValid) return "Invalid Last Name format";
	if (regNo.length !== 8) return "Registration Number must be exactly 8 characters";
	if (!isEmailValid) return "Email must end with @mnnit.ac.in and include your regNo";
	if (password.length < 4) return "Password must be at least 4 characters";
  
	return null;
  };
  
  // Forgot Password validation
  export const checkValidForgotFrom = (email) => {
	const isEmailValid = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email);
	if (!isEmailValid) return "Invalid email format";
	return null;
  };
  