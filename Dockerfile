# MedStock AI — single-container build for Hugging Face Spaces (Docker SDK).
# Frontend and backend are served from the same origin/port, so no CORS
# configuration is needed at runtime.

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./
# Relative path -> same-origin requests once both are served together.
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---- Stage 2: Python backend, serving the built frontend as static files ----
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./static

# Hugging Face Spaces (Docker SDK) expects the app on port 7860 and requires
# world-writable permissions since it runs as a non-root user.
RUN mkdir -p /app && chmod -R 777 /app
EXPOSE 7860
ENV PORT=7860

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
