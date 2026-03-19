#!/bin/bash
set +e +o pipefail

export NODE_ENV=development

exec node --require ./server/stdout-guard.cjs --import tsx/esm server/index.ts 2>&1
