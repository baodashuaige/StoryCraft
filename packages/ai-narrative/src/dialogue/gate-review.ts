import type { DialogueAiResponse, DialogueContext, NpcScript } from "./types";

// ─── Gate Trigger Reviewer ───────────────────────────────────────────
// Lightweight reviewer that prevents false gate triggers.
// This is a CANDIDATE gate filter — it does not execute game state changes.
// The runtime (game-runtime executeTalk) has final authority.
//
// NOTE: Short/greeting input filtering was moved to dialogue-intent.ts
// in the web-services layer. This module only checks keyword relevance
// and AI evidence quality.

// ─── Bilingual Keyword Mapping ───────────────────────────────────────
// Maps English keywords from secret definitions to common Chinese
// equivalents so that keyword relevance checks work across languages.

/**
 * Expand explicit English keywords with Chinese equivalents for cross-language matching.
 *
 * @param englishKeywords - Keywords from secret definitions (typically English)
 * @param bilingualMap - Optional map of English keyword → Chinese equivalents.
 *   Provide a game-specific map for bilingual gate matching.
 */
export function expandKeywordsBilingually(
  englishKeywords: string[],
  bilingualMap?: Record<string, string[]>
): string[] {
  if (!bilingualMap || Object.keys(bilingualMap).length === 0) {
    return [...englishKeywords];
  }

  const expanded: string[] = [...englishKeywords];
  for (const kw of englishKeywords) {
    const lower = kw.toLowerCase();
    if (bilingualMap[lower]) {
      expanded.push(...bilingualMap[lower]);
    }
    // Also check partial matches (e.g. "tower" in "bell tower")
    for (const [engKey, zhValues] of Object.entries(bilingualMap)) {
      if (lower.includes(engKey) || engKey.includes(lower)) {
        expanded.push(...zhValues);
      }
    }
  }
  return expanded;
}

// ─── Review Function ─────────────────────────────────────────────────

/**
 * Review a validated AI response for false gate triggers.
 *
 * Rules (greeting/short-input filtering is handled by dialogue-intent.ts):
 * 1. If explicit trigger keywords/phrases exist, player input must match one
 * 2. AI must provide gateEvidence or gateConfidence ≥ medium
 */
export function reviewGateTrigger(
  validated: DialogueAiResponse,
  playerInput: string,
  npcScript: NpcScript,
  _context: DialogueContext,
  options?: { bilingualKeywordMap?: Record<string, string[]> }
): DialogueAiResponse {
  if (validated.candidateGateId === null) {
    return validated;
  }

  const playerLower = playerInput.trim().toLowerCase();

  // Find the matching secret
  const secret = npcScript.gatedSecrets.find(
    (s) => s.topicGateId === validated.candidateGateId
  );
  if (!secret) {
    return { ...validated, candidateGateId: null };
  }

  // Rule 1: explicit trigger keywords/phrases only. Do not split prose into
  // generic words like "player", "asks", "about", or "what".
  const triggerTerms = [
    ...(secret.triggerKeywords ?? []),
    ...(secret.triggerPhrases ?? []),
  ].filter((term) => term.trim().length > 0);
  const expandedTerms = expandKeywordsBilingually(triggerTerms, options?.bilingualKeywordMap);

  const hasExplicitTerms = expandedTerms.length > 0;
  const hasRelevance = expandedTerms.some((kw) => playerLower.includes(kw.toLowerCase()));
  if (hasExplicitTerms && !hasRelevance) {
    return { ...validated, candidateGateId: null };
  }

  // Rule 2: AI must show evidence of matching — either gateEvidence is
  // non-empty, OR gateConfidence is at least "medium"
  const hasGateEvidence = validated.gateEvidence && validated.gateEvidence.trim().length > 0;
  const hasConfidence = validated.gateConfidence === "medium" || validated.gateConfidence === "high";

  if (!hasGateEvidence && !hasConfidence) {
    return { ...validated, candidateGateId: null };
  }

  return validated;
}
