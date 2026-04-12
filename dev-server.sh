#!/bin/bash
set +e +o pipefail

export NODE_ENV=development
export RUN_SEED=true

export VITE_PLATFORM_COMPANY_NAME="${PLATFORM_COMPANY_NAME:-Africa Credit Hub}"
export VITE_PLATFORM_SUPPORT_EMAIL="${PLATFORM_SUPPORT_EMAIL:-support@africacredithub.com}"
export VITE_PLATFORM_CONTACT_PHONE="${PLATFORM_CONTACT_PHONE:-}"
export VITE_PLATFORM_CTO_NAME="${PLATFORM_CTO_NAME:-}"
export VITE_PLATFORM_CTO_EMAIL="${PLATFORM_CTO_EMAIL:-}"

exec node --require ./server/stdout-guard.cjs --import tsx/esm server/index.ts 2>&1
