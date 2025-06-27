#!/bin/bash
# Setup script to install Python and Node dependencies

set -e

# install python packages
if [ -f requirements.txt ]; then
    echo "Installing Python packages from requirements.txt"
    pip install -r requirements.txt
fi

if [ -f backend/requirements.txt ]; then
    echo "Installing Python packages from backend/requirements.txt"
    pip install -r backend/requirements.txt
fi

# install frontend dependencies if yarn is available
if [ -d frontend ]; then
    if command -v yarn >/dev/null 2>&1; then
        echo "Installing frontend packages with yarn"
        (cd frontend && yarn install)
    else
        echo "Yarn not found. Please install yarn to set up frontend dependencies."
    fi
fi

echo "Dependency installation complete."
