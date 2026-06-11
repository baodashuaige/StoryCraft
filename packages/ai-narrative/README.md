# @wutiankai/npc-dialogue

AI-driven NPC dialogue engine with gate-based secret revelation and bilingual keyword matching. Designed for mystery and investigation games.

## Features

- **AI NPC Dialogue** — Free-form conversations powered by any OpenAI-compatible provider
- **Gate Review System** — NPCs have gated secrets that unlock based on player input relevance
- **Bilingual Keyword Matching** — Cross-language keyword expansion (e.g. English → Chinese)
- **Trust Levels** — 3-tier trust system (0/1/2) that gates NPC knowledge access
- **Provider Abstraction** — Pluggable AI provider interface (OpenAI, passthrough, custom)
- **Audit Log** — Full dialogue pipeline logging for debugging
- **Zero Runtime Dependencies** — Lightweight, type-safe, ESM + CJS

## Quick Start

```bash
npm install @wutiankai/npc-dialogue
```

```ts
import {
  DialogueEngine,
  PassthroughProvider,
  type NpcScript,
} from "@wutiankai/npc-dialogue";

// Define an NPC
const npc: NpcScript = {
  npcId: "butler",
  name: "James",
  role: "The Butler",
  worldSetting: "a murder mystery set in a Victorian manor",
  persona: {
    personality: "Formal, observant, slightly nervous",
    background: "Served the family for 30 years",
    speechPatterns: "Precise, avoids contractions",
  },
  publicKnowledge: [
    { id: "k1", topic: "house layout", content: "Knows every room" },
  ],
  privateKnowledge: [
    { id: "k2", topic: "the master's will", content: "Saw the new will before the fire" },
  ],
  gatedSecrets: [
    {
      id: "secret_will",
      topicGateId: "topic_will",
      description: "Knows about the changed will",
      revealConditions: "player asks about the will with trust >= 1",
      reactionWhenPressed: "becomes defensive",
      triggerKeywords: ["will", "inheritance"],
    },
  ],
  ignorance: ["doesn't understand modern technology"],
  relationships: [],
};

// Create engine
const provider = new PassthroughProvider();
const engine = new DialogueEngine(provider, {
  lang: "en",
  failOpen: true,
  maxConversationHistory: 10,
});

await engine.initialize();

// Talk to NPC
const result = await engine.dialogue({
  npcScript: npc,
  playerInput: "Tell me about the will",
  context: {
    currentRoom: "Study",
    currentTurn: 3,
    turnsRemaining: 5,
    playerInventory: [],
    discoveredClues: [],
    currentTrust: 1,
    exhaustedTopicGateIds: [],
    recentExchanges: [],
    validTopicGateIds: ["topic_will"],
  },
});

console.log(result.dialogue);
console.log("Gate triggered:", result.candidateGateId);
```

## Core Concepts

### NpcScript

The complete character definition for an NPC:

| Field | Description |
|-------|-------------|
| `persona` | Personality, background, speech patterns |
| `publicKnowledge` | Information available at trust 0 |
| `privateKnowledge` | Information available at trust >= 1 |
| `gatedSecrets` | Secrets that unlock through gate review |
| `worldSetting` | Optional genre/world framing for the AI prompt |

### Gate Review

Gated secrets have trigger keywords. When a player input matches keywords, the AI proposes a gate trigger. The `reviewGateTrigger` function validates:

1. **Keyword relevance** — Does the player's input relate to the secret's keywords?
2. **Evidence quality** — Did the AI provide supporting evidence?
3. **Confidence level** — Is the AI confident enough?

### Trust Levels

- **0** — Stranger: only public knowledge
- **1** — Acquaintance: private knowledge + softer gate thresholds
- **2** — Trusted: full access, deeper secrets

### Bilingual Keyword Matching

Pass a keyword map to expand English terms with Chinese equivalents:

```ts
const keywordMap = {
  "will": ["遗嘱"],
  "key": ["钥匙"],
  "garden": ["花园"],
};

const engine = new DialogueEngine(provider, {
  lang: "zh",
  bilingualKeywordMap: keywordMap,
});
```

## API Reference

### Classes

#### `DialogueEngine`

Main dialogue engine. Handles NPC conversations with AI.

```ts
new DialogueEngine(provider: NarrativeProvider, config: DialogueEngineConfig)
```

**Methods:**
- `initialize()` — Set up the engine
- `dialogue(request: DialogueRequest)` — Process a player-NPC exchange
- `getStatus()` — Get current engine status

**Config:**
```ts
interface DialogueEngineConfig {
  lang: "en" | "zh";
  maxConversationHistory?: number; // default: 10
  failOpen?: boolean; // default: true
  bilingualKeywordMap?: Record<string, string[]>;
}
```

#### `PassthroughProvider`

Returns pre-formatted responses without AI. Useful for testing and non-AI modes.

#### `OpenAICompatibleProvider`

Connects to any OpenAI-compatible API.

```ts
new OpenAICompatibleProvider(config: ProviderConfig)
```

#### `AuditLog`

Records all dialogue pipeline events for debugging.

### Functions

| Function | Description |
|----------|-------------|
| `reviewGateTrigger(response, input, script, context, options?)` | Validate AI-proposed gate triggers |
| `expandKeywordsBilingually(keywords, map?)` | Expand keywords with translations |
| `parseAiJson(text)` | Parse AI JSON output safely |
| `validateDialogueResponse(parsed)` | Validate AI response structure |
| `buildNpcDialoguePrompt(script, context)` | Build system + user prompts |
| `loadConfigFromEnv()` | Load provider config from environment variables |

### Types

Key exported types: `NpcScript`, `NpcSecret`, `DialogueAiResponse`, `DialogueContext`, `DialogueResult`, `DialogueEngineConfig`, `NarrativeProvider`, `TrustLevel`, `ProviderStatus`, `AuditRecord`.

## Custom Provider

Implement the `NarrativeProvider` interface:

```ts
import type { NarrativeProvider, NarrativeRequest, NarrativeResponse } from "@wutiankai/npc-dialogue";

class MyProvider implements NarrativeProvider {
  async initialize(): Promise<void> { /* ... */ }

  async generate(request: NarrativeRequest): Promise<NarrativeResponse> {
    return {
      requestId: request.id,
      text: "NPC response text",
      source: "ai",
      validation: { passed: true, violations: [] },
      timestamp: Date.now(),
    };
  }

  getStatus(): ProviderStatus { /* ... */ }
}
```

## Building

```bash
npm run build    # ESM + CJS + type declarations via tsup
npm run clean    # Remove dist/
```

## License

MIT
