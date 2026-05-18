#!/usr/bin/env bash
# Install local git hooks for this repository.
#
# Usage:  bash scripts/install-hooks.sh
#
# Copies the hook scripts from scripts/hooks/ into .git/hooks/ and makes them
# executable.  Safe to run multiple times (idempotent).

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS_SRC="$REPO_DIR/scripts/hooks"
HOOKS_DST="$REPO_DIR/.git/hooks"

if [[ ! -d "$HOOKS_DST" ]]; then
  echo "ERROR: .git/hooks directory not found. Are you inside a git repository?" >&2
  exit 1
fi

installed=0
for hook in "$HOOKS_SRC"/*; do
  name="$(basename "$hook")"
  dest="$HOOKS_DST/$name"

  if [[ -e "$dest" && ! -L "$dest" ]]; then
    echo "WARNING: $dest already exists and is not a symlink — backing up to ${dest}.bak"
    cp "$dest" "${dest}.bak"
  fi

  cp "$hook" "$dest"
  chmod +x "$dest"
  echo "Installed: .git/hooks/$name"
  installed=$((installed + 1))
done

echo ""
echo "Done — $installed hook(s) installed."
echo "The pre-push hook will now block any push that contains LFS-tracked objects."
