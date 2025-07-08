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


## Docker Compose

To run the services with Docker Compose, ensure `.env` files exist at `backend/.env` and `frontend/.env`. Then start the stack:

```bash
docker-compose up
```

The backend API will be accessible on `localhost:8001` and the frontend on `localhost:8080`.


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

## Authentication

The frontend no longer uses Supabase authentication. When visiting the app you will be presented with a simple login screen listing users fetched from `/api/users`. Selecting a user stores their ID in `localStorage` and all API requests automatically include this value in the `X-User-ID` header. Use the logout button to clear the stored ID.
