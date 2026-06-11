#!/bin/bash
# StoryCraft 一键部署：本地 → GitHub → 服务器
# 用法: bash deploy/deploy-local.sh "提交信息"
set -e
cd "$(dirname "$0")/.."
git add -A
git commit -m "${1:-update}" || echo "[Deploy] No changes to commit"
git push my main
echo "[Deploy] Syncing server..."
ssh root@118.31.34.132 'bash /opt/storycraft-game/deploy/deploy.sh'
