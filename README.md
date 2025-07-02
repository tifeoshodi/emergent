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

## Database notes

The backend enforces a unique index on `wbs` entries using the pair
`(project_id, task_id)` and automatically removes a task's WBS node when the
task is deleted.

