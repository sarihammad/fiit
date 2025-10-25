"""
Comprehensive error handling and logging for FIIT Food-101 API
"""
import logging
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import uuid

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class APIError(Exception):
    """Base API error class"""
    
    def __init__(self, message: str, error_code: str = "INTERNAL_ERROR", status_code: int = 500, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

class ValidationError(APIError):
    """Input validation error"""
    
    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details={"field": field} if field else {}
        )

class AuthenticationError(APIError):
    """Authentication error"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=401
        )

class RateLimitError(APIError):
    """Rate limit exceeded error"""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        super().__init__(
            message=message,
            error_code="RATE_LIMIT_ERROR",
            status_code=429,
            details={"retry_after": retry_after} if retry_after else {}
        )

class ModelError(APIError):
    """Model processing error"""
    
    def __init__(self, message: str = "Model processing failed"):
        super().__init__(
            message=message,
            error_code="MODEL_ERROR",
            status_code=500
        )

class ExternalAPIError(APIError):
    """External API error"""
    
    def __init__(self, service: str, message: str = "External API error"):
        super().__init__(
            message=f"{service}: {message}",
            error_code="EXTERNAL_API_ERROR",
            status_code=502,
            details={"service": service}
        )

def log_error(error: Exception, request: Optional[Request] = None, context: Optional[Dict[str, Any]] = None):
    """Log error with context"""
    error_id = str(uuid.uuid4())
    
    log_data = {
        "error_id": error_id,
        "error_type": type(error).__name__,
        "error_message": str(error),
        "timestamp": datetime.utcnow().isoformat(),
        "context": context or {}
    }
    
    if request:
        log_data.update({
            "method": request.method,
            "url": str(request.url),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        })
    
    if isinstance(error, APIError):
        log_data.update({
            "error_code": error.error_code,
            "status_code": error.status_code,
            "details": error.details
        })
        logger.warning(f"API Error {error_id}: {error.message}", extra=log_data)
    else:
        log_data["traceback"] = traceback.format_exc()
        logger.error(f"Unexpected Error {error_id}: {error.message}", extra=log_data)
    
    return error_id

def create_error_response(error: Exception, request: Optional[Request] = None) -> JSONResponse:
    """Create standardized error response"""
    error_id = log_error(error, request)
    
    if isinstance(error, APIError):
        return JSONResponse(
            status_code=error.status_code,
            content={
                "error": {
                    "code": error.error_code,
                    "message": error.message,
                    "error_id": error_id,
                    "details": error.details,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
    else:
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "error_id": error_id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

def handle_validation_error(error: ValidationError) -> JSONResponse:
    """Handle validation errors with detailed field information"""
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": error.message,
                "field": error.details.get("field"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

def handle_rate_limit_error(error: RateLimitError) -> JSONResponse:
    """Handle rate limit errors with retry information"""
    headers = {}
    if error.details.get("retry_after"):
        headers["Retry-After"] = str(error.details["retry_after"])
    
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMIT_ERROR",
                "message": error.message,
                "retry_after": error.details.get("retry_after"),
                "timestamp": datetime.utcnow().isoformat()
            }
        },
        headers=headers
    )

def handle_model_error(error: ModelError) -> JSONResponse:
    """Handle model processing errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "MODEL_ERROR",
                "message": "Food classification failed. Please try again.",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

def handle_external_api_error(error: ExternalAPIError) -> JSONResponse:
    """Handle external API errors"""
    return JSONResponse(
        status_code=502,
        content={
            "error": {
                "code": "EXTERNAL_API_ERROR",
                "message": f"External service ({error.details.get('service', 'unknown')}) is unavailable",
                "timestamp": datetime.utcnow().isoformat()
            }
        }
    )

# Global error handlers
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Global exception handler for unhandled exceptions"""
    return create_error_response(exc, request)

async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions"""
    error = APIError(
        message=exc.detail,
        error_code="HTTP_ERROR",
        status_code=exc.status_code
    )
    return create_error_response(error, request)

async def validation_exception_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle validation exceptions"""
    return handle_validation_error(exc)

async def rate_limit_exception_handler(request: Request, exc: RateLimitError) -> JSONResponse:
    """Handle rate limit exceptions"""
    return handle_rate_limit_error(exc)

async def model_exception_handler(request: Request, exc: ModelError) -> JSONResponse:
    """Handle model exceptions"""
    return handle_model_error(exc)

async def external_api_exception_handler(request: Request, exc: ExternalAPIError) -> JSONResponse:
    """Handle external API exceptions"""
    return handle_external_api_error(exc)
