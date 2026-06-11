import type { AdventureDefinition } from "@shared";
import type { NpcScript } from "@wutiankai/npc-dialogue";

// --- Translation types ---

export interface WorldTranslations {
  rooms: Record<string, { zh: string; en: string }>;
  roomDescriptions: Record<string, { zh: string }>;
  npcs: Record<string, { zh: string; en: string }>;
  npcRoles: Record<string, { zh: string; en: string }>;
  items: Record<string, { zh: string; en: string }>;
  clues: Record<string, { zh: string; en: string }>;
  endings: Record<string, { zh: string; en: string }>;
  endingSummaries: Record<string, { zh: string; en: string }>;
  consequences: Record<string, { zh: string; en: string }>;
  interactives: Record<string, { zh: string }>;
  strengths: Record<string, { zh: string }>;
  /** English engine message → Chinese translation */
  messages: Record<string, string>;
}

export interface WorldMeta {
  id: string;
  title: { zh: string; en: string };
  subtitle: { zh: string; en: string };
  premise: { zh: string; en: string };
  intro: { zh: string; en: string };
  help: { zh: string; en: string };
  coverImage: string;
  turns: number;
  npcTopics: Record<string, { alias: string; zh: string; en: string }[]>;
  npcAliases: Record<string, string>;
  itemsByRoom: Record<string, string[]>;
}

export interface WorldPack {
  meta: WorldMeta;
  adventure: AdventureDefinition;
  translations: WorldTranslations;
  npcScripts?: Record<string, NpcScript>;
}

// --- Registry ---

import { frostmerePack } from "./worlds/frostmere";

const WORLDS: WorldPack[] = [frostmerePack];

export function getAllWorlds(): WorldPack[] {
  return WORLDS;
}

export function getWorldById(id: string): WorldPack | undefined {
  return WORLDS.find((w) => w.meta.id === id);
}
