import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, executeCommand } from "../src";
import type { WorldState } from "../src";

test("searching a valid current-room target discovers a clue and spends one turn", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "search", target: "body" });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, true);
  assert.equal(result.state.turnIndex, 1);
  assert.equal(result.state.turnsRemaining, 8);
  assert.equal(result.state.currentRoomId, "room_great_hall");
  assert.equal(
    result.state.discoveredCluesById.clue_watch_stopped_1147,
    "standard"
  );
  assert.deepEqual(result.state.searchedInteractiveIds, [
    "int_great_hall_body"
  ]);
  assert.deepEqual(
    result.events.map((event) => event.type),
    ["search_resolved", "clue_discovered", "turn_spent"]
  );
});

test("repeating the same search does not spend another turn or change clue state", () => {
  const state = createInitialState();
  const first = executeCommand(state, { verb: "search", target: "body" });
  const second = executeCommand(first.state, { verb: "search", target: "body" });

  assert.equal(second.ok, true);
  assert.equal(second.turnSpent, false);
  assert.equal(second.state.turnIndex, 1);
  assert.equal(second.state.turnsRemaining, 8);
  assert.deepEqual(second.state.discoveredCluesById, {
    clue_watch_stopped_1147: "standard"
  });
  assert.deepEqual(second.state.searchedInteractiveIds, [
    "int_great_hall_body"
  ]);
  assert.match(second.message, /already/i);
});

test("searching a missing target fails without spending a turn", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "search", target: "portrait" });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnIndex, 0);
  assert.equal(result.state.turnsRemaining, 9);
  assert.deepEqual(result.state.discoveredCluesById, {});
  assert.deepEqual(result.state.searchedInteractiveIds, []);
});

test("searching an interactive from another room fails", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "search", target: "desk" });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.currentRoomId, "room_great_hall");
  assert.equal(result.state.turnsRemaining, 9);
  assert.deepEqual(result.state.discoveredCluesById, {});
});

test("searching when no turns remain is rejected before clue discovery", () => {
  const state: WorldState = {
    ...createInitialState(),
    turnsRemaining: 0
  };
  const result = executeCommand(state, { verb: "search", target: "body" });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnIndex, 0);
  assert.equal(result.state.turnsRemaining, 0);
  assert.deepEqual(result.state.discoveredCluesById, {});
  assert.deepEqual(result.state.searchedInteractiveIds, []);
  assert.match(result.message, /no time/i);
});

test("search can reveal an item id without taking it", () => {
  const state = executeCommand(createInitialState(), {
    verb: "go",
    target: "east"
  }).state;
  const result = executeCommand(state, { verb: "search", target: "desk" });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, true);
  assert.equal(
    result.state.discoveredCluesById.clue_stolen_design_motive,
    "standard"
  );
  assert.deepEqual(result.state.discoveredItemIds, ["item_torn_ledger_page"]);
  assert.deepEqual(result.state.inventoryItemIds, []);
});
