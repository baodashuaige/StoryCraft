import { describe, it, assert, s, cmd, run, assertOk, assertEventTypes } from "./helpers";

// ===========================================================================
// look command
// ===========================================================================
describe("look command — basics", () => {
  it("returns ok true with turnSpent false", () => {
    const result = run(s(), cmd("look"));
    assert.equal(result.ok, true);
    assert.equal(result.turnSpent, false);
  });

  it("includes room description in message", () => {
    const result = run(s(), cmd("look"));
    assert.ok(result.message.includes("cold central hall"));
  });

  it("lists exits in the message", () => {
    const result = run(s(), cmd("look"));
    assert.match(result.message, /Exits:/i);
    assert.match(result.message, /east/i);
    assert.match(result.message, /west/i);
    assert.match(result.message, /south/i);
  });

  it("includes 'Present:' line when NPC is in room", () => {
    const result = run(s(), cmd("look"));
    assert.match(result.message, /Present:/i);
    assert.match(result.message, /Vale/i);
  });

  it("records a 'looked' event", () => {
    const result = run(s(), cmd("look"));
    assertEventTypes(result, ["looked"]);
  });

  it("does not change state (no turn spent, no room change)", () => {
    const state = s();
    const result = run(state, cmd("look"));
    assert.equal(result.state.currentRoomId, state.currentRoomId);
    assert.equal(result.state.turnsRemaining, state.turnsRemaining);
  });
});

describe("look command — different rooms", () => {
  it("look in Study shows different description than Great Hall", () => {
    let state = s();
    state = run(state, cmd("go", { target: "study" })).state;
    const result = run(state, cmd("look"));
    assert.ok(result.message.includes("Alden's private office"));
    assert.ok(!result.message.includes("cold central hall"));
  });

  it("look after go to Servants' Hall shows Mina as present", () => {
    let state = s();
    state = run(state, cmd("go", { target: "west" })).state;
    const result = run(state, cmd("look"));
    assert.match(result.message, /Present:/i);
    assert.match(result.message, /Mina/i);
  });

  it("look in Bell Tower (empty room) has no Present line", () => {
    const state = {
      ...s(),
      currentRoomId: "room_bell_tower",
      visitedRoomIds: ["room_great_hall", "room_bell_tower"],
      flags: { towerUnlocked: true }
    };
    const result = run(state, cmd("look"));
    assert.ok(result.message.includes("cramped tower chamber"));
    assert.ok(!result.message.includes("Present:"));
  });

  it("look in Gatehouse shows Gatehouse description", () => {
    const state = {
      ...s(),
      currentRoomId: "room_gatehouse",
      visitedRoomIds: ["room_great_hall", "room_winter_garden", "room_coach_yard", "room_gatehouse"]
    };
    const result = run(state, cmd("look"));
    assert.ok(result.message.includes("outer gate creaks"));
  });

  it("look after NPC moves (Theo to Great Hall) shows updated NPC presence", () => {
    const state = {
      ...s(),
      currentRoomId: "room_great_hall",
      visitedRoomIds: ["room_great_hall"],
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_great_hall" }
    };
    const result = run(state, cmd("look"));
    assert.match(result.message, /Present:/i);
    assert.match(result.message, /Theo/i);
  });
});

describe("look command — after game complete", () => {
  it("is still allowed post-game (look is a review command)", () => {
    let state = s();
    state = run(state, cmd("accuse", { npc: "mina" })).state;
    assert.equal(state.isComplete, true);
    const result = run(state, cmd("look"));
    assert.equal(result.ok, true);
    assert.equal(result.turnSpent, false);
  });
});
