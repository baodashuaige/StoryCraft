# 🏰 StoryCraft Game

AI 驱动的互动文字冒险 / AI-driven interactive fiction.

探索房间、与 NPC 对话、收集线索、破解谜案。支持 **浏览器** 和 **终端** 两种游玩方式。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，只需填写 DEEPSEEK_API_KEY
# JWT_SECRET 和 ENCRYPTION_KEY 首次启动时自动生成
```

### 3. 启动后端

```bash
cd apps/server
npx tsx src/index.ts   # 启动在 http://localhost:3001
```

### 4. 启动前端

```bash
cd apps/web
npx vite --host        # 启动在 http://localhost:5173
```

浏览器打开 <http://localhost:5173> 即可。

### 5. 终端模式（CLI）

无需后端，直接在终端里玩：

```bash
# 普通模式（无 AI）
npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts

# AI 模式
OPENAI_API_KEY=sk-xxx AI_BASE_URL=https://api.deepseek.com/v1 AI_MODEL=deepseek-chat \
  npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts
```

## 游戏模式

### 🖥️ 浏览器模式

- **游客模式**：直接进入游戏，自动使用房主配置的 AI 密钥
- **登录用户**：点右上角 👤 登录/注册，可配置自己的 API 密钥
  - 首次部署时，使用账号 `tb` / `123456` 登录即为 **房主（host）**，密钥供所有游客使用
  - 非房主用户可在设置中选择「用自己的」，配置独立的 API 密钥

### 📟 终端模式

- 支持中英文命令：`look`、`go 东`、`search 书桌`、`take 钥匙`
- 自由文本直接对 NPC 说话（AI 自动回复）
- 彩色 ANSI 输出：房间、出口、NPC、线索一目了然
- 输入 `help` 查看完整命令列表

## 配置 AI 密钥

StoryCraft 使用 AI 服务生成 NPC 对话。API 密钥**只在页面 UI 中配置**，加密存储在 SQLite 中，所有 AI 请求由后端代理转发。

### 设置方式

1. 启动应用，使用 `tb` / `123456` 登录（房主账号）
2. 点击右上角 ⚙️ 设置 → 选择「智能模式」→ 填写 API 密钥（DeepSeek / OpenAI 兼容）、Base URL、模型名
3. 后端用 AES-256-GCM 加密存储到数据库

未配置密钥的游客自动使用 host 密钥。

> **注意：** `.env` 文件中不需要配置 API 密钥。所有密钥都通过页面设置，存储在数据库中。

### 环境变量说明

`.env` 文件可以完全为空，以下值都会自动生成：

| 变量 | 说明 | 是否必须 |
| --- | --- | --- |
| `JWT_SECRET` | 用户认证签名密钥 | 自动生成 |
| `ENCRYPTION_KEY` | API Key 加密存储密钥 | 自动生成 |
| `VITE_API_URL` | 生产部署时后端地址 | 仅生产环境，见部署章节 |

### 安全模型

| 层级 | 安全措施 |
| --- | --- |
| **浏览器** | 始终不接触原始密钥。前端调用 `POST /api/ai/chat`，后端代理转发 |
| **后端** | AES-256-GCM 加密存储，密钥首次启动自动生成 |
| **Git** | 仅提交 `.env.example`，不含密钥 |

## 项目结构

```text
storycraft-game/
  apps/
    cli/                终端游戏模式（ANSI 彩色输出）
    server/             Express 后端（认证、密钥存储、AI 代理）
    web/                Vite + TypeScript 浏览器前端
  packages/
    game-runtime/       房间、命令、规则、任务、状态
    ai-narrative/       AI 对话引擎、提示词构建、门控审核
    shared/             共享契约与类型
  docs/                 设计文档与开发日志
```

## 常用命令

```bash
npm run typecheck     # 全局类型检查
npm test              # 运行所有测试
npm run build         # 生产构建
```

## 部署到云服务器

项目提供一键部署脚本，通过 git push 触发服务器拉取并重启：

```bash
# 本地执行（会 git push 并触发远程部署）
bash deploy/deploy-local.sh "提交信息"
```

**流程：**
1. `deploy-local.sh` — 本地 commit + push 到服务器仓库
2. 服务器执行 `deploy/deploy.sh` — git pull → npm build → pm2 restart

**首次部署需要 SSH 到服务器做一次性配置：**

```bash
ssh root@你的服务器

cd /opt/storycraft-game

# 1. 创建空的 .env（JWT_SECRET 和 ENCRYPTION_KEY 会自动生成）
touch .env

# 2. 设置前端的后端地址
echo "VITE_API_URL=http://你的服务器IP:3001" > apps/web/.env.production

# 3. 首次启动后，用 tb / 123456 登录设置房主密钥
```

**注意：**
- `.env` 在 `.gitignore` 中，不会通过 git 同步，本地和服务器各自维护
- `JWT_SECRET` 和 `ENCRYPTION_KEY` 首次启动时自动生成并写入 `.env`
- API 密钥通过页面 UI 设置（tb 登录 → ⚙️ 设置），加密存储在 SQLite 数据库中
- `.env` 中不需要配置 API 密钥
- 后续部署只需本地运行 `bash deploy/deploy-local.sh`

## 当前剧本：霜钟楼的最后一声钟响

> 暴风雪之夜，庄园主人奥登·沃斯被发现死在钟楼之下。家中众人声称钟楼门从内部锁死。黎明时分，山路将被打通，嫌疑人将四散而去。你只有 **9 个调查回合** 来揭开真相。

3 个 NPC、7 个房间、6 条线索、多种结局。你能在黎明前找到凶手吗？
