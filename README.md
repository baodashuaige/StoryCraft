# 🏰 StoryCraft Game

**AI 驱动的互动文字冒险 / AI-driven interactive fiction.**

探索房间、与 NPC 对话、收集线索、破解谜案。

> **仓库角色**：本仓库为 UI/部署迭代协作仓库；**主维护仓库为
> [tiankai-333/storycraft-game](https://github.com/tiankai-333/storycraft-game)**
> （含 NPC 对话包 `@wutiankai/npc-dialogue` 源码与重写版 README）。两仓库内容已互相同步，
> 均在活跃使用。线上访问：[game.wutiankai.cn](http://game.wutiankai.cn)。

## ✨ 特性

- **双模式游玩** — 浏览器图形界面 + 终端 CLI
- **AI NPC 对话** — 自由文本与 NPC 交流，基于 [gate 审查系统](https://www.npmjs.com/package/@wutiankai/npc-dialogue)的秘密揭示
- **双语支持** — 中英文命令和对话
- **多结局** — 证据链决定结局走向
- **零门槛部署** — SQLite + 自动生成密钥，无需预配置数据库

## 🚀 快速开始

```bash
# 1. 安装
npm install

# 2. 启动后端（自动生成 .env，无需手动配置）
cd apps/server && npx tsx src/index.ts       # http://localhost:3001

# 3. 启动前端
cd apps/web && npx vite --host               # http://localhost:5173
```

### 终端模式（无需后端）

```bash
# 普通模式
npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts

# AI 模式
OPENAI_API_KEY=sk-xxx AI_BASE_URL=https://api.deepseek.com/v1 AI_MODEL=deepseek-chat \
  npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts
```

## 🎮 游戏模式

### 浏览器模式

| 角色 | 说明 |
|------|------|
| **游客** | 直接进入游戏，自动使用房主配置的 AI 密钥 |
| **房主** | 账号 `tb` / `123456` 首次登录即房主，可在 ⚙️ 设置中配置 AI 密钥供全员使用 |
| **登录用户** | 可选择「用自己的」独立 API 密钥 |

### 终端模式

- 中英文命令：`look`、`go 东`、`search 书桌`、`take 钥匙`
- 自由文本直接对 NPC 说话（AI 回复）
- 彩色 ANSI 输出，输入 `help` 查看命令列表

## 🔑 AI 密钥配置

API 密钥**只在页面 UI 中配置**，加密存储在 SQLite 中，前端永远不接触原始密钥。

**设置方式：** `tb` 登录 → ⚙️ 设置 → 智能模式 → 填写 API 密钥（支持 DeepSeek / OpenAI 兼容接口）

### 安全模型

| 层级 | 措施 |
|------|------|
| 浏览器 | 始终不接触原始密钥，通过后端 `POST /api/ai/chat` 代理转发 |
| 后端 | AES-256-GCM 加密存储，密钥首次启动自动生成 |
| Git | 不提交任何密钥文件 |

### 环境变量

后端首次启动时自动生成 `JWT_SECRET` 和 `ENCRYPTION_KEY`，无需手动配置。

| 变量 | 说明 | 必须 |
|------|------|------|
| `JWT_SECRET` | 认证签名密钥 | 自动生成 |
| `ENCRYPTION_KEY` | API Key 加密密钥 | 自动生成 |
| `VITE_API_URL` | 后端地址 | 仅生产环境 |

## 📦 项目结构

```text
StoryCraft/
  apps/
    cli/                 终端游戏模式
    server/              Express 后端（认证、密钥存储、AI 代理）
    web/                 Vite + TypeScript 浏览器前端
  packages/
    game-runtime/        游戏引擎（房间、命令、规则、状态）
    ai-narrative/        AI 对话引擎 → npm: @wutiankai/npc-dialogue
    shared/              共享契约与类型
  docs/                  设计文档与开发日志
```

### 独立 npm 包

对话引擎已发布为独立包，可供其他游戏项目复用：

```bash
npm install @wutiankai/npc-dialogue
```

## 🛠️ 常用命令

```bash
npm run typecheck     # 全局类型检查
npm test              # 运行所有测试
npm run build         # 生产构建
```

## 🚢 部署

一键部署脚本，凭据从环境变量读取（不写入任何文件）：

```bash
DEPLOY_HOST=<服务器IP> DEPLOY_USER=<用户> DEPLOY_PASSWORD=<密码> \
  bash deploy/deploy-local.sh "提交信息"
```

**首次部署服务器配置：**

```bash
ssh <用户>@<服务器IP>
cd /opt/storycraft-game
touch .env                                          # JWT_SECRET 和 ENCRYPTION_KEY 自动生成
echo "VITE_API_URL=http://<服务器IP>:3001" > apps/web/.env.production
# 启动后用 tb / 123456 登录设置房主 AI 密钥
```

> 后续部署只需带环境变量重跑 `deploy-local.sh`。`.env` 在 `.gitignore` 中，本地和服务器各自维护。
> ⚠️ 历史提交曾内嵌过服务器凭据（已从新提交移除）——如仍有效请尽快修改服务器密码。

## 📖 当前剧本：霜钟楼的最后一声钟响

> 暴风雪之夜，庄园主人奥登·沃斯被发现死在钟楼之下。家中众人声称钟楼门从内部锁死。黎明时分，山路将被打通，嫌疑人将四散而去。你只有 **9 个调查回合** 来揭开真相。

**3 个 NPC · 7 个房间 · 6 条线索 · 多种结局**

你能在黎明前找到凶手吗？
