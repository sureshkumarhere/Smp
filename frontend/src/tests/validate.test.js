import { describe, expect, test } from "vitest";
import {
	checkValidForgotFrom,
	checkValidSignInFrom,
	checkValidSignUpFrom,
	isEmailDomainValid,
} from "../utils/validate";

describe("Frontend Form Validation Unit Tests", () => {
	describe("isEmailDomainValid", () => {
		test("validates standard email address syntax", () => {
			expect(isEmailDomainValid("student@gmail.com")).toBe(true);
			expect(isEmailDomainValid("suresh.20230000@mnnit.ac.in")).toBe(true);
			expect(isEmailDomainValid("not-an-email")).toBe(false);
			expect(isEmailDomainValid("")).toBe(false);
			expect(isEmailDomainValid(null)).toBe(false);
		});
	});

	describe("checkValidSignInFrom", () => {
		test("returns null when email and password meet requirements", () => {
			const error = checkValidSignInFrom("user@example.com", "password123");
			expect(error).toBeNull();
		});

		test("returns error when password is too short", () => {
			const error = checkValidSignInFrom("user@example.com", "12");
			expect(error).toContain("Password should be at least 4 characters");
		});

		test("returns error when email format is invalid", () => {
			const error = checkValidSignInFrom("invalid-email", "password123");
			expect(error).toBeTruthy();
		});
	});

	describe("checkValidSignUpFrom", () => {
		test("allows valid signup with Gmail and optional generic regNo", () => {
			const error = checkValidSignUpFrom(
				"John",
				"Doe",
				"john.doe@gmail.com",
				"pass1234",
				"GEN123456"
			);
			expect(error).toBeNull();
		});

		test("enforces registration number match for MNNIT emails", () => {
			// Matching regNo passes
			const valid = checkValidSignUpFrom(
				"Suresh",
				"Kumar",
				"suresh.20230000@mnnit.ac.in",
				"secret123",
				"20230000"
			);
			expect(valid).toBeNull();

			// Mismatched regNo fails
			const invalid = checkValidSignUpFrom(
				"Suresh",
				"Kumar",
				"suresh.20230000@mnnit.ac.in",
				"secret123",
				"99999999"
			);
			expect(invalid).toContain("Registration number must match");
		});

		test("enforces minimum first name length", () => {
			const error = checkValidSignUpFrom(
				"J",
				"Doe",
				"user@gmail.com",
				"pass1234",
				"20230000"
			);
			expect(error).toContain("First name must have at least 2 characters");
		});

		test("enforces minimum password length", () => {
			const error = checkValidSignUpFrom(
				"John",
				"Doe",
				"user@gmail.com",
				"12",
				"20230000"
			);
			expect(error).toContain("Password must be at least 4 characters");
		});
	});

	describe("checkValidForgotFrom", () => {
		test("accepts valid email and rejects malformed email", () => {
			expect(checkValidForgotFrom("user@example.com")).toBeNull();
			expect(checkValidForgotFrom("bad-email")).toBeTruthy();
		});
	});
});
