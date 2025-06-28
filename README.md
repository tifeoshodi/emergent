# emergent

This repository contains a full stack application with a FastAPI backend and a React frontend.

## Setup

Use the provided setup script to install the project dependencies.

```bash
bash scripts/setup_env.sh
```

The script installs Python packages listed in both `requirements.txt` files and installs frontend dependencies via `yarn` if available.

Running this script requires network access to fetch packages from external repositories.

## Discipline Project Directory

The API provides an endpoint for listing projects related to a discipline:

```http
GET /api/disciplines/{discipline}/projects
```

It returns all projects that contain tasks or documents for the given discipline
with counts of those items. This helps teams quickly navigate work across
multiple projects.
