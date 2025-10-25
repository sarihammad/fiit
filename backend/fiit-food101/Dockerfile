# Multi-stage build for security and size optimization
FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy Python packages from builder
COPY --from=builder /root/.local /home/appuser/.local

WORKDIR /app

# Copy application code
COPY app.py .
COPY production_config.py .
COPY monitoring.py .
COPY error_handling.py .
COPY caching.py .
COPY performance.py .
COPY security_config.py .
COPY food101_to_fdc.csv .
COPY food101_to_fdc_ids.csv .

# Create cache directory and set ownership
RUN mkdir -p /home/appuser/.cache/huggingface/hub && \
    chown -R appuser:appuser /app /home/appuser/.cache

# Switch to non-root user
USER appuser

# Update PATH for non-root user
ENV PATH=/home/appuser/.local/bin:$PATH
ENV PIP_NO_CACHE_DIR=1
ENV TRANSFORMERS_CACHE=/home/appuser/.cache/huggingface/hub

# Production environment variables
ENV ENVIRONMENT=production
ENV LOG_LEVEL=INFO
ENV ENABLE_METRICS=true
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

# Use exec form for better signal handling with production optimizations
CMD ["python", "-m", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1", "--access-log", "--log-level", "info"]