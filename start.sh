#!/bin/bash
exec node --max-old-space-size=256 dist/index.cjs
