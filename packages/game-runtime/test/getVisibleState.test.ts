import { describe, it, assert, s, cmd, run, stateWithItems, stateWithClues, stateWithConsequences, getVisibleState } from "./helpers";

// ===========================================================================
// getVisibleState — initial state
// ===========================================================================
describe("getVisibleState — initial state", () => {
  it("shows Great Hall as current room", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.currentRoom.id, "room_great_hall");
    assert.equal(vs.currentRoom.name, "Great Hall");
  });

  it("shows 4 visible exits from Great Hall", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.visibleExits.length, 4);
  });

  it("shows Vale present in Great Hall", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.presentNpcs.length, 1);
    assert.equal(vs.presentNpcs[0].id, "npc_captain_vale");
  });

  it("shows visible interactives in Great Hall", () => {
    const vs = getVisibleState(s());
    const names = vs.visibleInteractives.map(i => i.name);
    assert.ok(names.includes("covered body"));
    assert.ok(names.includes("stair"));
    assert.ok(names.includes("tower door"));
  });

  it("shows empty inventory", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.inventory.length, 0);
  });

  it("shows no clues discovered", () => {
    const vs = getVisibleState(s());
    assert.deepEqual(vs.clues, {});
  });

  it("shows no consequences recorded", () => {
    const vs = getVisibleState(s());
    assert.deepEqual(vs.consequences, []);
  });

  it("shows 9 turns remaining", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.turnsRemaining, 9);
  });

  it("shows null ending", () => {
    const vs = getVisibleState(s());
    assert.equal(vs.ending, null);
  });
});

// ===========================================================================
// getVisibleState — after movement
// ===========================================================================
describe("getVisibleState — after movement", () => {
  it("shows new room after go command", () => {
    let state = s();
    state = run(state, cmd("go", { target: "east" })).state;
    const vs = getVisibleState(state);
    assert.equal(vs.currentRoom.id, "room_study");
    assert.equal(vs.currentRoom.name, "Study");
  });

  it("shows different exits per room", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const vs = getVisibleState(state);
    // Study has only 1 exit (back to great hall)
    assert.equal(vs.visibleExits.length, 1);
    assert.equal(vs.visibleExits[0].toRoomId, "room_great_hall");
  });

  it("shows NPCs present in the new room", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const vs = getVisibleState(state);
    assert.equal(vs.presentNpcs.length, 1);
    assert.equal(vs.presentNpcs[0].id, "npc_theo_rusk");
  });

  it("does not show NPCs from previous room", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    const vs = getVisibleState(state);
    const npcIds = vs.presentNpcs.map(n => n.id);
    assert.ok(!npcIds.includes("npc_captain_vale"));
  });
});

// ===========================================================================
// getVisibleState — after search
// ===========================================================================
describe("getVisibleState — after search", () => {
  it("shows discovered clues in clues map", () => {
    let state = s();
    state = run(state, cmd("search", { target: "body" })).state;
    const vs = getVisibleState(state);
    assert.ok(vs.clues["clue_watch_stopped_1147"]);
    assert.equal(vs.clues["clue_watch_stopped_1147"], "standard");
  });

  it("shows discovered items but only inventory items in inventory", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = run(state, cmd("search", { target: "desk" })).state;
    const vs = getVisibleState(state);
    // Item discovered but not taken → not in inventory
    assert.equal(vs.inventory.length, 0);
  });
});

// ===========================================================================
// getVisibleState — after inventory changes
// ===========================================================================
describe("getVisibleState — after inventory changes", () => {
  it("shows items in inventory after take", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = run(state, cmd("search", { target: "desk" })).state;
    state = run(state, cmd("take", { target: "ledger page" })).state;
    const vs = getVisibleState(state);
    assert.equal(vs.inventory.length, 1);
    assert.equal(vs.inventory[0].id, "item_torn_ledger_page");
    assert.equal(vs.inventory[0].name, "Torn Ledger Page");
  });
});

// ===========================================================================
// getVisibleState — after trust changes
// ===========================================================================
describe("getVisibleState — after trust changes", () => {
  it("reflects updated trust levels", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    state = run(state, cmd("talk", { npc: "mina", topic: "alden" })).state;
    const vs = getVisibleState(state);
    assert.equal(vs.trust.npc_mina_arlen, 1);
  });
});

// ===========================================================================
// getVisibleState — after consequences
// ===========================================================================
describe("getVisibleState — after consequences", () => {
  it("shows recorded consequence IDs", () => {
    const state = stateWithConsequences("conseq_tipped_off_theo");
    const vs = getVisibleState(state);
    assert.ok(vs.consequences.includes("conseq_tipped_off_theo"));
  });
});

// ===========================================================================
// getVisibleState — after NPC movement
// ===========================================================================
describe("getVisibleState — after NPC movement", () => {
  it("shows moved NPC in new room", () => {
    const state = {
      ...s(),
      currentRoomId: "room_study",
      visitedRoomIds: ["room_great_hall", "room_study"],
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_study" }
    };
    const vs = getVisibleState(state);
    const npcIds = vs.presentNpcs.map(n => n.id);
    assert.ok(npcIds.includes("npc_theo_rusk"));
  });

  it("no longer shows moved NPC in old room", () => {
    const state = {
      ...s(),
      npcRoomById: { ...s().npcRoomById, npc_theo_rusk: "room_study" }
    };
    const vs = getVisibleState(state);
    // Great Hall — should still have Vale but not Theo
    const npcIds = vs.presentNpcs.map(n => n.id);
    assert.ok(!npcIds.includes("npc_theo_rusk"));
    assert.ok(npcIds.includes("npc_captain_vale"));
  });
});

// ===========================================================================
// getVisibleState — locked exit display
// ===========================================================================
describe("getVisibleState — locked exit display", () => {
  it("shows locked: true for bell tower exits when not unlocked", () => {
    const vs = getVisibleState(s());
    const towerExit = vs.visibleExits.find(e => e.toRoomId === "room_bell_tower");
    assert.ok(towerExit);
    assert.equal(towerExit!.locked, true);
  });

  it("still shows locked: true in visibleState (lock is property of exit, not state)", () => {
    // Even with towerUnlocked flag, the exit definition has locked:true
    // The flag is checked at go-time, not reflected in visibleState
    const state = { ...s(), flags: { towerUnlocked: true } };
    const vs = getVisibleState(state);
    const towerExit = vs.visibleExits.find(e => e.toRoomId === "room_bell_tower");
    assert.equal(towerExit!.locked, true);
  });
});
