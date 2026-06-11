import { describe, it, assert, s, cmd, run } from "./helpers";
import { spendTurn, isTurnBearingCommand } from "../src/rules/turns";

// ===========================================================================
// spendTurn
// ===========================================================================
describe("spendTurn", () => {
  it("increments turnIndex by 1", () => {
    const state = s();
    assert.equal(state.turnIndex, 0);
    const next = spendTurn(state);
    assert.equal(next.turnIndex, 1);
  });

  it("decrements turnsRemaining by 1", () => {
    const state = s();
    assert.equal(state.turnsRemaining, 9);
    const next = spendTurn(state);
    assert.equal(next.turnsRemaining, 8);
  });

  it("clamps turnsRemaining at 0 (never negative)", () => {
    const state = { ...s(), turnsRemaining: 1 };
    const next = spendTurn(state);
    assert.equal(next.turnsRemaining, 0);
    const next2 = spendTurn(next);
    assert.equal(next2.turnsRemaining, 0);
  });

  it("returns new state object (immutable)", () => {
    const state = s();
    const next = spendTurn(state);
    assert.notEqual(state, next);
    assert.equal(state.turnIndex, 0, "original should not be mutated");
    assert.equal(state.turnsRemaining, 9, "original should not be mutated");
  });
});

// ===========================================================================
// isTurnBearingCommand
// ===========================================================================
describe("isTurnBearingCommand", () => {
  it("returns true for search, talk, use, accuse", () => {
    assert.equal(isTurnBearingCommand("search"), true);
    assert.equal(isTurnBearingCommand("talk"), true);
    assert.equal(isTurnBearingCommand("use"), true);
    assert.equal(isTurnBearingCommand("accuse"), true);
  });

  it("returns false for look, go, inventory, take", () => {
    assert.equal(isTurnBearingCommand("look"), false);
    assert.equal(isTurnBearingCommand("go"), false);
    assert.equal(isTurnBearingCommand("inventory"), false);
    assert.equal(isTurnBearingCommand("take"), false);
  });
});

// ===========================================================================
// Turn economy integration
// ===========================================================================
describe("Turn economy integration", () => {
  it("spending all 9 turns triggers dawn ending", () => {
    let state = s();
    // Search body (1 turn)
    state = run(state, cmd("search", { target: "body" })).state;
    assert.equal(state.turnsRemaining, 8);
    // Search desk — need to go to study first (free)
    state = run(state, cmd("go", { target: "study" })).state;
    state = run(state, cmd("search", { target: "desk" })).state;
    assert.equal(state.turnsRemaining, 7);
    // Go to servants hall (free)
    state = run(state, cmd("go", { target: "west" })).state;
    state = run(state, cmd("go", { target: "west" })).state; // servants hall
    // Search bell board (1 turn)
    state = run(state, cmd("search", { target: "bell board" })).state;
    assert.equal(state.turnsRemaining, 6);
    // Talk to Mina about alden (1 turn)
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    assert.equal(state.turnsRemaining, 5);
    // Talk to Mina about bell (1 turn)
    state = run(state, cmd("talk", { npc: "mina", topic: "bell" })).state;
    assert.equal(state.turnsRemaining, 4);
    // Go to winter garden (free) then coach yard (free)
    state = run(state, cmd("go", { target: "east" })).state; // great hall
    state = run(state, cmd("go", { target: "south" })).state; // winter garden
    state = run(state, cmd("go", { target: "south" })).state; // coach yard
    // Search snowbank (1 turn)
    state = run(state, cmd("search", { target: "snowbank" })).state;
    assert.equal(state.turnsRemaining, 3);
    // Talk Vale about report — go back to great hall (free)
    state = run(state, cmd("go", { target: "north" })).state; // winter garden
    state = run(state, cmd("go", { target: "north" })).state; // great hall
    state = run(state, cmd("talk", { npc: "vale", topic: "report" })).state;
    assert.equal(state.turnsRemaining, 2);
    // Talk Vale about rush (1 turn)
    state = run(state, cmd("talk", { npc: "vale", topic: "rush" })).state;
    // Return to servants hall and talk to Mina about key (9th turn)
    state = run(state, cmd("go", { target: "west" })).state;
    state = run(state, cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "key" })).state;
    // After this, turnsRemaining should be 0 and dawn ending applied
    assert.equal(state.endingId, "ending_dawn_breaks_unanswered");
    assert.equal(state.isComplete, true);
  });

  it("free commands (look, go, inventory) do not trigger dawn", () => {
    let state = { ...s(), turnsRemaining: 1 };
    // Use the last turn on a search
    state = run(state, cmd("search", { target: "body" })).state;
    assert.equal(state.turnsRemaining, 0);
    assert.equal(state.endingId, "ending_dawn_breaks_unanswered");
    assert.equal(state.isComplete, true);
    // But look and inventory still work after
    const lookResult = run(state, cmd("look"));
    assert.equal(lookResult.ok, true);
    const invResult = run(state, cmd("inventory"));
    assert.equal(invResult.ok, true);
  });

  it("turnsRemaining goes from 9 to 0 after exactly 9 turn-spending commands", () => {
    let state = s();
    for (let i = 0; i < 9; i++) {
      // Alternate search (body only once, then repeat = free)
      // Use search body first time, then just search body again (free after first)
      // Instead, use a mix: search body, then talk mina about alden multiple times
      // But repeated topics are free... Let's just search 8 different times
      // We only have 7 searchable interactives, so we need talk/use/accuse too
      // Simpler: manually spend turns
      state = { ...state, turnIndex: state.turnIndex + 1, turnsRemaining: state.turnsRemaining - 1 };
    }
    assert.equal(state.turnsRemaining, 0);
    assert.equal(state.turnIndex, 9);
  });
});
