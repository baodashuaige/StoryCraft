#!/bin/bash
# StoryCraft 一键部署：本地 → 服务器（直连，不经过 GitHub）
# 用法: bash deploy/deploy-local.sh "提交信息"
set -e
cd "$(dirname "$0")/.."
git add -A
git commit -m "${1:-update}" || echo "[Deploy] No changes to commit"
echo "[Deploy] Syncing code to server..."
git archive --format=tar.gz HEAD | ssh root@118.31.34.132 'cd /opt/storycraft-game && tar xzf -'
echo "[Deploy] Building & restarting..."
ssh root@118.31.34.132 'bash /opt/storycraft-game/deploy/deploy.sh'
