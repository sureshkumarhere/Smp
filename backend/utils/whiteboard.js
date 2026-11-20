const { randomUUID } = require("crypto");

// Bound in-memory boards so a long-running server cannot grow forever.
const MAX_STROKES_PER_BOARD = 300;
const MAX_POINTS_PER_STROKE = 1500;
const MAX_BOARDS = 100;
const SUPPORTED_TOOLS = ["pen", "eraser", "line", "rect", "circle"];
const DEFAULT_COLOR = "#f7c948";
const DEFAULT_WIDTH = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Board ids are derived from chat/call ids, or from two user ids for 1-on-1 calls.
 * Keep them short and safe before using them as Socket.IO room names.
 */
const normalizeBoardId = (roomId) => {
	if (roomId === null || roomId === undefined) return null;
	const id = String(roomId).replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 120);
	return id || null;
};

/** Points are normalized (0..1) so the same stroke renders on any screen size. */
const sanitizePoint = (point) => {
	if (!point || typeof point !== "object") return null;
	const x = Number(point.x);
	const y = Number(point.y);
	if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
	return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
};

const sanitizeStroke = (rawStroke, authorId = "") => {
	if (!rawStroke || typeof rawStroke !== "object") return null;

	const rawId = typeof rawStroke.id === "string" ? rawStroke.id : "";
	const id = /^[a-zA-Z0-9_-]{1,80}$/.test(rawId) ? rawId : randomUUID();

	const tool = SUPPORTED_TOOLS.includes(rawStroke.tool) ? rawStroke.tool : "pen";
	const color = /^#[0-9a-fA-F]{6}$/.test(rawStroke.color) ? rawStroke.color : DEFAULT_COLOR;
	const width = clamp(Number(rawStroke.width) || DEFAULT_WIDTH, 1, 24);
	const points = Array.isArray(rawStroke.points)
		? rawStroke.points.map(sanitizePoint).filter(Boolean).slice(0, MAX_POINTS_PER_STROKE)
		: [];

	if (points.length === 0) return null;

	const rawAuthor = typeof rawStroke.authorId === "string" ? rawStroke.authorId : "";
	return {
		id,
		tool,
		color,
		width,
		points,
		authorId: (rawAuthor || String(authorId || "")).slice(0, 80),
	};
};

class WhiteboardStore {
	constructor() {
		this.boards = new Map();
	}

	getStrokes(roomId) {
		const boardId = normalizeBoardId(roomId);
		if (!boardId) return [];
		return [...(this.boards.get(boardId) || [])];
	}

	addStroke(roomId, rawStroke, authorId = "") {
		const boardId = normalizeBoardId(roomId);
		if (!boardId) return null;

		const stroke = sanitizeStroke(rawStroke, authorId);
		if (!stroke) return null;

		if (!this.boards.has(boardId)) {
			// Evict the least recently created board if the server has many stale ones.
			if (this.boards.size >= MAX_BOARDS) {
				const oldestId = this.boards.keys().next().value;
				this.boards.delete(oldestId);
			}
			this.boards.set(boardId, []);
		}
		const strokes = this.boards.get(boardId);
		strokes.push(stroke);
		if (strokes.length > MAX_STROKES_PER_BOARD) strokes.shift();
		return stroke;
	}

	/** Remove a specific stroke (preferred), otherwise the caller's latest stroke. */
	undoStroke(roomId, strokeId, authorId = "") {
		const boardId = normalizeBoardId(roomId);
		if (!boardId) return null;
		const strokes = this.boards.get(boardId);
		if (!strokes || strokes.length === 0) return null;

		let index = -1;
		if (typeof strokeId === "string" && strokeId) {
			index = strokes.findIndex((stroke) => stroke.id === strokeId);
		}
		if (index === -1 && authorId) {
			for (let i = strokes.length - 1; i >= 0; i -= 1) {
				if (strokes[i].authorId === String(authorId)) {
					index = i;
					break;
				}
			}
		}
		if (index === -1) index = strokes.length - 1;

		const [removed] = strokes.splice(index, 1);
		if (strokes.length === 0) this.boards.delete(boardId);
		return removed || null;
	}

	clearBoard(roomId) {
		const boardId = normalizeBoardId(roomId);
		if (boardId) this.boards.delete(boardId);
	}

	deleteBoard(roomId) {
		this.clearBoard(roomId);
	}
}

module.exports = {
	WhiteboardStore,
	sanitizeStroke,
	sanitizePoint,
	normalizeBoardId,
	SUPPORTED_TOOLS,
	DEFAULT_COLOR,
	DEFAULT_WIDTH,
	MAX_STROKES_PER_BOARD,
	MAX_BOARDS,
};
