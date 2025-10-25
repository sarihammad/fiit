"""
Security configuration for fiit-food101 API
"""
import os
import secrets
from typing import List

# API Security
API_KEY = os.getenv("API_KEY", secrets.token_urlsafe(32))
API_KEY_HEADER = "X-API-Key"

# CORS Configuration
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:8081").split(",")
ALLOWED_METHODS = ["GET", "POST"]
ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-API-Key"]

# Rate Limiting
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))  # per hour
RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour

# File Upload Security
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/png", 
    "image/webp",
    "image/gif"
]
MAX_IMAGE_DIMENSIONS = (4096, 4096)

# Input Validation
MAX_LABEL_LENGTH = 100
MAX_FDC_QUERY_LENGTH = 200

# External API Security
FDC_API_TIMEOUT = 5
HF_API_TIMEOUT = 10

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Security Headers
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'",
}
