const {
  WhiteboardStore,
  sanitizeStroke,
  normalizeBoardId,
  MAX_STROKES_PER_BOARD,
  MAX_BOARDS,
} = require("../utils/whiteboard");

const stroke = (id, authorId, points = [{ x: 0.1, y: 0.2 }]) => ({
  id,
  authorId,
  tool: "pen",
  color: "#ffffff",
  width: 4,
  points,
});

describe("Collaborative Whiteboard Store", () => {
  test("normalizes board ids used as socket rooms", () => {
    expect(normalizeBoardId("meeting:65abc123")).toBe("meeting:65abc123");
    expect(normalizeBoardId("direct:aaa_bbb")).toBe("direct:aaa_bbb");
    expect(normalizeBoardId("bad room/id")).toBe("bad_room_id");
    expect(normalizeBoardId(null)).toBeNull();
  });

  test("sanitizes untrusted stroke payloads", () => {
    expect(
      sanitizeStroke({
        id: "stroke-1",
        tool: "rect",
        color: "red",
        width: 999,
        points: [{ x: 2, y: -1 }, { x: "bad", y: 0.5 }, { x: 0.8, y: 0.9 }],
      })
    ).toEqual({
      id: "stroke-1",
      tool: "rect",
      color: "#f7c948",
      width: 24,
      points: [{ x: 1, y: 0 }, { x: 0.8, y: 0.9 }],
      authorId: "",
    });

    expect(sanitizeStroke({ points: [] })).toBeNull();
    expect(sanitizeStroke(null)).toBeNull();
  });

  test("stores strokes and replays them to late joiners", () => {
    const store = new WhiteboardStore();
    const first = stroke("one", "mentor");
    const second = stroke("two", "student");

    expect(store.addStroke("meeting:m1", first)).toMatchObject({ id: "one" });
    store.addStroke("meeting:m1", second);

    expect(store.getStrokes("meeting:m1").map((item) => item.id)).toEqual([
      "one",
      "two",
    ]);
    expect(store.getStrokes("meeting:other")).toEqual([]);
  });

  test("undo removes the requested stroke or the author's latest one", () => {
    const store = new WhiteboardStore();
    store.addStroke("meeting:m1", stroke("one", "mentor"));
    store.addStroke("meeting:m1", stroke("two", "student"));
    store.addStroke("meeting:m1", stroke("three", "student"));

    expect(store.undoStroke("meeting:m1", "one", "student").id).toBe("one");
    expect(store.undoStroke("meeting:m1", undefined, "student").id).toBe("three");
    expect(store.getStrokes("meeting:m1").map((item) => item.id)).toEqual(["two"]);
  });

  test("clear wipes a board and stroke history stays bounded", () => {
    const store = new WhiteboardStore();
    for (let i = 0; i < MAX_STROKES_PER_BOARD + 5; i += 1) {
      store.addStroke("meeting:m1", stroke(`s${i}`, "mentor"));
    }

    expect(store.getStrokes("meeting:m1")).toHaveLength(MAX_STROKES_PER_BOARD);
    expect(store.getStrokes("meeting:m1")[0].id).toBe("s5");

    store.clearBoard("meeting:m1");
    expect(store.getStrokes("meeting:m1")).toEqual([]);
  });

  test("evicts the oldest board when the server holds too many", () => {
    const store = new WhiteboardStore();
    for (let i = 0; i <= MAX_BOARDS; i += 1) {
      store.addStroke(`meeting:m${i}`, stroke(`s${i}`, "mentor"));
    }

    expect(store.boards.size).toBe(MAX_BOARDS);
    expect(store.getStrokes("meeting:m0")).toEqual([]);
    expect(store.getStrokes(`meeting:m${MAX_BOARDS}`)).toHaveLength(1);
  });
});
