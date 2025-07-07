# PMFusion - Project Management Platform

This repository contains a full stack application with a FastAPI backend and a Next.js frontend.

## Setup

Use the provided setup script to install the project dependencies **before running the test suite**.

```bash
bash scripts/setup_env.sh
```

The script installs Python packages listed in both `requirements.txt` files—including packages such as `motor`, `requests`, and `python-multipart`—and installs frontend dependencies via `npm` if available.

Running this script requires network access to fetch packages from external repositories.


After the environment is prepared you can run the test suite with the Makefile
target which automatically executes the setup script before invoking `pytest`:

```bash
make test
```

This is equivalent to running `bash scripts/setup_env.sh` followed by
`pytest -q`.


## Docker Compose

To run the services with Docker Compose, ensure `.env` files exist at `backend/.env` and `frontend/.env`. Then start the stack:

```bash
docker-compose up
```

The backend API will be accessible on `localhost:8001` and the frontend on `localhost:8080`.

## Live End-to-End Tests

Run the full integration suite against the Docker stack with:

```bash
bash scripts/run_live_tests.sh
```

The script starts the containers, waits for the `/api/v2/health` endpoint to
become available, executes `backend_test.py`, and then shuts everything down.

## Encrypted Environment Files

This repository stores encrypted versions of the required `.env` files using `sops`.
To decrypt them, run the following commands:

```bash
# Decrypt the root environment file
sops -d .env.enc > .env

# Backend and frontend environment files
sops -d backend/.env.enc > backend/.env
sops -d frontend/.env.enc > frontend/.env
```

After decrypting, you can run Docker Compose or other tooling that relies on these environment files.
