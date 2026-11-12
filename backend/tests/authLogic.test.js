describe("Authentication & Registration Number Logic", () => {
	const mnnitRegex = /^([a-z0-9-]+)\.([0-9]{8})@mnnit\.ac\.in$/i;

	test("should accurately extract 8-digit roll number from valid MNNIT email", () => {
		const email = "suresh.20230000@mnnit.ac.in";
		const match = email.match(mnnitRegex);

		expect(match).not.toBeNull();
		expect(match[1]).toBe("suresh");
		expect(match[2]).toBe("20230000");
	});

	test("should not extract MNNIT roll number for non-MNNIT emails", () => {
		const emails = [
			"student@gmail.com",
			"john.doe@yahoo.com",
			"test@mnnit.com", // wrong domain suffix
			"invalid.123@mnnit.ac.in", // not 8 digits
		];

		emails.forEach((email) => {
			expect(email.match(mnnitRegex)).toBeNull();
		});
	});

	test("should validate email domain against allowed domain lists", () => {
		const isDomainAllowed = (email, allowedDomainsStr) => {
			if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
			const allowed = allowedDomainsStr
				.split(",")
				.map((d) => d.trim().toLowerCase().replace(/^@/, ""))
				.filter(Boolean);

			if (allowed.includes("*") || allowed.length === 0) return true;
			const domain = email.split("@")[1]?.toLowerCase();
			return allowed.includes(domain);
		};

		// Wildcard allows all
		expect(isDomainAllowed("user@gmail.com", "*")).toBe(true);
		expect(isDomainAllowed("suresh.20230000@mnnit.ac.in", "*")).toBe(true);

		// Specific domains only
		const restricted = "mnnit.ac.in,gmail.com";
		expect(isDomainAllowed("test@gmail.com", restricted)).toBe(true);
		expect(isDomainAllowed("suresh.20230000@mnnit.ac.in", restricted)).toBe(true);
		expect(isDomainAllowed("hacker@spamsite.xyz", restricted)).toBe(false);
	});

	test("should format generic registration number correctly for Gmail users", () => {
		const generateGenericId = () => {
			const randomSuffix = Math.floor(100000 + Math.random() * 900000);
			return `GEN${randomSuffix}`;
		};

		const genericId = generateGenericId();
		expect(genericId).toMatch(/^GEN\d{6}$/);
	});
});
