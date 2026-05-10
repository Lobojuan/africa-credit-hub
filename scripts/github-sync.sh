#!/usr/bin/env bash
# Daily GitHub sync — pushes main branch to github remote.
# Called by the server scheduler once every 24 hours.
# Requires GH_TOKEN env var (set from OWNER_ADMIN_PASSWORD via Replit secret or
# injected at runtime from the GitHub connector token).

set -euo pipefail

REPO_DIR="/home/runner/workspace"
REMOTE="https://x-access-token:${GH_TOKEN}@github.com/Lobojuan/africa-credit-hub.git"
LOG_FILE="/tmp/github-sync.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting GitHub sync..." >> "$LOG_FILE"

GIT_LFS_SKIP_PUSH=1 git -C "$REPO_DIR" push "$REMOTE" main >> "$LOG_FILE" 2>&1 && \
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Sync complete." >> "$LOG_FILE" || \
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Sync FAILED — check log above." >> "$LOG_FILE"
