#!/bin/bash

# Navigate to the frontend directory
cd "$(dirname "$0")/../frontend" || exit 1

echo "Starting frontend in dev mode..."

# Kill any process currently using port 5173
PID=$(lsof -t -i:5173)
if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port 5173..."
    kill -9 $PID
fi

npm run dev
