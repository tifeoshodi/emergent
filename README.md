# PMFusion - Project Management Platform

This repository contains a full stack application with a FastAPI backend and a React frontend.

## Setup

Use the provided setup script to install all backend and frontend dependencies.

```bash
bash scripts/setup_env.sh
```

The script installs Python packages listed in both `requirements.txt` files and
installs frontend packages via `yarn` if available. Network access is required
to fetch these packages.

### Running the test suite

After the environment is prepared you can run the combined backend and frontend
tests via the Makefile target which automatically executes the setup script:

```bash
make test
```

This is equivalent to running `bash scripts/setup_env.sh` followed by
`pytest -q` for the backend and `yarn test` for the frontend.

## Frontend Development

Install dependencies inside the `frontend` directory and start the Next.js
development server:

```bash
cd frontend
yarn install
yarn dev
```

To generate a production build run `yarn build`. The optimized bundle will be
placed in `frontend/.next`. You can preview it locally with `yarn start`.


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

The FastAPI backend is exposed under the `/api` prefix. When running the stack
locally it is available at `http://localhost:8001/api`.

When opening the app you are presented with a simple login screen listing users
fetched from `/api/users`. Selecting a user stores their ID in `localStorage`.
Every API request must include this ID in the `X-User-ID` header. Use the
logout button to clear the stored value.
