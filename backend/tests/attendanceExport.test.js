describe("Attendance CSV Export Logic Unit Tests", () => {
	const escapeCSV = (field) => {
		if (field === null || field === undefined) return '""';
		const str = String(field).replace(/"/g, '""');
		return `"${str}"`;
	};

	const generateCSV = (meeting, chat) => {
		const headers = [
			"Roll No",
			"Student Name",
			"Email",
			"Attendance Status",
			"Marked At",
			"Meeting Title",
			"Scheduled At",
			"Group Name",
		];

		const rows = (meeting.records || []).map((record) => {
			const student = record.student || {};
			const studentName =
				`${student.firstName || ""} ${student.lastName || ""}`.trim() ||
				student.email ||
				"Student";
			const markedAt = record.markedAt
				? new Date(record.markedAt).toISOString()
				: "Not marked";
			const scheduledAt = meeting.scheduledAt
				? new Date(meeting.scheduledAt).toISOString()
				: "N/A";

			return [
				escapeCSV(student.regNo || "N/A"),
				escapeCSV(studentName),
				escapeCSV(student.email || "N/A"),
				escapeCSV(record.status || "pending"),
				escapeCSV(markedAt),
				escapeCSV(meeting.meetingTitle || "Meeting"),
				escapeCSV(scheduledAt),
				escapeCSV(chat?.chatName || "Group"),
			].join(",");
		});

		return [headers.join(","), ...rows].join("\r\n");
	};

	test("should generate correct CSV headers and format records accurately", () => {
		const mockMeeting = {
			meetingTitle: "Sprint Planning Session",
			scheduledAt: new Date("2026-11-20T10:00:00.000Z"),
			records: [
				{
					student: {
						regNo: "20230001",
						firstName: "Aman",
						lastName: "Gupta",
						email: "aman@mnnit.ac.in",
					},
					status: "present",
					markedAt: new Date("2026-11-20T10:05:00.000Z"),
				},
				{
					student: {
						regNo: "20230002",
						firstName: "Priya",
						lastName: "Sharma",
						email: "priya@mnnit.ac.in",
					},
					status: "absent",
					markedAt: new Date("2026-11-20T10:06:00.000Z"),
				},
			],
		};

		const mockChat = { chatName: "MERN Mentorship Batch 1" };

		const csv = generateCSV(mockMeeting, mockChat);
		const lines = csv.split("\r\n");

		expect(lines.length).toBe(3); // 1 header + 2 student rows
		expect(lines[0]).toBe(
			"Roll No,Student Name,Email,Attendance Status,Marked At,Meeting Title,Scheduled At,Group Name"
		);
		expect(lines[1]).toContain('"20230001","Aman Gupta","aman@mnnit.ac.in","present"');
		expect(lines[1]).toContain('"Sprint Planning Session"');
		expect(lines[1]).toContain('"MERN Mentorship Batch 1"');
		expect(lines[2]).toContain('"20230002","Priya Sharma","priya@mnnit.ac.in","absent"');
	});

	test("should safely escape quotes, commas, and handle missing fields", () => {
		const mockMeeting = {
			meetingTitle: 'Review: "Phase 1, Sprint 2"',
			scheduledAt: null,
			records: [
				{
					student: {
						regNo: null,
						firstName: "Rahul",
						lastName: "",
						email: "rahul@gmail.com",
					},
					status: "pending",
					markedAt: null,
				},
			],
		};

		const mockChat = { chatName: 'Tech, "Alpha" Team' };
		const csv = generateCSV(mockMeeting, mockChat);
		const lines = csv.split("\r\n");

		expect(lines.length).toBe(2);
		expect(lines[1]).toContain('"Review: ""Phase 1, Sprint 2"""');
		expect(lines[1]).toContain('"Tech, ""Alpha"" Team"');
		expect(lines[1]).toContain('"N/A"'); // null regNo falls back to N/A
		expect(lines[1]).toContain('"Not marked"'); // null markedAt falls back
	});
});
