"""
FIIT API — lite build (no ML model).
Handles AI proxy (/ai/analyze) and health checks only.
The /classify and /analyze-food endpoints are stubbed and return 503
until the full ML build is deployed.
"""
import os, logging
from datetime import datetime
from typing import List, Optional

import requests
import sentry_sdk
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sentry_sdk.integrations.fastapi import FastApiIntegration

# ─── Config ───────────────────────────────────────────────────────────────────

API_KEY          = os.getenv("API_KEY", "")
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY   = os.getenv("GOOGLE_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
SENTRY_DSN       = os.getenv("SENTRY_DSN", "")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FastApiIntegration(auto_enabling_instrumentations=False)],
        environment=os.getenv("ENVIRONMENT", "development"),
        traces_sample_rate=0.1,
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(title="fiit-api-lite", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

# ─── Auth ─────────────────────────────────────────────────────────────────────

security = HTTPBearer(auto_error=False)

async def verify_api_key(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
):
    provided = x_api_key or (credentials.credentials if credentials else None)
    if not provided or provided != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ─── Request models ───────────────────────────────────────────────────────────

class AIMessage(BaseModel):
    role: str
    content: str

class AIRequest(BaseModel):
    provider: str = "openai"
    model: Optional[str] = None
    messages: List[AIMessage]
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.7

# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "healthy", "build": "lite", "timestamp": datetime.utcnow().isoformat()}

@app.get("/ready")
async def ready():
    return {"status": "ready", "build": "lite", "timestamp": datetime.utcnow().isoformat()}

@app.get("/")
async def root():
    return {"message": "FIIT API (lite)", "version": "1.0.0", "status": "running"}

# ─── AI proxy ─────────────────────────────────────────────────────────────────

@app.post("/ai/analyze")
async def analyze_ai(
    payload: AIRequest,
    _: HTTPAuthorizationCredentials = Depends(verify_api_key),
):
    provider = payload.provider.lower().strip()

    if provider == "openai":
        if not OPENAI_API_KEY:
            raise HTTPException(status_code=503, detail="OpenAI API key not configured")
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": payload.model or "gpt-4o-mini",
                "messages": [m.dict() for m in payload.messages],
                "max_tokens": payload.max_tokens,
                "temperature": payload.temperature,
            },
            timeout=20,
        )
        _raise_for_provider(resp, "OpenAI")
        content = resp.json().get("choices", [{}])[0].get("message", {}).get("content")
        if not content:
            raise HTTPException(status_code=502, detail="Empty response from OpenAI")
        return {"content": content}

    if provider in ("google", "gemini"):
        if not GOOGLE_API_KEY:
            raise HTTPException(status_code=503, detail="Google API key not configured")
        model_name = payload.model or "gemini-1.5-flash"
        contents = [
            {
                "role": "user" if m.role == "user" else "model",
                "parts": [{"text": m.content}],
            }
            for m in payload.messages
        ]
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent",
            params={"key": GOOGLE_API_KEY},
            headers={"Content-Type": "application/json"},
            json={
                "contents": contents,
                "generationConfig": {
                    "maxOutputTokens": payload.max_tokens,
                    "temperature": payload.temperature,
                },
            },
            timeout=20,
        )
        _raise_for_provider(resp, "Google")
        candidates = resp.json().get("candidates", [])
        content = (
            candidates[0].get("content", {}).get("parts", [{}])[0].get("text")
            if candidates else None
        )
        if not content:
            raise HTTPException(status_code=502, detail="Empty response from Gemini")
        return {"content": content}

    if provider == "anthropic":
        if not ANTHROPIC_API_KEY:
            raise HTTPException(status_code=503, detail="Anthropic API key not configured")
        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": payload.model or "claude-sonnet-4-6",
                "max_tokens": payload.max_tokens,
                "messages": [m.dict() for m in payload.messages],
            },
            timeout=20,
        )
        _raise_for_provider(resp, "Anthropic")
        items = resp.json().get("content", [])
        content = items[0].get("text") if items else None
        if not content:
            raise HTTPException(status_code=502, detail="Empty response from Anthropic")
        return {"content": content}

    raise HTTPException(status_code=400, detail=f"Unsupported provider: {payload.provider}")

# ─── ML stubs (not available in lite build) ───────────────────────────────────

@app.post("/classify")
async def classify(_: HTTPAuthorizationCredentials = Depends(verify_api_key)):
    raise HTTPException(status_code=503, detail="Food classification not available in lite build")

@app.post("/analyze-food")
async def analyze_food(_: HTTPAuthorizationCredentials = Depends(verify_api_key)):
    raise HTTPException(status_code=503, detail="Food photo analysis not available in lite build")

# ─── Helpers ──────────────────────────────────────────────────────────────────

def _raise_for_provider(resp: requests.Response, name: str):
    if not resp.ok:
        logger.error("%s error %s: %s", name, resp.status_code, resp.text[:200])
        raise HTTPException(status_code=502, detail=f"{name} API error: {resp.status_code}")
