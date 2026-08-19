FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY hub/ /app/hub/

ENV PORT=8000
ENV NEXUS_API_KEY=nexus_dev_key_2026
ENV NEXUS_ADMIN_TOKEN=nexus_admin_secret_2026
ENV BAN_TTL_HOURS=24

EXPOSE 8000

CMD ["uvicorn", "hub.main:app", "--host", "0.0.0.0", "--port", "8000"]
