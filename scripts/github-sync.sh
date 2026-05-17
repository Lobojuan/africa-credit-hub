#!/usr/bin/env bash
# Daily GitHub sync — pushes main branch to github remote.
# Called by the server scheduler once every 24 hours.
# Accepts the token from either GITHUB_PERSONAL_ACCESS_TOKEN or GH_TOKEN
# (whichever is set); GITHUB_PERSONAL_ACCESS_TOKEN takes precedence.

set -euo pipefail

REPO_DIR="/home/runner/workspace"
LOG_FILE="/tmp/github-sync.log"
_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GH_TOKEN:-}}"

if [[ -z "$_TOKEN" ]]; then
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] ERROR: neither GITHUB_PERSONAL_ACCESS_TOKEN nor GH_TOKEN is set — skipping sync." >> "$LOG_FILE"
  exit 1
fi

REMOTE="https://x-access-token:${_TOKEN}@github.com/Lobojuan/africa-credit-hub.git"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Starting GitHub sync..." >> "$LOG_FILE"

GIT_LFS_SKIP_PUSH=1 git -C "$REPO_DIR" push "$REMOTE" main >> "$LOG_FILE" 2>&1 && \
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Sync complete." >> "$LOG_FILE" || \
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Sync FAILED — check log above." >> "$LOG_FILE"
