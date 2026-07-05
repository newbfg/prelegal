# syntax=docker/dockerfile:1

# --- Stage 1: build the frontend as a static export ---------------------
FROM node:22-alpine AS frontend-build
WORKDIR /src

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

# templates/ sits alongside frontend/ in the repo; the Next app reads it at
# build time via fs.readFileSync(process.cwd() + "/../templates/...").
COPY templates/ ./templates/
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# --- Stage 2: FastAPI backend, serving the API and the static export -----
FROM python:3.12-slim AS backend
WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-install-project

COPY backend/app ./app
COPY --from=frontend-build /src/frontend/out ./static

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
