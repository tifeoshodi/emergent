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

## Environment Variables

The backend reads an optional `API_VERSION` environment variable. This value is
returned by the `/api/v2/health` endpoint and defaults to `"2.0"` when not set.

## Docker Compose

To run the services with Docker Compose, ensure `.env` files exist at `backend/.env` and `frontend/.env`. Then start the stack:

```bash
docker-compose up
```

The backend API will be accessible on `localhost:8001` and the frontend on `localhost:8080`.
