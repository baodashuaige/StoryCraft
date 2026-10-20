#!/bin/bash
# StoryCraft 一键部署：本地 → 服务器（直连，不经过 GitHub）
# 用法: DEPLOY_HOST=<服务器IP> DEPLOY_USER=<用户> DEPLOY_PASSWORD=<密码> bash deploy/deploy-local.sh "提交信息"
# 凭据只从环境变量读取，不写入本文件（历史提交曾内嵌凭据，已清洗；若曾泄露请尽快改密）。
set -e
cd "$(dirname "$0")/.."
: "${DEPLOY_HOST:?请设置 DEPLOY_HOST}"
: "${DEPLOY_USER:?请设置 DEPLOY_USER}"
: "${DEPLOY_PASSWORD:?请设置 DEPLOY_PASSWORD}"
git add -A
git commit -m "${1:-update}" || echo "[Deploy] No changes to commit"

echo "[Deploy] Packing & uploading..."
DEPLOY_HOST="$DEPLOY_HOST" DEPLOY_USER="$DEPLOY_USER" DEPLOY_PASSWORD="$DEPLOY_PASSWORD" python -X utf8 -c "
import paramiko, os, subprocess
# Pack current tree (no node_modules, no .git)
r = subprocess.run(['git', 'archive', '--format=tar.gz', 'HEAD'], capture_output=True)
print(f'Packed {len(r.stdout)} bytes')
# Upload & deploy（服务器地址与密码来自环境变量，不落盘）
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(os.environ['DEPLOY_HOST'], username=os.environ['DEPLOY_USER'], password=os.environ['DEPLOY_PASSWORD'], timeout=10)
sftp = ssh.open_sftp()
sftp.putfo(__import__('io').BytesIO(r.stdout), '/tmp/storycraft-deploy.tar.gz')
sftp.close()
stdin, stdout, stderr = ssh.exec_command('cd /opt/storycraft-game && tar xzf /tmp/storycraft-deploy.tar.gz && sed -i \"s/\\\\r//\" deploy/*.sh && bash deploy/deploy.sh', timeout=120)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
if out: print(out)
if err: print('ERR:', err)
ssh.close()
"
