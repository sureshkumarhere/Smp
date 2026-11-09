// validate.js

const getAllowedDomains = () => {
  const envVal = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || "*";
  return envVal
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
};

export const isEmailDomainValid = (email) => {
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

export const getEmailDomainErrorMessage = () => {
  const allowed = getAllowedDomains();
  if (allowed.includes("*") || allowed.length === 0) {
    return "Invalid email address format";
  }
  return `Email must be from an allowed domain: ${allowed.map((d) => `@${d}`).join(", ")}`;
};

// Sign In validation
export const checkValidSignInFrom = (email, password) => {
  if (!isEmailDomainValid(email)) {
    return getEmailDomainErrorMessage();
  }
  if (!password || password.length < 4) {
    return "Password should be at least 4 characters";
  }
  return null;
};

// Sign Up validation
export const checkValidSignUpFrom = (firstName, lastName, email, password, regNo) => {
  const isFirstValid = firstName && firstName.trim().length >= 2;

  if (!isFirstValid) return "First name must have at least 2 characters";

  if (!isEmailDomainValid(email)) {
    return getEmailDomainErrorMessage();
  }

  // Registration Number validation
  // If the email follows the MNNIT pattern (name.regNo@mnnit.ac.in)
  const mnnitMatch = email.match(/^([a-z0-9-]+)\.([0-9]{8})@mnnit\.ac\.in$/i);
  if (mnnitMatch) {
    if (regNo && mnnitMatch[2] !== regNo) {
      return "Registration number must match the number in your college email";
    }
  } else {
    // For other domains (e.g. gmail.com), if provided, ensure valid format; if empty, backend auto-generates
    if (regNo && !/^[a-zA-Z0-9_-]{2,20}$/.test(regNo.trim())) {
      return "Registration/ID number must be between 2 and 20 alphanumeric characters";
    }
  }

  if (!password || password.length < 4) {
    return "Password must be at least 4 characters";
  }

  return null;
};

// Forgot Password validation
export const checkValidForgotFrom = (email) => {
  if (!isEmailDomainValid(email)) {
    return getEmailDomainErrorMessage();
  }
  return null;
};
