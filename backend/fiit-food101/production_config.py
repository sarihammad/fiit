"""
Production configuration for FIIT Food-101 API
"""
import os
from typing import Dict, Any

class ProductionConfig:
    """Production-ready configuration with security and performance optimizations"""
    
    # Security settings
    API_KEY = os.getenv("API_KEY")
    MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "4096"))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []
    
    # Rate limiting
    RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "1000"))  # per hour
    RATE_LIMIT_WINDOW = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
    RATE_LIMIT_BURST = int(os.getenv("RATE_LIMIT_BURST", "10"))  # burst requests
    
    # Model configuration
    MODEL_ID = os.getenv("MODEL_ID", "eslamxm/vit-base-food101")
    TOPK = int(os.getenv("TOPK", "3"))
    CONFIDENCE_THRESHOLDS = {
        "high": float(os.getenv("T_HIGH", "0.70")),
        "mid": float(os.getenv("T_MID", "0.50")),
        "low": float(os.getenv("T_LOW", "0.35"))
    }
    
    # External APIs
    FDC_API_KEY = os.getenv("FDC_API_KEY")
    HF_TOKEN = os.getenv("HF_TOKEN")
    
    # File paths
    FDC_MAP_PATH = os.getenv("FDC_MAP_PATH", "food101_to_fdc_ids.csv")
    
    # Performance settings
    MODEL_CACHE_SIZE = int(os.getenv("MODEL_CACHE_SIZE", "10"))
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
    MAX_CONCURRENT_REQUESTS = int(os.getenv("MAX_CONCURRENT_REQUESTS", "10"))
    
    # Monitoring and logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_METRICS = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    METRICS_ENDPOINT = os.getenv("METRICS_ENDPOINT", "/metrics")
    
    # Health check settings
    HEALTH_CHECK_INTERVAL = int(os.getenv("HEALTH_CHECK_INTERVAL", "30"))
    HEALTH_CHECK_TIMEOUT = int(os.getenv("HEALTH_CHECK_TIMEOUT", "5"))
    
    # Sentry configuration
    SENTRY_DSN = os.getenv("SENTRY_DSN")
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
    
    # CORS settings
    CORS_ORIGINS = ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"]
    CORS_METHODS = ["GET", "POST", "OPTIONS"]
    CORS_HEADERS = ["*"]
    
    @classmethod
    def validate(cls) -> Dict[str, Any]:
        """Validate configuration and return any issues"""
        issues = []
        
        if not cls.API_KEY:
            issues.append("API_KEY is required")
        
        if not cls.FDC_API_KEY:
            issues.append("FDC_API_KEY is required for nutrition data")
        
        if not cls.HF_TOKEN:
            issues.append("HF_TOKEN is recommended for HuggingFace model access")
        
        if cls.MAX_FILE_SIZE > 50 * 1024 * 1024:  # 50MB
            issues.append("MAX_FILE_SIZE is too large (>50MB)")
        
        if cls.RATE_LIMIT_REQUESTS > 10000:  # 10k requests per hour
            issues.append("RATE_LIMIT_REQUESTS is very high")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": {
                "max_file_size_mb": cls.MAX_FILE_SIZE / (1024 * 1024),
                "rate_limit_per_hour": cls.RATE_LIMIT_REQUESTS,
                "model_id": cls.MODEL_ID,
                "topk": cls.TOPK,
                "confidence_thresholds": cls.CONFIDENCE_THRESHOLDS
            }
        }
