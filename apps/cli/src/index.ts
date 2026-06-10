/**
 * StoryCraft CLI — Play the game in your terminal.
 *
 * Usage:
 *   npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts
 *
 * With AI:
 *   OPENAI_API_KEY=sk-xxx AI_BASE_URL=... AI_MODEL=... npx tsx ...
 */
import * as readline from "readline/promises";
import { createInitialState, executeCommand, getVisibleState } from "@game-runtime";
import { createTranslator } from "../../web/src/i18n";
import type { Lang } from "../../web/src/i18n";
import { frostmerePack } from "./world-pack";
import { createCliDialogueService, type CliDialogueService } from "./dialogue-adapter";
import { parseCliCommand, type ParsedCommand } from "./command-parser";
import {
  clearScreen, printBanner, printIntro, renderStatusHeader,
  renderNarrative, renderGateEffects, renderFullStatus,
  renderEnding, renderHelp, prompt,
} from "./renderer";

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const lang: Lang = "zh";
  const pack = frostmerePack;
  const adventure = pack.adventure;
  const tr = createTranslator(pack, lang);

  // Init game state
  let state = createInitialState(adventure);

  // Init AI dialogue
  let dialogueService: CliDialogueService;
  try {
    dialogueService = await createCliDialogueService(lang);
  } catch (err: any) {
    console.error(`Failed to init AI: ${err.message}`);
    process.exit(1);
  }

  const hasAi = dialogueService.isAiAvailable();

  // Init readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Line reader using async iterator (works with pipes and TTY)
  async function* lineReader(): AsyncGenerator<string> {
    for await (const line of rl) {
      yield line;
    }
  }
  const lines = lineReader();

  // Selected NPC for multi-NPC rooms
  let selectedNpcId: string | null = null;

  // ── Show intro ──
  clearScreen();
  printBanner(pack.meta.title[lang], pack.meta.subtitle[lang]);

  if (hasAi) {
    console.log(`  🤖 AI 模式已启用`);
  } else {
    console.log(`  📋 普通模式（无 AI — 设置 OPENAI_API_KEY 启用智能对话）`);
  }
  console.log();

  printIntro(pack.meta.intro[lang]);

  // Main loop
  while (!state.isComplete) {
    const visible = getVisibleState(state, adventure);
    renderStatusHeader(visible, state, adventure, tr);

    process.stdout.write("\x1b[1m\x1b[32m  > \x1b[0m");
    const { value } = await lines.next();
    if (!value) break; // stdin closed
    const raw = value.trim();
    if (!raw) continue;

    const parsed: ParsedCommand = parseCliCommand(raw, visible, adventure, pack.meta, selectedNpcId, pack.translations);

    switch (parsed.kind) {
      case "quit":
        console.log(c.dim(`  👋 ${lang === "zh" ? "再见！" : "Goodbye!"}`, c.reset));
        rl.close();
        return;

      case "help":
        renderHelp();
        continue;

      case "status":
        renderFullStatus(visible, state, adventure, tr);
        continue;

      case "ai_dialogue": {
        selectedNpcId = parsed.npcId;
        const npcName = tr.npc(parsed.npcId);
        console.log(c.dim(`  → 对 ${npcName} 说: ${parsed.text}`, c.reset));

        try {
          const result = await dialogueService.handleDialogue({
            npcId: parsed.npcId,
            playerInput: parsed.text,
            state,
            adventure,
            pack,
          });

          state = result.state;
          renderNarrative(`[${npcName}] ${result.dialogue}`, "ai");
          renderGateEffects(result.gateEffects, tr);

          state = result.state;
        } catch (err: any) {
          renderNarrative(`Error: ${err.message}`, "error");
        }
        break;
      }

      case "command": {
        const cmdResult = executeCommand(state, parsed.input, adventure);
        state = cmdResult.state;

        const msg = tr.translateMsg(cmdResult.message);
        renderNarrative(msg, cmdResult.ok ? "system" : "error");

        // If talk command selected an NPC, remember it
        if (parsed.input.verb === "talk" && parsed.input.npc) {
          const found = visible.presentNpcs.find(n => {
            const alias = pack.meta.npcAliases[n.id]?.toLowerCase();
            return alias === parsed.input.npc?.toLowerCase() || n.id === parsed.input.npc;
          });
          if (found) selectedNpcId = found.id;
        }
        break;
      }

      case "unknown":
      default:
        // If multiple NPCs, suggest talking to one
        if (visible.presentNpcs.length > 1 && !selectedNpcId) {
          const names = visible.presentNpcs.map(n => tr.npc(n.id)).join(", ");
          renderNarrative(
            lang === "zh"
              ? `这里有多个 NPC: ${names}。先 talk <名字> 选定对话对象。`
              : `Multiple NPCs here: ${names}. Use "talk <name>" first.`,
            "error",
          );
        } else {
          renderNarrative(
            lang === "zh" ? "未知命令。输入 help 查看帮助。" : "Unknown command. Type help for commands.",
            "error",
          );
        }
        continue;
    }

    // Check ending
    if (state.isComplete && state.endingId) {
      renderEnding(state, adventure, tr);
    }
  }

  console.log(c.dim(`  👋 ${lang === "zh" ? "游戏结束！感谢游玩。" : "Game over! Thanks for playing."}`, c.reset));
  rl.close();
}

// ─── Minimal color helper (inline, avoid import clash) ──────────────
const c = {
  reset: "\x1b[0m",
  dim: (...texts: string[]) => `\x1b[2m${texts.join("")}\x1b[0m`,
};

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
