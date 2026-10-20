# StoryCraft 部署指南

## 服务器配置 (game.wutiankai.cn)

> 旧部署（game.mastertooling.shop）随服务器过期已下线；当前目标为新服务器
> （game.wutiankai.cn），以下 nginx 容器路径为旧服务器布局示例，新服务器按实际
> nginx 部署方式调整。

### 架构

```
Nginx (:80) → game.wutiankai.cn
    ├── /    → PM2 storycraft-web (:3000, serve 静态)
    └── /api → PM2 storycraft (:3001, Express)
```

### Nginx 配置

`deploy/game.nginx.conf` 放入 nginx 的 conf.d（容器化则挂载为
`/etc/nginx/conf.d/game.conf`），然后 reload nginx。

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
