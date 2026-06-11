# Worklog: ai-narrative 独立 npm 包发布

日期: 2026-06-11

## 目标

将 `packages/ai-narrative` 打包为独立 npm 包 `@wutiankai/npc-dialogue`，发布到 npm，完成 StoryCraft 消费侧迁移。

## 背景

原计划文件：`docs/AI_NARRATIVE_NPM_PACKAGE_PLAN.md`，共 10 步。步骤 1-7 的代码改造在之前已由另一个会话完成（去 zod、去 @shared、关键词外部化、世界设定外部化、导出清理、构建管线、package.json）。

本次会话从步骤 8 开始，完成剩余的测试迁移、消费侧迁移、README、发布。

## 本轮改动

### 步骤 8：测试迁移

- **gate-review.test.ts**：所有 `reviewGateTrigger` 调用加上 `{ bilingualKeywordMap: TEST_KEYWORD_MAP }` 参数；`expandKeywordsBilingually` 加上 `bilingualMap` 参数；新增"无 map 时返回原始关键词"测试
- **dialogue-intent.test.ts**：从 `packages/ai-narrative/test/` 移到 `apps/web/test/`，修正 import 路径（引用 `apps/web/src/services/dialogue-intent`）
- **dialogue-policy.test.ts**：从 `packages/ai-narrative/test/` 移到 `apps/web/test/`，修正 import 路径（引用 `apps/web/src/services/dialogue-policy`）

这两个测试依赖 `apps/web/` 的代码，不属于独立 npm 包。

### 步骤 9：StoryCraft 消费侧迁移

**import 替换** — 全局 `@ai-narrative` → `@wutiankai/npc-dialogue`，涉及：

- `apps/web/vite.config.ts`：移除 `@ai-narrative` alias，新增 `@wutiankai/npc-dialogue` alias 指向源码（开发模式）
- `apps/cli/tsconfig.json`：移除 `@ai-narrative` paths
- `apps/web/src/world-registry.ts`
- `apps/web/src/services/dialogue-service.ts`
- `apps/web/src/services/devlog.ts`
- `apps/web/src/services/dialogue-provider.ts`
- `apps/web/src/worlds/frostmere/scripts/index.ts`
- `apps/web/src/worlds/frostmere/scripts/mina.ts`
- `apps/web/src/worlds/frozmere/scripts/theo.ts`
- `apps/web/src/worlds/frostmere/scripts/vale.ts`
- `apps/cli/src/dialogue-adapter.ts`

**worldSetting 字段** — 三个 Frostmere NPC script 加上 `worldSetting: "a murder mystery game set in a snowbound manor"`

**bilingualKeywordMap 传入** — `dialogue-provider.ts` 和 `dialogue-adapter.ts` 在 `new DialogueEngine()` 时传入 `FROSTMERE_KEYWORDS`

### 步骤 10：README

创建 `packages/ai-narrative/README.md`，包含 Quick Start、核心概念（NpcScript、Gate Review、Trust Levels、Bilingual Keyword Matching）、API Reference、Custom Provider 示例。

### 发布

```bash
npm publish --access public --tag alpha
```

发布成功：`@wutiankai/npc-dialogue@1.0.0-alpha.1`

### 本地开发适配

`npm link` 被 `npm install` 覆盖导致 Vite 找不到包。解决方案：`vite.config.ts` 中加 alias 直接指向 `packages/ai-narrative/src/index.ts`，开发时无需 build 包，改代码即生效。

## 包信息

| 项目 | 值 |
|------|-----|
| 包名 | `@wutiankai/npc-dialogue` |
| 版本 | `1.0.0-alpha.1` |
| tag | `alpha` |
| npm 账号 | wutiankai |
| 运行时依赖 | 无 |
| 构建工具 | tsup (ESM + CJS + DTS) |
| 包大小 | 60.3 kB (packed) |

## 设计决策

### Vite alias vs npm link

**选择：Vite alias 指向源码**

- `npm link` 不稳定，`npm install` 会覆盖符号链接
- alias 直连源码，开发体验和之前一样（改代码即生效）
- 生产部署时切到 npm 包安装即可

### 包名

**选择：`@wutiankai/npc-dialogue`**

- 原计划 `@mystery-engine/dialogue`，执行中改过 `@storycraft-engine/mystery-dialogue`
- 最终根据 npm 账号 `wutiankai` 和包定位（NPC 对话引擎）确定
- `npc-dialogue` 不限定于推理游戏，扩展空间更大

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `packages/ai-narrative/package.json` | 包名改为 `@wutiankai/npc-dialogue` |
| `packages/ai-narrative/test/gate-review.test.ts` | 修复：传入 bilingualKeywordMap |
| `packages/ai-narrative/README.md` | 新建 |
| `apps/web/test/dialogue-intent.test.ts` | 从 packages 移入，修正路径 |
| `apps/web/test/dialogue-policy.test.ts` | 从 packages 移入，修正路径 |
| `apps/web/vite.config.ts` | 移除 @ai-narrative alias，加 @wutiankai/npc-dialogue alias |
| `apps/web/src/services/dialogue-provider.ts` | 替换 import，传 bilingualKeywordMap，import FROSTMERE_KEYWORDS |
| `apps/web/src/services/dialogue-service.ts` | 替换 import |
| `apps/web/src/services/devlog.ts` | 替换 import |
| `apps/web/src/world-registry.ts` | 替换 import |
| `apps/web/src/worlds/frostmere/scripts/mina.ts` | 替换 import，加 worldSetting |
| `apps/web/src/worlds/frostmere/scripts/theo.ts` | 替换 import，加 worldSetting |
| `apps/web/src/worlds/frostmere/scripts/vale.ts` | 替换 import，加 worldSetting |
| `apps/web/src/worlds/frostmere/scripts/index.ts` | 替换 import |
| `apps/cli/tsconfig.json` | 移除 @ai-narrative paths |
| `apps/cli/src/dialogue-adapter.ts` | 替换 import，传 bilingualKeywordMap |
| `docs/AI_NARRATIVE_NPM_PACKAGE_PLAN.md` | 包名更新为 @wutiankai/npc-dialogue |

## 遗留事项

1. **生产部署**：部署前需在 `apps/web` 中 `npm install @wutiankai/npc-dialogue` 并移除 vite.config.ts 中的 alias
2. **测试运行**：`packages/ai-narrative/test/` 下的测试（parse、schema、gate-review）需验证通过
3. **apps/web 测试**：移入的 dialogue-intent 和 dialogue-policy 测试需验证
4. **apps/cli 构建**：CLI 端的 tsconfig 需确认如何解析 `@wutiankai/npc-dialogue`（目前无 alias，可能需要 npm install 或类似处理）
5. **版本号**：稳定后从 `1.0.0-alpha.1` 升到 `1.0.0`
