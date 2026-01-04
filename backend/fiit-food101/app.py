import io, os, logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from PIL import Image, ImageOps
import torch
import numpy as np
from transformers import AutoImageProcessor, AutoModelForImageClassification
import requests
import csv
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import secrets
from datetime import datetime, timedelta
import hashlib
import time
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

# Import production modules
from production_config import ProductionConfig
from monitoring import metrics, rate_limiter, health_checker, initialize_monitoring, RequestTimer
from error_handling import (
    APIError, ValidationError, AuthenticationError, RateLimitError, ModelError, ExternalAPIError,
    global_exception_handler, http_exception_handler, validation_exception_handler,
    rate_limit_exception_handler, model_exception_handler, external_api_exception_handler
)
from caching import cache_manager, cache_model_prediction, get_cached_model_prediction

# Load production configuration
config = ProductionConfig()

# Initialize Sentry
if config.SENTRY_DSN:
    sentry_sdk.init(
        dsn=config.SENTRY_DSN,
        integrations=[
            FastApiIntegration(auto_enabling_instrumentations=False),
            LoggingIntegration(level=logging.INFO, event_level=logging.ERROR),
        ],
        environment=config.ENVIRONMENT,
        release=config.APP_VERSION,
        traces_sample_rate=0.1,
        before_send=lambda event, hint: event if config.ENVIRONMENT != "development" else None,
    )

# Validate configuration
config_validation = config.validate()
if not config_validation["valid"]:
    logger.error(f"Configuration validation failed: {config_validation['issues']}")
    raise ValueError(f"Invalid configuration: {config_validation['issues']}")

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize monitoring
initialize_monitoring(config)

# Load FDC mapping
LABEL_TO_FDC: Dict[str, Dict[str, Any]] = {}
MAP_PATH = "food101_to_fdc_ids.csv"
MAX_FILE_SIZE = config.MAX_FILE_SIZE

app = FastAPI(
    title="fiit-food101",
    description="Secure food classification API with production monitoring",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Add error handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(RateLimitError, rate_limit_exception_handler)
app.add_exception_handler(ModelError, model_exception_handler)
app.add_exception_handler(ExternalAPIError, external_api_exception_handler)

# Security middleware
security = HTTPBearer(auto_error=False)

# CORS with production configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=config.CORS_METHODS,
    allow_headers=config.CORS_HEADERS,
    max_age=3600,
)

# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    
    # Check rate limit only if rate_limiter is available
    if rate_limiter and not rate_limiter.is_allowed(client_ip):
        remaining = rate_limiter.get_remaining_requests(client_ip)
        if metrics:
            metrics.increment("rate_limit_exceeded", labels={"client_ip": client_ip})
        raise RateLimitError(
            f"Rate limit exceeded. Try again later.",
            retry_after=3600  # 1 hour
        )
    
    # Record request only if metrics is available
    if metrics:
        metrics.increment("requests_total", labels={"client_ip": client_ip})
    
    response = await call_next(request)
    return response

# Authentication dependency
async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")
):
    provided_key = x_api_key or (credentials.credentials if credentials else None)

    if not provided_key or provided_key != config.API_KEY:
        if metrics:
            metrics.increment("auth_failed")
        raise AuthenticationError("Invalid API key")
    if metrics:
        metrics.increment("auth_success")
    return credentials

# AI proxy request models
class AIProxyMessage(BaseModel):
    role: str
    content: str

class AIProxyRequest(BaseModel):
    provider: str = "openai"
    model: Optional[str] = None
    messages: List[AIProxyMessage]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7
    response_format: Optional[Dict[str, Any]] = None

# Load model with timeout handling
logger.info(f"Loading model: {config.MODEL_ID}")
try:
    with RequestTimer("model_loading"):
        if config.HF_TOKEN:
            processor = AutoImageProcessor.from_pretrained(config.MODEL_ID, token=config.HF_TOKEN)
            model = AutoModelForImageClassification.from_pretrained(config.MODEL_ID, token=config.HF_TOKEN)
        else:
            processor = AutoImageProcessor.from_pretrained(config.MODEL_ID)
            model = AutoModelForImageClassification.from_pretrained(config.MODEL_ID)
        model.eval()
        logger.info("Model loaded successfully")
        if metrics:
            metrics.set_gauge("model_loaded", 1)
        
        # Update health check
        if health_checker:
            health_checker.register_check("model_loaded", lambda: True)
        
except Exception as e:
    logger.error(f"Error loading model: {e}")
    if metrics:
        metrics.set_gauge("model_loaded", 0)
    raise ModelError(f"Failed to load model: {e}")

def softmax(t: torch.Tensor) -> list:
    """Safely compute softmax probabilities"""
    e = torch.exp(t - t.max())
    return (e / e.sum()).tolist()

def load_map() -> None:
    """Load FDC mapping with error handling"""
    global LABEL_TO_FDC
    LABEL_TO_FDC = {}
    try:
        if not os.path.exists(MAP_PATH):
            logger.warning(f"No FDC map found at {MAP_PATH}; will use live lookup.")
            return
            
        with open(MAP_PATH, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                label = (row.get("label") or "").strip().lower()
                fdcId = row.get("fdcId") or ""
                if label and fdcId:
                    try:
                        LABEL_TO_FDC[label] = {
                            "fdcId": int(fdcId),
                            "description": row.get("fdcDescription") or row.get("fdcQuery") or "",
                        }
                    except ValueError:
                        logger.warning(f"Invalid FDC ID for label {label}: {fdcId}")
                        continue
        logger.info(f"Loaded {len(LABEL_TO_FDC)} label→FDC entries from {MAP_PATH}")
    except Exception as e:
        logger.error(f"Failed to load FDC map: {e}")

def fdc_lookup(name: str) -> Optional[Dict[str, Any]]:
    """Secure FDC lookup with input validation and timeout"""
    if not FDC_API_KEY or not name or len(name.strip()) == 0:
        return None
    
    # Sanitize input
    name = name.strip()[:100]  # Limit length
    
    try:
        r = requests.get(
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={"api_key": FDC_API_KEY, "query": name, "pageSize": 1},
            timeout=5  # Increased timeout
        )
        r.raise_for_status()
        js = r.json()
        
        if js.get("foods"):
            f = js["foods"][0]
            nutrients = {n.get("nutrientName","").lower(): n.get("value") for n in f.get("foodNutrients", [])}
            return {
                "fdcId": f.get("fdcId"),
                "description": f.get("description"),
                "kcal": nutrients.get("energy") or nutrients.get("energy, kcal"),
                "protein": nutrients.get("protein"),
                "carbs": nutrients.get("carbohydrate, by difference"),
                "fat": nutrients.get("total lipid (fat)"),
            }
    except Exception as e:
        logger.error(f"FDC lookup failed for {name}: {e}")
        return None

def fdc_nutrients_by_id(fdc_id: int) -> Optional[Dict[str, Any]]:
    """Secure FDC lookup by ID with input validation"""
    if not FDC_API_KEY or not isinstance(fdc_id, int) or fdc_id <= 0:
        return None
        
    try:
        r = requests.get(f"https://api.nal.usda.gov/fdc/v1/food/{fdc_id}",
                         params={"api_key": FDC_API_KEY}, timeout=5)
        r.raise_for_status()
        j = r.json()
        
        def get(name: str) -> Optional[float]:
            for n in j.get("foodNutrients", []):
                if n.get("nutrientName","").lower() == name:
                    return n.get("value")
            return None
            
        return {
            "fdcId": fdc_id,
            "description": j.get("description"),
            "kcal": get("energy") or get("energy, kcal"),
            "protein": get("protein"),
            "carbs": get("carbohydrate, by difference"),
            "fat": get("total lipid (fat)"),
        }
    except Exception as e:
        logger.error(f"FDC lookup by ID failed for {fdc_id}: {e}")
        return None

def nutrition_for_label(label: str) -> Optional[Dict[str, Any]]:
    """Get nutrition data for a food label"""
    if not label or len(label.strip()) == 0:
        return None
        
    key = label.strip().lower()
    if key in LABEL_TO_FDC:
        entry = LABEL_TO_FDC[key]
        return fdc_nutrients_by_id(entry["fdcId"]) or {
            "fdcId": entry["fdcId"], 
            "description": entry["description"]
        }
    return fdc_lookup(label)

def validate_image(file: UploadFile) -> Image.Image:
    """Validate and process uploaded image"""
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size: {MAX_FILE_SIZE} bytes")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and validate image
        content = file.file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
            
        img = Image.open(io.BytesIO(content))
        # Normalize orientation and ensure RGB
        img = ImageOps.exif_transpose(img).convert("RGB")
        
        # Validate image dimensions
        if img.width > 4096 or img.height > 4096:
            raise HTTPException(status_code=400, detail="Image too large. Maximum dimensions: 4096x4096")
            
        return img
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")

# Load FDC mapping on startup
load_map()

# Production endpoints
@app.get("/metrics")
async def get_metrics():
    """Get application metrics for monitoring"""
    if not config.ENABLE_METRICS:
        raise HTTPException(status_code=404, detail="Metrics disabled")
    
    return {
        "metrics": metrics.get_metrics() if metrics else {},
        "cache_stats": cache_manager.get_stats(),
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/status")
async def get_status():
    """Get detailed application status"""
    health_results = health_checker.run_checks() if health_checker else {}
    
    return {
        "status": "healthy" if health_results and all(r["status"] == "healthy" for r in health_results.values()) else "degraded",
        "checks": health_results,
        "config": {
            "model_id": config.MODEL_ID,
            "max_file_size_mb": config.MAX_FILE_SIZE / (1024 * 1024),
            "rate_limit_per_hour": config.RATE_LIMIT_REQUESTS,
            "cache_stats": cache_manager.get_stats()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/ai/analyze")
async def analyze_ai(
    payload: AIProxyRequest,
    credentials: HTTPAuthorizationCredentials = Depends(verify_api_key)
):
    """Proxy AI requests through the backend to keep provider keys off clients"""
    provider = payload.provider.lower().strip()

    if provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ExternalAPIError("OpenAI API key not configured")

        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": payload.model or "gpt-4",
                "messages": [m.dict() for m in payload.messages],
                "max_tokens": payload.max_tokens or 1000,
                "temperature": payload.temperature or 0.7,
                **({"response_format": payload.response_format} if payload.response_format else {}),
            },
            timeout=15,
        )
        try:
            response.raise_for_status()
        except Exception as exc:
            raise ExternalAPIError(f"OpenAI API error: {response.status_code}") from exc

        result = response.json()
        content = result.get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise ExternalAPIError("OpenAI response missing content")
        return {"content": content}

    if provider == "anthropic":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ExternalAPIError("Anthropic API key not configured")

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": payload.model or "claude-3-sonnet-20240229",
                "max_tokens": payload.max_tokens or 1000,
                "temperature": payload.temperature or 0.7,
                "messages": [m.dict() for m in payload.messages],
            },
            timeout=15,
        )
        try:
            response.raise_for_status()
        except Exception as exc:
            raise ExternalAPIError(f"Anthropic API error: {response.status_code}") from exc

        result = response.json()
        content_items = result.get("content") or []
        content = content_items[0].get("text") if content_items else None
        if not content:
            raise ExternalAPIError("Anthropic response missing content")
        return {"content": content}

    raise ValidationError(f"Unsupported AI provider: {payload.provider}")

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "model": config.MODEL_ID,
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/ready")
async def ready():
    """Readiness check endpoint"""
    try:
        # Check if model is loaded
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")
        
        # Check if FDC mapping is loaded
        if not LABEL_TO_FDC:
            raise HTTPException(status_code=503, detail="FDC mapping not loaded")
        
        return {
            "status": "ready",
            "model": config.MODEL_ID,
            "fdc_mapping_loaded": len(LABEL_TO_FDC) > 0,
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Service not ready")

def validate_image_content(content: bytes) -> Image.Image:
    """Validate and process image content"""
    try:
        # Validate file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="File too large")
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Try to open image with PIL
        img = Image.open(io.BytesIO(content))
        img = ImageOps.exif_transpose(img).convert("RGB")
        
        # Validate image dimensions
        if img.width > 2048 or img.height > 2048:
            raise HTTPException(status_code=413, detail="Image dimensions too large")
        
        return img
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")

async def validate_image(file: UploadFile) -> Image.Image:
    """Validate and process uploaded image file"""
    try:
        # Read file content
        content = await file.read()
        return validate_image_content(content)
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid image file")

@app.post("/classify")
async def classify(
    request: Request,
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(verify_api_key)
):
    """Classify food image with production monitoring and caching"""
    start_time = time.time()
    
    try:
        # Generate image hash for caching
        file_content = await file.read()
        image_hash = hashlib.md5(file_content).hexdigest()
        
        # Check cache first
        cached_result = get_cached_model_prediction(image_hash)
        if cached_result:
            if metrics:
                metrics.increment("cache_hit", labels={"type": "model_prediction"})
            return cached_result
        
        # Validate image using the content we already read
        img = validate_image_content(file_content)
        
        # Manual preprocessing to avoid processor padding issues
        try:
            target_size = 224
            # Resize and center crop manually
            img_processed = ImageOps.fit(img, (target_size, target_size), Image.Resampling.LANCZOS)
            
            # Convert to numpy array and normalize
            img_array = np.array(img_processed).astype(np.float32) / 255.0
            
            # Normalize with ImageNet stats (standard for ViT models)
            mean = np.array([0.485, 0.456, 0.406])
            std = np.array([0.229, 0.224, 0.225])
            img_array = (img_array - mean) / std
            
            # Convert to tensor: HWC -> CHW
            img_tensor = torch.from_numpy(img_array).permute(2, 0, 1)
            
            # Add batch dimension: CHW -> BCHW
            inputs = {"pixel_values": img_tensor.unsqueeze(0)}
            
        except Exception as e:
            logger.error(f"Manual preprocessing failed: {e}")
            raise HTTPException(status_code=400, detail=f"Image preprocessing failed: {str(e)[:100]}")
        
        with torch.no_grad():
            logits = model(**inputs).logits[0]
            
        probs = softmax(logits)
        id2label = model.config.id2label
        
        # Create ranked predictions
        ranked = sorted(
            [{"label": id2label[i].replace("_", " "), "prob": float(probs[i])} for i in range(len(probs))],
            key=lambda x: x["prob"], reverse=True
        )
        
        topk = ranked[:config.TOPK]
        top1 = topk[0]["prob"]
        
        # Determine decision based on confidence
        if top1 >= config.CONFIDENCE_THRESHOLDS["high"]:
            decision = "auto_accept"
        elif top1 >= config.CONFIDENCE_THRESHOLDS["mid"]:
            decision = "confirm"
        else:
            decision = "fallback"

        # Get nutrition data
        nutrition = nutrition_for_label(topk[0]["label"]) if decision != "fallback" else None
        
        # Create result
        result = {
            "topk": topk, 
            "decision": decision, 
            "nutrition": nutrition,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Cache the result
        cache_model_prediction(image_hash, result)
        
        # Record metrics
        processing_time = time.time() - start_time
        if metrics:
            metrics.observe("classification_duration", processing_time)
            metrics.increment("classifications_total", labels={"decision": decision})
            metrics.increment("cache_miss", labels={"type": "model_prediction"})
        
        logger.info(f"Classification completed: {topk[0]['label']} ({top1:.3f}) - {decision} in {processing_time:.3f}s")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        if metrics:
            metrics.observe("classification_duration", processing_time)
            metrics.increment("classification_errors")
        logger.error(f"Classification failed: {e}")
        raise ModelError(f"Classification failed: {e}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "fiit-food101 API",
        "version": "1.0.0",
        "status": "running"
    }
