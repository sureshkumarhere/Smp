import { describe, expect, test } from "vitest";
import authReducer, { addAuth, removeAuth } from "../redux/slices/authSlice";

describe("Redux Auth Slice Unit Tests", () => {
	const initialState = null;

	test("should return initial state when passed an empty action", () => {
		const state = authReducer(undefined, { type: "" });
		expect(state).toBeNull();
	});

	test("should handle addAuth to store authenticated user data", () => {
		const userPayload = {
			_id: "user123",
			firstName: "Suresh",
			lastName: "Kumar",
			email: "suresh.20230000@mnnit.ac.in",
			regNo: "20230000",
			accountType: "mentor",
		};

		const nextState = authReducer(initialState, addAuth(userPayload));
		expect(nextState).toEqual(userPayload);
		expect(nextState.email).toBe("suresh.20230000@mnnit.ac.in");
	});

	test("should handle removeAuth to reset user state on logout", () => {
		const loggedInState = {
			_id: "user123",
			firstName: "Suresh",
		};

		const nextState = authReducer(loggedInState, removeAuth());
		expect(nextState).toBeNull();
	});
});
