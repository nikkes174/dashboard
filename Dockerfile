# ---- base image ----
FROM python:3.12-slim

# ---- system deps ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# ---- env ----
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.4 \
    POETRY_VIRTUALENVS_CREATE=false

# ---- workdir ----
WORKDIR /app

# ---- install poetry ----
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# ---- copy dependency files first (for cache) ----
COPY pyproject.toml poetry.lock* /app/

# ---- install deps ----
RUN poetry install --no-interaction --no-ansi --only main

# ---- copy project ----
COPY . /app

# ---- expose ----
EXPOSE 8000

# ---- start ----
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
