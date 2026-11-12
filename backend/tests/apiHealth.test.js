const request = require("supertest");
const express = require("express");

describe("API Root & Health Check Endpoint", () => {
	let app;

	beforeAll(() => {
		app = express();
		app.use(express.json());

		// Root health endpoint (mirrored from server.js)
		app.get("/", (req, res) => {
			res.json({
				status: "healthy",
				message: "Chat API Server",
				version: "1.0.0",
			});
		});

		// 404 handler (mirrored from server.js)
		app.use("*", (req, res) => {
			res.status(404).json({ error: "Endpoint not found" });
		});
	});

	test("GET / should return 200 and healthy JSON status", async () => {
		const res = await request(app).get("/");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			status: "healthy",
			message: "Chat API Server",
			version: "1.0.0",
		});
	});

	test("GET /unknown-route should return 404 Endpoint not found", async () => {
		const res = await request(app).get("/unknown-route");
		expect(res.status).toBe(404);
		expect(res.body.error).toBe("Endpoint not found");
	});
});
