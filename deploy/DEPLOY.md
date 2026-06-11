# StoryCraft 部署指南

## 服务器配置 (mastertooling.shop / 118.31.34.132)

### 架构

```
Docker Nginx (:80) → game.mastertooling.shop
    ├── /    → PM2 storycraft-web (:3000, serve 静态)
    └── /api → PM2 storycraft (:3001, Express)
```

### Docker Nginx 配置

`game.nginx.conf` 需挂载到 xzs-nginx 容器：

```yaml
# 在 /opt/xzs-deploy/docker-compose.yml 的 nginx.volumes 中添加：
- ./game.conf:/etc/nginx/conf.d/game.conf:ro
```

首次部署或更新：
```bash
cp game.nginx.conf /opt/xzs-deploy/game.conf
cd /opt/xzs-deploy && docker compose up -d --force-recreate nginx
```

### PM2 进程

| 进程 | 脚本 | 端口 |
|---|---|---|
| storycraft | apps/server/dist/index.js | 3001 |
| storycraft-web | serve apps/web/dist | 3000 |

### 环境变量

`apps/server/.env`:
```
ENCRYPTION_KEY=<64 hex chars>
JWT_SECRET=<64 hex chars>
PORT=3001
```

PM2 工作目录需要 `.env`:
```bash
ln -sf /opt/storycraft-game/apps/server/.env /opt/storycraft-game/.env
```

### 固定房主账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| tb | 123456 | host |

### 更新流程

```bash
cd /opt/storycraft-game
git fetch my && git reset --hard my/main
npm run build
cd apps/server && npm run build && cd ../..
cd apps/web && npm run build && cd ../..
pm2 restart all
```
