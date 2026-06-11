import type { NpcScript } from "@wutiankai/npc-dialogue";
import { minaScript } from "./mina";
import { theoScript } from "./theo";
import { valeScript } from "./vale";

export const frostmereNpcScripts: Record<string, NpcScript> = {
  npc_mina_arlen: minaScript,
  npc_theo_rusk: theoScript,
  npc_captain_vale: valeScript,
};
