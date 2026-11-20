import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  FaChalkboard,
  FaEraser,
  FaMinus,
  FaPen,
  FaRegCircle,
  FaRegSquare,
  FaTimes,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import { useCall } from "../../hooks/useWebRTC";
import socket from "../../socket/socket";
import {
  DEFAULT_COLOR,
  DEFAULT_WIDTH,
  WHITEBOARD_COLORS,
  createStroke,
  drawStroke,
  extendStroke,
  normalizePoint,
  redrawStrokes,
} from "../../utils/whiteboard";

const TOOLBUTTONS = [
  { id: "pen", label: "Pen", Icon: FaPen },
  { id: "line", label: "Line", Icon: FaMinus },
  { id: "rect", label: "Rectangle", Icon: FaRegSquare },
  { id: "circle", label: "Circle", Icon: FaRegCircle },
  { id: "eraser", label: "Eraser", Icon: FaEraser },
];

const Whiteboard = () => {
  const {
    isWhiteboardOpen,
    whiteboardRoomId: roomId,
    closeWhiteboard,
  } = useCall();
  const currentUser = useSelector((store) => store?.auth);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  const boardRef = useRef(null);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);
  const strokesRef = useRef([]);
  const previewsRef = useRef(new Map());
  const draftRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const lastBroadcastRef = useRef(0);

  // Redraw committed strokes, then transient strokes from other participants.
  const renderAll = useCallback(() => {
    const { width: canvasWidth, height: canvasHeight } = sizeRef.current;
    redrawStrokes(canvasRef.current?.getContext("2d"), strokesRef.current, canvasWidth, canvasHeight);

    const previewCtx = previewRef.current?.getContext("2d");
    if (!previewCtx) return;
    previewCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    previewsRef.current.forEach((stroke) => {
      drawStroke(previewCtx, stroke, canvasWidth, canvasHeight);
    });
    if (draftRef.current) {
      drawStroke(previewCtx, draftRef.current, canvasWidth, canvasHeight);
    }
  }, []);

  // Keep the backing store in sync with CSS size and device pixel ratio.
  const resizeCanvas = useCallback(() => {
    const container = boardRef.current;
    const canvas = canvasRef.current;
    const preview = previewRef.current;
    if (!container || !canvas || !preview) return;

    const cssWidth = container.clientWidth;
    const cssHeight = container.clientHeight;
    if (!cssWidth || !cssHeight) return;

    const dpr = window.devicePixelRatio || 1;
    [canvas, preview].forEach((element) => {
      element.width = Math.round(cssWidth * dpr);
      element.height = Math.round(cssHeight * dpr);
      element.style.width = `${cssWidth}px`;
      element.style.height = `${cssHeight}px`;
      element.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    sizeRef.current = { width: cssWidth, height: cssHeight };
    renderAll();
  }, [renderAll]);

  useEffect(() => {
    resizeCanvas();
    const container = boardRef.current;
    if (!container || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(container);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  // Join the board for this call and keep it in sync with all participants.
  useEffect(() => {
    if (!roomId) return undefined;

    strokesRef.current = [];
    previewsRef.current.clear();
    draftRef.current = null;
    renderAll();

    const belongsToBoard = (incomingRoom) => incomingRoom === roomId;

    const handleInit = ({ roomId: incomingRoom, strokes }) => {
      if (!belongsToBoard(incomingRoom)) return;
      strokesRef.current = Array.isArray(strokes) ? strokes : [];
      renderAll();
    };

    const handleStroke = ({ roomId: incomingRoom, stroke }) => {
      if (!belongsToBoard(incomingRoom) || !stroke?.id) return;
      if (strokesRef.current.some((item) => item.id === stroke.id)) return;
      strokesRef.current.push(stroke);
      renderAll();
    };

    const handlePreview = ({ roomId: incomingRoom, stroke, socketId }) => {
      if (!belongsToBoard(incomingRoom) || !stroke || !socketId) return;
      previewsRef.current.set(socketId, stroke);
      renderAll();
    };

    const handleUndo = ({ roomId: incomingRoom, strokeId }) => {
      if (!belongsToBoard(incomingRoom)) return;
      strokesRef.current = strokesRef.current.filter((item) => item.id !== strokeId);
      renderAll();
    };

    const handleClear = ({ roomId: incomingRoom }) => {
      if (!belongsToBoard(incomingRoom)) return;
      strokesRef.current = [];
      previewsRef.current.clear();
      draftRef.current = null;
      renderAll();
    };

    socket.on("whiteboard:init", handleInit);
    socket.on("whiteboard:stroke", handleStroke);
    socket.on("whiteboard:preview", handlePreview);
    socket.on("whiteboard:undo", handleUndo);
    socket.on("whiteboard:clear", handleClear);
    socket.emit("whiteboard:join", { roomId });

    return () => {
      socket.off("whiteboard:init", handleInit);
      socket.off("whiteboard:stroke", handleStroke);
      socket.off("whiteboard:preview", handlePreview);
      socket.off("whiteboard:undo", handleUndo);
      socket.off("whiteboard:clear", handleClear);
      socket.emit("whiteboard:leave", { roomId });
    };
  }, [roomId, renderAll]);

  const getPoint = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return normalizePoint(event.clientX, event.clientY, rect);
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    canvasRef.current.setPointerCapture(event.pointerId);

    draftRef.current = createStroke({
      tool,
      color,
      width,
      point: getPoint(event),
      authorId: currentUser?._id,
    });
    lastBroadcastRef.current = 0;
    renderAll();
    socket.emit("whiteboard:preview", { roomId, stroke: draftRef.current });
  };

  const handlePointerMove = (event) => {
    if (!draftRef.current) return;
    event.preventDefault();
    if (!extendStroke(draftRef.current, getPoint(event))) return;

    renderAll();
    // Throttle live previews so drawing stays smooth on slower connections.
    const now = Date.now();
    if (now - lastBroadcastRef.current >= 40) {
      lastBroadcastRef.current = now;
      socket.emit("whiteboard:preview", { roomId, stroke: draftRef.current });
    }
  };

  const handlePointerUp = (event) => {
    if (!draftRef.current) return;
    try {
      canvasRef.current.releasePointerCapture(event.pointerId);
    } catch {
      // Capture may already be gone (e.g. pointercancel); safe to ignore.
    }

    const stroke = draftRef.current;
    draftRef.current = null;

    // A click with no drag would render an invisible shape.
    if (!["pen", "eraser"].includes(stroke.tool) && stroke.points.length === 1) {
      const [point] = stroke.points;
      stroke.points.push({
        x: Math.min(1, point.x + 0.002),
        y: Math.min(1, point.y + 0.002),
      });
    }

    strokesRef.current.push(stroke);
    renderAll();
    socket.emit("whiteboard:stroke", { roomId, stroke });
  };

  const handleUndo = () => {
    const strokes = strokesRef.current;
    const myId = currentUser?._id?.toString?.();
    let index = -1;
    for (let i = strokes.length - 1; i >= 0; i -= 1) {
      if (myId && strokes[i].authorId?.toString?.() === myId) {
        index = i;
        break;
      }
    }
    const target = index >= 0 ? strokes[index] : strokes[strokes.length - 1];
    if (!target) return;

    strokesRef.current = strokes.filter((item) => item.id !== target.id);
    renderAll();
    socket.emit("whiteboard:undo", { roomId, strokeId: target.id });
  };

  const handleClear = () => {
    strokesRef.current = [];
    previewsRef.current.clear();
    draftRef.current = null;
    renderAll();
    socket.emit("whiteboard:clear", { roomId });
  };

  if (!isWhiteboardOpen || !roomId) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-6 animate-fadeIn">
      <div className="flex h-[90vh] max-h-[860px] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-richblack-900 shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-richblack-800/60 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-yellow-400/15 p-2 text-yellow-400">
              <FaChalkboard size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white sm:text-base">
                Collaborative Whiteboard
              </h2>
              <p className="font-mono text-[11px] text-yellow-400">
                Live • synced with everyone in this call
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeWhiteboard}
            title="Close Whiteboard"
            aria-label="Close Whiteboard"
            className="rounded-full p-2 text-richblack-200 transition hover:bg-white/10 hover:text-white"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3 sm:gap-4">
          <div className="flex items-center gap-1 rounded-xl bg-richblack-800 p-1">
            {TOOLBUTTONS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTool(id)}
                title={label}
                aria-label={label}
                aria-pressed={tool === id}
                className={`rounded-lg p-2 transition ${
                  tool === id
                    ? "bg-yellow-400 text-richblack-900 shadow-md"
                    : "text-richblack-200 hover:bg-richblack-700 hover:text-white"
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {WHITEBOARD_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                title={`Color ${swatch}`}
                aria-label={`Select color ${swatch}`}
                aria-pressed={color === swatch}
                style={{ backgroundColor: swatch }}
                className={`h-6 w-6 rounded-full border-2 transition ${
                  color === swatch
                    ? "scale-110 border-yellow-400"
                    : "border-white/20 hover:border-white/60"
                }`}
              />
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-richblack-300">
            Size
            <input
              type="range"
              min="2"
              max="14"
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
              className="w-20 accent-yellow-400"
              aria-label="Stroke width"
            />
            <span className="w-4 font-mono text-white">{width}</span>
          </label>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              title="Undo last stroke"
              aria-label="Undo last stroke"
              className="rounded-lg p-2 text-richblack-200 transition hover:bg-richblack-700 hover:text-yellow-400"
            >
              <FaUndo size={15} />
            </button>
            <button
              type="button"
              onClick={handleClear}
              title="Clear board for everyone"
              aria-label="Clear board for everyone"
              className="rounded-lg p-2 text-richblack-200 transition hover:bg-red-500/20 hover:text-red-400"
            >
              <FaTrash size={15} />
            </button>
          </div>
        </div>

        {/* Drawing surface */}
        <div ref={boardRef} className="relative min-h-0 flex-1 bg-richblack-950">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <canvas ref={previewRef} className="pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/55 px-3 py-1.5 text-[11px] text-richblack-200 backdrop-blur-sm">
            {tool === "eraser"
              ? "Drag to erase • changes appear for everyone"
              : "Drag to draw • shapes use start and end points"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
