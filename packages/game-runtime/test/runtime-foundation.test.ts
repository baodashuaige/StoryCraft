import test from "node:test";
import assert from "node:assert/strict";
import {
  createInitialState,
  executeCommand,
  frostmereAdventure,
  getVisibleState
} from "../src";

test("createInitialState returns independent fresh states", () => {
  const first = createInitialState();
  const second = createInitialState();

  first.inventoryItemIds.push("item_torn_ledger_page");
  first.visitedRoomIds.push("room_study");

  assert.equal(second.inventoryItemIds.length, 0);
  assert.deepEqual(second.visitedRoomIds, ["room_great_hall"]);
  assert.notEqual(first, second);
});

test("initial visible state is in the Great Hall", () => {
  const state = createInitialState();
  const visibleState = getVisibleState(state);

  assert.equal(visibleState.currentRoom.id, "room_great_hall");
  assert.equal(visibleState.currentRoom.name, "Great Hall");
  assert.equal(visibleState.turnsRemaining, 9);
  assert.deepEqual(
    visibleState.presentNpcs.map((npc) => npc.id),
    ["npc_captain_vale"]
  );
  assert.equal(Object.keys(frostmereAdventure.rooms).length, 7);
  assert.equal(Object.keys(frostmereAdventure.items).length, 5);
  assert.equal(Object.keys(frostmereAdventure.npcs).length, 3);
});

test("look does not consume an investigation turn", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "look" });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnsRemaining, 9);
  assert.equal(result.state.turnIndex, 0);
  assert.equal(result.state.currentRoomId, "room_great_hall");
  assert.equal(result.events[0].type, "looked");
});

test("inventory starts empty and does not consume an investigation turn", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "inventory" });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnsRemaining, 9);
  assert.deepEqual(result.visibleState.inventory, []);
  assert.match(result.message, /carrying nothing/i);
});

test("go to a valid exit changes room without consuming an investigation turn", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "go", target: "east" });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnsRemaining, 9);
  assert.equal(result.state.turnIndex, 0);
  assert.equal(result.state.currentRoomId, "room_study");
  assert.deepEqual(result.state.visitedRoomIds, [
    "room_great_hall",
    "room_study"
  ]);
  assert.equal(result.visibleState.currentRoom.name, "Study");
});

test("go to an invalid exit fails without changing room", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "go", target: "up" });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnsRemaining, 9);
  assert.equal(result.state.currentRoomId, "room_great_hall");
  assert.deepEqual(result.state.visitedRoomIds, ["room_great_hall"]);
  assert.equal(result.events[0].type, "command_rejected");
});
