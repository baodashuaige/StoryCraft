#!/bin/bash
set -e
cd /opt/storycraft-game
echo "[Deploy] Building packages..."
npm run build
echo "[Deploy] Building server..."
cd apps/server && npm run build && cd ../..
echo "[Deploy] Building web..."
cd apps/web && npm run build && cd ../..
echo "[Deploy] Restarting..."
pm2 restart all
echo "[Deploy] Done: $(date)"
