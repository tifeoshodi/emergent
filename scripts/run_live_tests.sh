#!/bin/bash

# Run backend integration tests against the docker-compose stack
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}/.."
cd "$REPO_ROOT"

# Start docker-compose services in the background
docker-compose up -d

# Wait for the API to become healthy
echo "Waiting for backend health check..."
until curl -sf http://localhost:8001/api/v2/health >/dev/null; do
    sleep 2
    echo "...still waiting"
done

echo "Backend is up. Running integration tests..."
export RUN_BACKEND_TESTS=1
pytest backend_test.py
EXIT_CODE=$?

# Shut down the stack
docker-compose down

exit $EXIT_CODE
