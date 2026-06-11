import { describe, it, assert, s, cmd, run, assertOk, assertRejected, assertEventTypes, stateWithFlags } from "./helpers";

// ===========================================================================
// go command — basic mechanics
// ===========================================================================
describe("go command — basic mechanics", () => {
  it("moves to valid exit and records room visited", () => {
    const state = s();
    const result = run(state, cmd("go", { target: "east" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_study");
    assert.ok(result.state.visitedRoomIds.includes("room_study"));
  });

  it("does not consume an investigation turn", () => {
    const result = run(s(), cmd("go", { target: "east" }));
    assert.equal(result.turnSpent, false);
    assert.equal(result.state.turnsRemaining, 9);
  });

  it("records room_entered event", () => {
    const result = run(s(), cmd("go", { target: "east" }));
    assertEventTypes(result, ["room_entered"]);
  });

  it("adds destination to visitedRoomIds on first visit", () => {
    const state = s();
    assert.ok(!state.visitedRoomIds.includes("room_study"));
    const result = run(state, cmd("go", { target: "east" }));
    assert.ok(result.state.visitedRoomIds.includes("room_study"));
  });

  it("does not duplicate visitedRoomIds on re-entry", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;  // to study
    state = run(state, cmd("go", { target: "west" })).state;    // back to hall
    state = run(state, cmd("go", { target: "east" })).state;    // to study again
    const studyCount = state.visitedRoomIds.filter(id => id === "room_study").length;
    assert.equal(studyCount, 1);
  });

  it("returns destination room name in message", () => {
    const result = run(s(), cmd("go", { target: "east" }));
    assert.match(result.message, /Study/);
  });

  it("normalizes direction aliases (e.g. 'study' works)", () => {
    const result = run(s(), cmd("go", { target: "study" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_study");
  });
});

// ===========================================================================
// go command — invalid exits
// ===========================================================================
describe("go command — invalid exits", () => {
  it("rejects with cannot-go message for nonexistent direction", () => {
    const result = run(s(), cmd("go", { target: "up" }));
    assertRejected(result);
    assert.match(result.message, /cannot go that way/i);
  });

  it("rejects with empty target", () => {
    const result = run(s(), cmd("go"));
    assertRejected(result);
  });

  it("does not change state on rejection", () => {
    const state = s();
    const result = run(state, cmd("go", { target: "up" }));
    assert.equal(result.state.currentRoomId, state.currentRoomId);
    assert.equal(result.state.turnsRemaining, state.turnsRemaining);
  });

  it("records command_rejected event on rejection", () => {
    const result = run(s(), cmd("go", { target: "up" }));
    assertEventTypes(result, ["command_rejected"]);
  });
});

// ===========================================================================
// go command — locked exits
// ===========================================================================
describe("go command — locked exits", () => {
  it("blocks bell tower from Great Hall when locked", () => {
    const result = run(s(), cmd("go", { target: "north" }));
    assertRejected(result);
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });

  it("blocks bell tower from Servants' Hall when locked", () => {
    let state = run(s(), cmd("go", { target: "west" })).state; // servants hall
    const result = run(state, cmd("go", { target: "north-east" }));
    assertRejected(result);
    assert.equal(result.state.currentRoomId, "room_servants_hall");
  });

  it("shows failureText from exit definition", () => {
    const result = run(s(), cmd("go", { target: "north" }));
    assert.match(result.message, /tower door is locked/i);
  });

  it("shows failureText for servants hall tower exit", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    const result = run(state, cmd("go", { target: "north-east" }));
    assert.match(result.message, /service stair is locked/i);
  });

  it("does not change currentRoomId on locked attempt", () => {
    const state = s();
    const result = run(state, cmd("go", { target: "north" }));
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });
});

// ===========================================================================
// go command — tower unlock paths
// ===========================================================================
describe("go command — tower unlock paths", () => {
  it("allows bell tower from Great Hall after flag towerUnlocked", () => {
    const state = stateWithFlags({ towerUnlocked: true });
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });

  it("allows bell tower from Servants' Hall after flag towerUnlocked", () => {
    let state = run(s(), cmd("go", { target: "west" })).state; // servants hall
    state = { ...state, flags: { towerUnlocked: true } };
    const result = run(state, cmd("go", { target: "north-east" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });

  it("allows bell tower from Great Hall after flag minaGrantedAccess", () => {
    const state = stateWithFlags({ minaGrantedAccess: true });
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });

  it("allows bell tower from Servants' Hall after flag minaGrantedAccess", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = { ...state, flags: { minaGrantedAccess: true } };
    const result = run(state, cmd("go", { target: "bell tower" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });
});

// ===========================================================================
// go command — all 14 exits reachable
// ===========================================================================
describe("go command — all 14 exits reachable", () => {
  it("great hall → study (east)", () => {
    const result = run(s(), cmd("go", { target: "east" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_study");
  });

  it("great hall → servants hall (west)", () => {
    const result = run(s(), cmd("go", { target: "west" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_servants_hall");
  });

  it("great hall → winter garden (south)", () => {
    const result = run(s(), cmd("go", { target: "south" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_winter_garden");
  });

  it("study → great hall (west)", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const result = run(state, cmd("go", { target: "west" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });

  it("servants hall → great hall (east)", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    const result = run(state, cmd("go", { target: "east" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });

  it("winter garden → great hall (north)", () => {
    let state = run(s(), cmd("go", { target: "south" })).state;
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });

  it("winter garden → coach yard (south)", () => {
    let state = run(s(), cmd("go", { target: "south" })).state;
    const result = run(state, cmd("go", { target: "south" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_coach_yard");
  });

  it("coach yard → winter garden (north)", () => {
    let state = run(s(), cmd("go", { target: "south" })).state;
    state = run(state, cmd("go", { target: "south" })).state;
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_winter_garden");
  });

  it("coach yard → gatehouse (south)", () => {
    let state = run(s(), cmd("go", { target: "south" })).state;
    state = run(state, cmd("go", { target: "south" })).state;
    const result = run(state, cmd("go", { target: "south" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_gatehouse");
  });

  it("gatehouse → coach yard (north)", () => {
    let state = run(s(), cmd("go", { target: "south" })).state;
    state = run(state, cmd("go", { target: "south" })).state;
    state = run(state, cmd("go", { target: "south" })).state;
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_coach_yard");
  });

  it("great hall → bell tower (when unlocked)", () => {
    const state = stateWithFlags({ towerUnlocked: true });
    const result = run(state, cmd("go", { target: "north" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });

  it("bell tower → great hall (south)", () => {
    let state = stateWithFlags({ towerUnlocked: true });
    state = run(state, cmd("go", { target: "north" })).state;
    const result = run(state, cmd("go", { target: "south" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_great_hall");
  });

  it("bell tower → servants hall (south-west)", () => {
    let state = stateWithFlags({ towerUnlocked: true });
    state = run(state, cmd("go", { target: "north" })).state;
    const result = run(state, cmd("go", { target: "south-west" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_servants_hall");
  });

  it("servants hall → bell tower (when unlocked via north-east)", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = { ...state, flags: { towerUnlocked: true } };
    const result = run(state, cmd("go", { target: "north-east" }));
    assertOk(result);
    assert.equal(result.state.currentRoomId, "room_bell_tower");
  });
});
