#!/bin/bash
# StoryCraft 一键部署：本地 → 服务器（直连，不经过 GitHub）
# 用法: bash deploy/deploy-local.sh "提交信息"
set -e
cd "$(dirname "$0")/.."
git add -A
git commit -m "${1:-update}" || echo "[Deploy] No changes to commit"

echo "[Deploy] Packing & uploading..."
python -X utf8 -c "
import paramiko, subprocess
# Pack current tree (no node_modules, no .git)
r = subprocess.run(['git', 'archive', '--format=tar.gz', 'HEAD'], capture_output=True)
print(f'Packed {len(r.stdout)} bytes')
# Upload & deploy
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('118.31.34.132', username='root', password='D0ushiji@xi@ng', timeout=10)
sftp = ssh.open_sftp()
sftp.putfo(__import__('io').BytesIO(r.stdout), '/tmp/storycraft-deploy.tar.gz')
sftp.close()
stdin, stdout, stderr = ssh.exec_command('cd /opt/storycraft-game && tar xzf /tmp/storycraft-deploy.tar.gz && bash deploy/deploy.sh', timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out: print(out)
if err: print('ERR:', err)
ssh.close()
"
