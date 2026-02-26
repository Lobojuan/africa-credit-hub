#!/bin/bash
if [ ! -f dist/public/index.html ]; then
  echo "Building application..."
  npm run build
fi

node dist/index.cjs &
SERVER_PID=$!

while kill -0 $SERVER_PID 2>/dev/null; do
  sleep 30
done

wait $SERVER_PID
