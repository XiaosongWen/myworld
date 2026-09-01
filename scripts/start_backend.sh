#!/bin/bash

# Navigate to the backend directory
cd "$(dirname "$0")/../backend" || exit 1

# Activate virtual environment
if [ -d "../.venv" ]; then
    source ../.venv/bin/activate
fi

echo "Starting backend in dev mode..."
export ENV=dev

# Kill any process currently using port 8000
PID=$(lsof -t -i:8000)
if [ ! -z "$PID" ]; then
    echo "Killing process $PID on port 8000..."
    kill -9 $PID
fi

uvicorn main:app --reload --host 127.0.0.1 --port 8000
