export const WHITEBOARD_TOOLS = ["pen", "line", "rect", "circle", "eraser"];

export const WHITEBOARD_COLORS = [
  "#f7c948", // SMP yellow
  "#ffffff",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#111827",
];

export const DEFAULT_COLOR = "#f7c948";
export const DEFAULT_WIDTH = 4;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createStrokeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

/** Store points normalized to 0..1 so a board renders on any screen size. */
export const normalizePoint = (clientX, clientY, rect) => {
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: clamp((clientX - rect.left) / width, 0, 1),
    y: clamp((clientY - rect.top) / height, 0, 1),
  };
};

export const denormalizePoint = (point, width, height) => ({
  x: (point?.x || 0) * width,
  y: (point?.y || 0) * height,
});

export const createStroke = ({ tool, color, width, point, authorId = "" }) => ({
  id: createStrokeId(),
  tool: WHITEBOARD_TOOLS.includes(tool) ? tool : "pen",
  color: color || DEFAULT_COLOR,
  width: width || DEFAULT_WIDTH,
  points: [point],
  authorId: authorId || "",
});

/** Extend a draft stroke. Shapes keep just their start and end anchors. */
export const extendStroke = (stroke, point, minDistance = 0.002) => {
  if (!stroke || !point || !Array.isArray(stroke.points)) return false;

  if (["line", "rect", "circle"].includes(stroke.tool)) {
    stroke.points[1] = point;
    return true;
  }

  const last = stroke.points[stroke.points.length - 1];
  if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDistance) {
    return false;
  }
  stroke.points.push(point);
  return true;
};

const drawDot = (ctx, point, radius) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
};

/** Render one operation onto a canvas context using CSS-pixel dimensions. */
export const drawStroke = (ctx, stroke, width, height) => {
  if (!ctx || !stroke || !Array.isArray(stroke.points) || stroke.points.length === 0) {
    return;
  }

  const points = stroke.points.map((point) => denormalizePoint(point, width, height));
  const radius = Math.max((stroke.width || DEFAULT_WIDTH) / 2, 1);

  ctx.save();
  ctx.globalCompositeOperation = stroke.tool === "eraser" ? "destination-out" : "source-over";
  ctx.strokeStyle = stroke.color || DEFAULT_COLOR;
  ctx.fillStyle = stroke.color || DEFAULT_COLOR;
  ctx.lineWidth = stroke.width || DEFAULT_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (points.length === 1) {
    drawDot(ctx, points[0], radius);
    ctx.restore();
    return;
  }

  const start = points[0];
  const end = points[points.length - 1];
  ctx.beginPath();

  if (stroke.tool === "rect") {
    ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
  } else if (stroke.tool === "circle") {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    ctx.ellipse(cx, cy, Math.abs(end.x - start.x) / 2, Math.abs(end.y - start.y) / 2, 0, 0, Math.PI * 2);
  } else if (stroke.tool === "line") {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  } else {
    // Freehand / eraser: smooth with quadratic curves through midpoints.
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < points.length - 1; i += 1) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    ctx.lineTo(end.x, end.y);
  }

  ctx.stroke();
  ctx.restore();
};

export const redrawStrokes = (ctx, strokes, width, height) => {
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  (strokes || []).forEach((stroke) => drawStroke(ctx, stroke, width, height));
};
