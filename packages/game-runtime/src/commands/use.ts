import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  ItemId,
  NpcId,
  TrustLevel,
  UseRuleDefinition,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";
import { evaluateAll } from "../rules/conditions";
import { recordConsequence } from "../rules/consequences";

export function executeUse(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  if (state.isComplete) {
    return rejectUse(state, adventure, "The investigation is over. There is nothing left to use.");
  }

  // Resolve item — must be in inventory
  const itemId = resolveItem(input.item, state, adventure);
  if (!itemId) {
    return rejectUse(state, adventure, "You do not have that item.");
  }
  if (!state.inventoryItemIds.includes(itemId)) {
    return rejectUse(state, adventure, "You do not have that item in your inventory.");
  }

  // Resolve target
  const target = normalize(input.target);
  if (!target) {
    return rejectUse(state, adventure, "Use what on what? Specify a target.");
  }

  // Find matching use rule
  const rule = findUseRule(itemId, target, adventure);
  if (!rule) {
    return rejectUse(state, adventure, "You cannot use that here.");
  }

  // Check if already used
  const usedFlag = `used_${rule.id}`;
  if (state.flags[usedFlag]) {
    const message = rule.alreadyUsedResponse ?? "You have already done that.";
    const events = [createEvent(state, "item_used", "use", message)];
    const nextState = appendEvents(state, events);
    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: false
    };
  }

  // Check NPC presence if required
  if (rule.npcPresent) {
    if (state.npcRoomById[rule.npcPresent as NpcId] !== state.currentRoomId) {
      return rejectUse(state, adventure, "The person you need is not here.");
    }
  }

  // Check room context for non-NPC targets: target must be an interactive in current room
  if (!rule.npcPresent) {
    const currentRoom = adventure.rooms[state.currentRoomId];
    const targetInRoom = currentRoom?.interactiveIds?.some(intId => {
      const interactive = adventure.interactives[intId];
      return interactive?.name?.toLowerCase().includes(target);
    });
    if (!targetInRoom) {
      return rejectUse(state, adventure, "You cannot use that here.");
    }
  }

  // Check conditions
  if (!evaluateAll(rule.requires, state, adventure)) {
    const message = rule.blockedResponse;
    const events = [createEvent(state, "item_used", "use", message)];
    const nextState = appendEvents(state, events);
    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: false
    };
  }

  // Check turns remaining
  if (state.turnsRemaining <= 0) {
    return rejectUse(
      state,
      adventure,
      "Dawn has arrived; there is no time left for that."
    );
  }

  // Apply effects
  let nextState: WorldState = {
    ...state,
    turnIndex: state.turnIndex + 1,
    turnsRemaining: state.turnsRemaining - 1
  };

  // Unlock exits via flag
  if (rule.flagChanges) {
    nextState = {
      ...nextState,
      flags: { ...nextState.flags, ...rule.flagChanges }
    };
  }

  // Mark as used
  nextState = {
    ...nextState,
    flags: { ...nextState.flags, [usedFlag]: true }
  };

  // Discover clues
  const discoveredCluesById = { ...nextState.discoveredCluesById };
  for (const clueId of rule.revealsClueIds ?? []) {
    const clue = adventure.clues[clueId];
    if (clue && !discoveredCluesById[clueId]) {
      discoveredCluesById[clueId] = clue.defaultStrength;
    }
  }
  nextState = { ...nextState, discoveredCluesById };

  // Change trust
  if (rule.trustDelta) {
    const trustByNpcId = { ...nextState.trustByNpcId };
    for (const [npcId, delta] of Object.entries(rule.trustDelta)) {
      if (delta !== undefined) {
        const current = trustByNpcId[npcId as NpcId] ?? 0;
        trustByNpcId[npcId as NpcId] = Math.max(0, Math.min(2, current + delta)) as TrustLevel;
      }
    }
    nextState = { ...nextState, trustByNpcId };
  }

  // Record consequences
  for (const cId of rule.consequenceIds ?? []) {
    nextState = recordConsequence(nextState, cId);
  }

  // If consequence includes tipped_off_theo, move Theo to Great Hall
  if (rule.consequenceIds?.includes("conseq_tipped_off_theo")) {
    const npcRoomById = {
      ...nextState.npcRoomById,
      npc_theo_rusk: "room_great_hall" as const
    };
    nextState = { ...nextState, npcRoomById };
  }

  // Build events
  const events = [
    createEvent(nextState, "item_used", "use", rule.response, 1),
    createEvent(nextState, "turn_spent", "use", "Using the item spends one investigation turn.", 2)
  ];

  if (rule.unlocksExitIds && rule.unlocksExitIds.length > 0) {
    events.push(
      createEvent(nextState, "access_unlocked", "use", "New area unlocked.", 3)
    );
  }

  nextState = appendEvents(nextState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message: rule.response,
    ok: true,
    turnSpent: true
  };
}

function rejectUse(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "use", message)];
  const nextState = appendEvents(state, events);
  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: false,
    turnSpent: false
  };
}

function resolveItem(
  itemInput: string | undefined,
  _state: WorldState,
  adventure: AdventureDefinition
): ItemId | undefined {
  if (!itemInput) return undefined;
  const normalized = itemInput.trim().toLowerCase();
  for (const itemId of Object.keys(adventure.items) as ItemId[]) {
    const item = adventure.items[itemId];
    if (item.aliases.some((a) => a.toLowerCase() === normalized)) {
      return itemId;
    }
  }
  return undefined;
}

function findUseRule(
  itemId: ItemId,
  target: string,
  adventure: AdventureDefinition
): UseRuleDefinition | undefined {
  const rules = adventure.useRules;
  if (!rules) return undefined;

  for (const rule of Object.values(rules)) {
    if (rule.itemId !== itemId) continue;
    if (rule.targetAliases.some((a) => normalize(a) === target)) {
      return rule;
    }
  }
  return undefined;
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}
