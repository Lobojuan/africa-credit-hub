#!/bin/bash
trap '' HUP PIPE

export NODE_ENV=development
NODE_OPTIONS="--require ./server/stdout-guard.cjs" exec node --import tsx/esm server/index.ts
