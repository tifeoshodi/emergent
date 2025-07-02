# PMFusion - Project Management Platform

This repository contains a full stack application with a FastAPI backend and a React frontend.

## Setup

Use the provided setup script to install the project dependencies **before running the test suite**.

```bash
bash scripts/setup_env.sh
```

The script installs Python packages listed in both `requirements.txt` files—including packages such as `motor`, `requests`, and `python-multipart`—and installs frontend dependencies via `yarn` if available.

Running this script requires network access to fetch packages from external repositories.


After the environment is prepared you can run the test suite with the Makefile
target which automatically executes the setup script before invoking `pytest`:

```bash
make test
```

This is equivalent to running `bash scripts/setup_env.sh` followed by
`pytest -q`.

Frontend builds read `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
from `.env` files when interacting with Supabase.

## Database notes

The backend enforces a unique index on `wbs` entries using the pair
`(project_id, task_id)` and automatically removes a task's WBS node when the
task is deleted.

## Supabase integration

Set `SUPABASE_URL` and `SUPABASE_KEY` in your environment (or `.env` file) to
enable the backend's Supabase client. The connection is initialized at startup
using `create_client` from `supabase_py`.

### Migrations and seed data

Run Supabase migrations from the project root:

```bash
supabase db push
```

After the schema is created you can populate demo rows:

```bash
python scripts/seed_supabase.py
```

### Starting the backend with Supabase enabled

Ensure the environment variables are loaded then start the API:

```bash
uvicorn backend.server:app --reload
```

