import type { NpcScript } from "../types";

// ─── Gated Secret Formatting (filtered by valid gate IDs) ────────────
// Only secrets whose topicGateId is in the valid set are shown to the AI.
// Inaccessible secrets are simply omitted from the prompt entirely.

export function formatGatedSecretsEn(script: NpcScript, validTopicGateIds: string[]): string {
  const available = script.gatedSecrets.filter(
    (s) => validTopicGateIds.includes(s.topicGateId)
  );
  if (available.length === 0) {
    return "  (none currently available)";
  }
  return available
    .map(
      (s) => {
        const keywords = [
          ...(s.triggerKeywords ?? []),
          ...(s.triggerPhrases ?? []),
        ];
        const keywordLine = keywords.length > 0
          ? `\n    Trigger keywords: ${keywords.join(", ")}`
          : "";
        return `  [${s.topicGateId}] ${s.description}\n    Reveal conditions: ${s.revealConditions}${keywordLine}\n    If pressed on this: ${s.reactionWhenPressed}`;
      }
    )
    .join("\n");
}

export function formatGatedSecretsZh(script: NpcScript, validTopicGateIds: string[]): string {
  const available = script.gatedSecrets.filter(
    (s) => validTopicGateIds.includes(s.topicGateId)
  );
  if (available.length === 0) {
    return "  （当前无可触发的门控秘密）";
  }
  return available
    .map(
      (s) => {
        const keywords = [
          ...(s.triggerKeywords ?? []),
          ...(s.triggerPhrases ?? []),
        ];
        const keywordLine = keywords.length > 0
          ? `\n    触发关键词：${keywords.join(", ")}`
          : "";
        return `  [${s.topicGateId}] ${s.description}\n    触发条件：${s.revealConditions}${keywordLine}\n    被追问时：${s.reactionWhenPressed}`;
      }
    )
    .join("\n");
}
