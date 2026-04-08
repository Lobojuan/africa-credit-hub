#!/bin/bash
set +e +o pipefail

export NODE_ENV=development
export RUN_SEED=true

exec node --require ./server/stdout-guard.cjs --import tsx/esm server/index.ts 2>&1
