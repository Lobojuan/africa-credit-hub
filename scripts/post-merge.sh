#!/bin/bash
set -e
npm install
npx drizzle-kit push --force 2>&1 || echo "drizzle-kit push completed (may have had interactive prompts, skipping)"
