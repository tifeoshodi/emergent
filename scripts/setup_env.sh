#!/bin/bash
# Setup script to install Python and Node dependencies

set -euo pipefail

# Determine repository root from the script location and switch to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

# Ensure pip is available
if ! command -v python3 >/dev/null 2>&1; then
    echo "Error: python3 not found. Please install Python 3." >&2
    exit 1
fi
if ! command -v pip >/dev/null 2>&1; then
    echo "Error: pip not found. Please install Python's pip." >&2
    exit 1
fi

# install python packages
if [ -f requirements.txt ]; then
    echo "Installing Python packages from requirements.txt"
    pip install --root-user-action=ignore -r requirements.txt
fi

if [ -f backend/requirements.txt ]; then
    echo "Installing Python packages from backend/requirements.txt"
    pip install --root-user-action=ignore -r backend/requirements.txt
fi

# install frontend dependencies if npm is available
if [ -d frontend ]; then
    if command -v npm >/dev/null 2>&1; then
        echo "Installing frontend packages with npm"
        (cd frontend && npm install)
    else
        echo "npm not found. Please install Node.js and npm to set up frontend dependencies."
    fi
fi

echo "Dependency installation complete."
