import { describe, expect, test, vi } from "vitest";
import {
  DEFAULT_COLOR,
  DEFAULT_WIDTH,
  createStroke,
  denormalizePoint,
  drawStroke,
  extendStroke,
  normalizePoint,
  redrawStrokes,
} from "../utils/whiteboard";

const makeContext = () => ({
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clearRect: vi.fn(),
  rect: vi.fn(),
  ellipse: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
});

describe("Whiteboard drawing utilities", () => {
  test("normalizes canvas coordinates to 0..1 and scales them back", () => {
    expect(normalizePoint(150, 75, { left: 50, top: 25, width: 200, height: 100 })).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(normalizePoint(-50, 500, { left: 0, top: 0, width: 100, height: 100 })).toEqual({
      x: 0,
      y: 1,
    });
    expect(denormalizePoint({ x: 0.25, y: 0.75 }, 800, 400)).toEqual({ x: 200, y: 300 });
  });

  test("creates strokes with defaults and keeps shapes to two anchors", () => {
    const stroke = createStroke({
      tool: "rect",
      color: "#ff0000",
      width: 6,
      point: { x: 0.1, y: 0.1 },
      authorId: "mentor-1",
    });

    expect(stroke.id).toBeTruthy();
    expect(stroke).toMatchObject({
      tool: "rect",
      color: "#ff0000",
      width: 6,
      authorId: "mentor-1",
    });

    expect(extendStroke(stroke, { x: 0.4, y: 0.6 })).toBe(true);
    expect(stroke.points).toEqual([
      { x: 0.1, y: 0.1 },
      { x: 0.4, y: 0.6 },
    ]);

    const fallback = createStroke({ point: { x: 0, y: 0 } });
    expect(fallback.color).toBe(DEFAULT_COLOR);
    expect(fallback.width).toBe(DEFAULT_WIDTH);
    expect(fallback.tool).toBe("pen");
  });

  test("freehand strokes ignore tiny movements", () => {
    const stroke = createStroke({ tool: "pen", point: { x: 0.2, y: 0.2 } });
    expect(extendStroke(stroke, { x: 0.201, y: 0.2 })).toBe(false);
    expect(extendStroke(stroke, { x: 0.3, y: 0.3 })).toBe(true);
    expect(stroke.points).toHaveLength(2);
  });

  test("renders shapes and erasers with the correct canvas operations", () => {
    const ctx = makeContext();
    drawStroke(
      ctx,
      {
        tool: "rect",
        color: "#ffffff",
        width: 2,
        points: [{ x: 0, y: 0 }, { x: 0.5, y: 0.25 }],
      },
      200,
      100
    );

    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 100, 25);
    expect(ctx.stroke).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);

    const eraserCtx = makeContext();
    drawStroke(
      eraserCtx,
      {
        tool: "eraser",
        color: "#ffffff",
        width: 8,
        points: [{ x: 0.1, y: 0.1 }, { x: 0.5, y: 0.5 }, { x: 0.9, y: 0.9 }],
      },
      100,
      100
    );

    expect(eraserCtx.globalCompositeOperation).toBe("destination-out");
    expect(eraserCtx.quadraticCurveTo).toHaveBeenCalled();
  });

  test("redraw clears the canvas before replaying operations", () => {
    const ctx = makeContext();
    const stroke = {
      tool: "line",
      color: "#ffffff",
      width: 2,
      points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
    };

    redrawStrokes(ctx, [stroke], 300, 150);

    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(300, 150);
  });
});
