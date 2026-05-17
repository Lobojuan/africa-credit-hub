#!/usr/bin/env bash
# Daily GitHub sync — pushes main branch to github remote.
# Called by the server scheduler once every 24 hours.
# Accepts the token from either GITHUB_PERSONAL_ACCESS_TOKEN or GH_TOKEN
# (whichever is set); GITHUB_PERSONAL_ACCESS_TOKEN takes precedence.

set -euo pipefail

REPO_DIR="/home/runner/workspace"
LOG_FILE="/tmp/github-sync.log"
_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-${GH_TOKEN:-}}"
TIMESTAMP="[$(date -u +%Y-%m-%dT%H:%M:%SZ)]"

log() {
  echo "${TIMESTAMP} $*" >> "$LOG_FILE"
}

if [[ -z "$_TOKEN" ]]; then
  log "ERROR: neither GITHUB_PERSONAL_ACCESS_TOKEN nor GH_TOKEN is set — skipping sync."
  exit 1
fi

REMOTE="https://x-access-token:${_TOKEN}@github.com/Lobojuan/africa-credit-hub.git"

log "Starting GitHub sync..."

# ── LFS check ──────────────────────────────────────────────────────────────
# Detect any objects that git-lfs would try to push.  We intentionally do NOT
# push LFS objects (GIT_LFS_SKIP_PUSH=1) so any LFS-tracked file in the
# working tree would be silently missing on the remote.  Abort and alert
# instead of silently pushing broken pointer files.
if git -C "$REPO_DIR" lfs status --porcelain 2>/dev/null | grep -q '^'; then
  LFS_FILES=$(git -C "$REPO_DIR" lfs status --porcelain 2>/dev/null || true)
  log "ERROR: LFS-tracked objects detected — aborting push to avoid broken pointer files."
  log "LFS objects found:"
  while IFS= read -r line; do
    log "  $line"
  done <<< "$LFS_FILES"
  log "ACTION REQUIRED: remove LFS tracking from these files (git lfs untrack / git rm --cached) before the next sync."
  exit 2
fi

# Also check for any LFS pointers already committed but not yet pushed.
PENDING_LFS=$(git -C "$REPO_DIR" lfs push --dry-run origin main 2>/dev/null | grep -c 'push' || true)
if [[ "$PENDING_LFS" -gt 0 ]]; then
  log "ERROR: $PENDING_LFS pending LFS pointer(s) found in commit history — aborting push."
  log "ACTION REQUIRED: rewrite history to remove LFS-tracked commits before the next sync."
  exit 2
fi

log "LFS check passed — no pending LFS objects."

# ── Push ────────────────────────────────────────────────────────────────────
PRE_PUSH_SHA=$(git -C "$REPO_DIR" rev-parse HEAD)
log "Local HEAD before push: ${PRE_PUSH_SHA}"

if GIT_LFS_SKIP_PUSH=1 git -C "$REPO_DIR" push "$REMOTE" main >> "$LOG_FILE" 2>&1; then
  POST_PUSH_SHA=$(git -C "$REPO_DIR" rev-parse HEAD)
  log "Sync complete. HEAD SHA: ${POST_PUSH_SHA}"
else
  EXIT_CODE=$?
  log "Sync FAILED (exit ${EXIT_CODE}) — see output above."
  exit "$EXIT_CODE"
fi
