#!/usr/bin/env python3
"""
UCH TypeScript health check — asyncRewake Stop hook.
Exits 0 (silent) when clean. Exits 2 with JSON systemMessage when errors exist.
"""
import subprocess, json, sys, os

# Repo root, derived from this file's own location — a hardcoded absolute path here
# is wrong in any environment other than the one it was written in (this file is
# shared across a cloud sandbox and local Mac checkouts with different paths).
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    r = subprocess.run(
        ["npm", "run", "check"],
        capture_output=True,
        text=True,
        cwd=REPO_ROOT,
        timeout=120,
    )
    out = r.stdout + r.stderr
    errors = [l for l in out.splitlines() if "error TS" in l]
    if errors:
        count = len(errors)
        preview = "\n".join(errors[:8])
        tail = f"\n…and {count - 8} more" if count > 8 else ""
        msg = (
            f"⚠️  UCH TypeScript: {count} error(s) detected.\n\n"
            f"{preview}{tail}\n\n"
            f"Run `npm run check` for the full list."
        )
        print(json.dumps({"systemMessage": msg}))
        sys.exit(2)
except subprocess.TimeoutExpired:
    print(json.dumps({"systemMessage": "⚠️  UCH TypeScript check timed out (>120 s). Run `npm run check` manually."}))
    sys.exit(2)
except Exception:
    pass
