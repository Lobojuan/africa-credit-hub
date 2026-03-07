#!/bin/bash
set +e +o pipefail
trap '' HUP PIPE

export NODE_ENV=development

node --require ./server/stdout-guard.cjs --import tsx/esm server/index.ts 2>&1
