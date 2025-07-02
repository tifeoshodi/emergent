# PMFusion - Project Management Platform

This repository contains a full stack application with a FastAPI backend and a React frontend.

## Setup

Use the provided setup script to install the project dependencies.

```bash
bash scripts/setup_env.sh
```

The script installs Python packages listed in both `requirements.txt` files and installs frontend dependencies via `yarn` if available.

Running this script requires network access to fetch packages from external repositories.

## API

Task objects include an optional `phase` string. The field may be supplied when
creating or updating a task and is returned in task responses. It is used by the
WBS generation logic to group tasks by project phase.
