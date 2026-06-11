# 将 ai-narrative 打包为独立 npm 包

## Context

StoryCraft 的 `packages/ai-narrative` 是一个 AI NPC 对话引擎，用于推理游戏中的人物对话、秘密揭示（gate 系统）。其架构已经解耦良好，适合抽出为独立 npm 包，供其他推理游戏复用。

**目标：** 发布为 `@wutiankai/npc-dialogue`，独立于 StoryCraft，零游戏特定耦合。

> **npm 账号：** wutiankai
> **注意：** 执行此计划时不调用 MCP 工具。

---

## 改动清单

### 1. 去除 zod 依赖（死代码清理）
**文件：** `packages/ai-narrative/src/types.ts`

- `NarrativeRequestSchema` 和 `NarrativeTextSchema` 是唯一使用 zod 的地方
- 没有任何其他文件引用它们 — 直接删除
- 删除 `import { z } from "zod"`
- package.json 移除 zod 依赖

### 2. 去除 @shared 依赖
**文件：** `packages/ai-narrative/src/types.ts`

- 当前导入了 `RuntimeEvent`, `VisibleState`, `TrustLevel` 来自 `@shared`
- 这些类型只在 `NarrativeRequest` 中使用（opaque data，透传）
- 改为本地定义：
  ```ts
  export type TrustLevel = 0 | 1 | 2;
  export type RuntimeEvent = Record<string, unknown>;
  export type VisibleState = Record<string, unknown>;
  ```

### 3. Gate 审查 — 双语关键词外部化
**文件：** `packages/ai-narrative/src/dialogue/gate-review.ts`

- 当前 `BILINGUAL_KEYWORD_MAP` 是 Frostmere 硬编码（角色名、地点、线索等）
- 改为参数传入：
  - `expandKeywordsBilingually(keywords, map?)` 增加 `map` 参数
  - `reviewGateTrigger()` 增加 `options.bilingualKeywordMap` 参数
- `DialogueEngineConfig` 增加 `bilingualKeywordMap?: Record<string, string[]>`
- `DialogueEngine` 线程传递到 `reviewGateTrigger`
- Frostmere 的关键词 map 移到 `apps/web/src/worlds/frostmere/` 中

### 4. System Prompt — 世界设定外部化
**文件：** `packages/ai-narrative/src/dialogue/prompt/system-prompt.ts`, `dialogue/types.ts`

- 当前硬编码 "murder mystery game set in a snowbound manor"
- `NpcScript` 增加可选字段 `worldSetting?: string`
- system prompt 中使用 `script.worldSetting ?? "a mystery investigation game"`
- 示例中的 Frostmere gate ID 改为通用示例（`example_gate`）

### 5. 清理导出 — 只导出对话相关 API
**文件：** `packages/ai-narrative/src/index.ts`

**导出：**
- 类型：`NpcScript`, `NpcKnowledgeEntry`, `NpcSecret`, `ConversationExchange`, `DialogueAiResponse`, `DialogueContext`, `DialogueRequest`, `DialogueResult`, `DialogueEngineConfig`, `ProviderConfig`, `ProviderStatus`, `ProviderState`, `ProviderRawResponse`, `AuditRecord`, `AuditStats`, `TrustLevel`
- 类：`DialogueEngine`, `AuditLog`, `PassthroughProvider`, `OpenAICompatibleProvider`
- 函数：`parseAiJson`, `validateDialogueResponse`, `reviewGateTrigger`, `expandKeywordsBilingually`, `buildNpcDialoguePrompt`, `loadConfigFromEnv`
- 接口：`NarrativeProvider`

**不导出（内部）：**
- `NarrativeRequest`, `NarrativeRequestSchema`, `NarrativeTextSchema`
- `NarrativeResponse`, `ValidationResult`, `ConstraintViolation`
- `NarrativeEngineConfig`, `DEFAULT_ENGINE_CONFIG`, `EngineStatus`, `NarrativeError`, `GroundingData`

### 6. 构建管线
**新文件：** `packages/ai-narrative/tsconfig.json`, `packages/ai-narrative/tsup.config.ts`

- tsup 构建，输出 ESM + CJS + 类型声明
- tsconfig: `target ES2022`, `moduleResolution bundler`, `strict true`
- 输出结构：`dist/index.js`, `dist/index.mjs`, `dist/index.d.ts`, `dist/index.d.mts`

### 7. package.json 更新
```json
{
  "name": "@wutiankai/npc-dialogue",
  "version": "1.0.0-alpha.1",
  "type": "module",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.mts", "default": "./dist/index.mjs" },
      "require": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "test": "node --import tsx --test test/*.test.ts",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0"
  }
}
```

**零运行时依赖**（zod 已删除）

### 8. 测试迁移
- `test/dialogue-intent.test.ts` 和 `test/dialogue-policy.test.ts` 引用了 `apps/web/`，移到 web app
- 更新 `test/gate-review.test.ts` 传入 bilingualKeywordMap 参数
- 新增 `test/system-prompt.test.ts` 测试 worldSetting

### 9. StoryCraft 迁移（消费发布的包）
- `apps/web/vite.config.ts` 移除 `@ai-narrative` 别名
- `apps/cli/tsconfig.json` 移除 `@ai-narrative` paths
- 全局替换 `@ai-narrative` → `@wutiankai/npc-dialogue`
- Frostmere NPC scripts 增加 `worldSetting` 字段
- 创建 `apps/web/src/worlds/frostmere/keywords.ts` 放双语关键词 map
- DialogueEngine 构造时传入 `bilingualKeywordMap`

### 10. README
写完整的包文档：Quick Start、核心概念、API Reference、配置说明、自定义 Provider、示例

---

## 实施顺序

1. 去除 zod + @shared 依赖（types.ts）
2. 双语关键词外部化（gate-review.ts + engine.ts + types.ts）
3. 世界设定外部化（system-prompt.ts + types.ts）
4. 清理导出（index.ts）
5. 添加构建管线（tsconfig.json + tsup.config.ts + package.json）
6. 迁移测试
7. 写 README
8. 本地构建验证
9. 迁移 StoryCraft 消费方式
10. 发布 alpha → 验证 → 发布 1.0.0

## 验证方式

1. `cd packages/ai-narrative && npm run build` — 构建成功
2. `npm run test` — 所有测试通过
3. `npm pack` — 检查包内容只有 dist/ 和必要文件
4. StoryCraft 全量构建 `npm run build` — 消费新包正常
5. 页面功能测试 — NPC 对话、gate 触发、密钥设置正常
