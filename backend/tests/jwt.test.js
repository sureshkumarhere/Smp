const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_super_secret_jwt_key_12345";
const { generateToken, getUserIdFromToken } = require("../config/jwtProvider");

describe("JWT Provider Unit Tests", () => {
	const sampleUserId = "60c72b2f9b1d8b2badbee5a7";

	test("should generate a valid JWT token string", () => {
		const token = generateToken(sampleUserId);
		expect(typeof token).toBe("string");
		expect(token.split(".").length).toBe(3); // Header.Payload.Signature
	});

	test("should decode the correct userId from generated token", () => {
		const token = generateToken(sampleUserId);
		const decodedId = getUserIdFromToken(token);
		expect(decodedId).toBe(sampleUserId);
	});

	test("should fail when verifying a tampered or invalid token", () => {
		const invalidToken = "invalid.token.payload";
		expect(() => getUserIdFromToken(invalidToken)).toThrow();
	});
});
