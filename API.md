# FIIT API Documentation

This document provides comprehensive API documentation for the FIIT backend service.

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)
6. [Examples](#examples)
7. [SDK Examples](#sdk-examples)

## Authentication

All API endpoints require authentication using an API key. Either header format is accepted:

```http
X-API-Key: your-api-key-here
```

```http
Authorization: Bearer your-api-key-here
```

### Getting an API Key

API keys are provided during the onboarding process. Contact support if you need a new key.

## Endpoints

### Base URL

```
https://your-backend-url.run.app
```

### Health Check

#### GET /health

Check if the service is running.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2023-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

#### GET /ready

Check if the service is ready to handle requests (includes dependency checks).

**Response:**

```json
{
  "status": "ready",
  "model": "nateraw/food-101-vit",
  "fdc_mapping_loaded": true,
  "timestamp": "2023-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

### Food Classification

#### POST /classify

Classify food from an uploaded image.

**Headers (either auth header is accepted):**

```http
X-API-Key: your-api-key-here
Content-Type: multipart/form-data
```

```http
Authorization: Bearer your-api-key-here
Content-Type: multipart/form-data
```

**Request Body:**

- `file` (required): Image file (JPEG, PNG, WebP)
- Max file size: 10MB
- Supported formats: JPEG, PNG, WebP

**Response:**

```json
{
  "topk": [
    { "label": "chicken wings", "prob": 0.95 },
    { "label": "chicken breast", "prob": 0.03 },
    { "label": "chicken thigh", "prob": 0.02 }
  ],
  "decision": "auto_accept",
  "nutrition": {
    "fdcId": 12345,
    "description": "Chicken, wing, raw",
    "kcal": 203,
    "protein": 18.3,
    "carbs": 0.0,
    "fat": 14.2
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Response Fields:**

- `topk`: Array of top predictions with probabilities
- `decision`: Decision type (`auto_accept`, `confirm`, `fallback`)
- `nutrition`: Optional nutrition data for the top prediction
- `timestamp`: Request completion time (ISO 8601)

**Decision Logic:**

- `auto_accept`: Top prediction confidence ≥ 0.8
- `confirm`: Top prediction confidence 0.5-0.8
- `fallback`: Top prediction confidence < 0.5

### AI Proxy

#### POST /ai/analyze

Proxy AI requests so clients do not ship provider API keys.

**Headers (either auth header is accepted):**

```http
X-API-Key: your-api-key-here
Content-Type: application/json
```

```http
Authorization: Bearer your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "provider": "openai",
  "model": "gpt-4",
  "messages": [{ "role": "user", "content": "Hello" }],
  "max_tokens": 1000,
  "temperature": 0.7,
  "response_format": { "type": "json_object" }
}
```

**Response:**

```json
{
  "content": "Model response content"
}
```

### Metrics

#### GET /metrics

Get Prometheus metrics for monitoring.

**Response:**

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",endpoint="/classify",status="200"} 100

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",endpoint="/classify",le="0.1"} 10
http_request_duration_seconds_bucket{method="POST",endpoint="/classify",le="0.5"} 50
http_request_duration_seconds_bucket{method="POST",endpoint="/classify",le="1.0"} 80
http_request_duration_seconds_bucket{method="POST",endpoint="/classify",le="+Inf"} 100

# HELP model_predictions_total Total number of model predictions
# TYPE model_predictions_total counter
model_predictions_total{model="food-101-vit"} 100

# HELP fdc_api_calls_total Total number of FDC API calls
# TYPE fdc_api_calls_total counter
fdc_api_calls_total{status="success"} 95
fdc_api_calls_total{status="error"} 5
```

## Data Models

### Food Prediction

```typescript
interface FoodPrediction {
  label: string; // Food label (e.g., "chicken wings")
  prob: number; // Probability score (0-1)
}

interface NutritionInfo {
  fdcId?: number; // USDA FDC ID
  description?: string; // Food description
  kcal?: number; // Calories per 100g
  protein?: number; // Protein per 100g (g)
  carbs?: number; // Carbs per 100g (g)
  fat?: number; // Fat per 100g (g)
}
```

### Classification Response

```typescript
interface ClassificationResponse {
  topk: FoodPrediction[];
  decision: 'auto_accept' | 'confirm' | 'fallback';
  nutrition?: NutritionInfo | null;
  timestamp: string;
}
```

### Health Response

```typescript
interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
}
```

### Ready Response

```typescript
interface ReadyResponse {
  status: 'ready' | 'not_ready';
  model: string;
  fdc_mapping_loaded: boolean;
  timestamp: string;
  version: string;
}
```

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "request_id": "unique-request-id"
}
```

### Error Codes

| Code                     | Status | Description                          |
| ------------------------ | ------ | ------------------------------------ |
| `UNAUTHORIZED`           | 401    | Missing or invalid API key           |
| `FORBIDDEN`              | 403    | API key doesn't have permission      |
| `BAD_REQUEST`            | 400    | Invalid request format or parameters |
| `FILE_TOO_LARGE`         | 413    | Uploaded file exceeds size limit     |
| `UNSUPPORTED_MEDIA_TYPE` | 415    | Unsupported file format              |
| `RATE_LIMIT_EXCEEDED`    | 429    | Too many requests                    |
| `INTERNAL_ERROR`         | 500    | Internal server error                |
| `SERVICE_UNAVAILABLE`    | 503    | Service temporarily unavailable      |

### Common Error Examples

**Missing API Key:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "API key required",
  "timestamp": "2023-01-01T00:00:00Z",
  "request_id": "req_123"
}
```

**Invalid File Format:**

```json
{
  "error": "UNSUPPORTED_MEDIA_TYPE",
  "message": "Invalid image format. Supported formats: JPEG, PNG, WebP",
  "details": {
    "received_format": "text/plain",
    "supported_formats": ["image/jpeg", "image/png", "image/webp"]
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "request_id": "req_124"
}
```

**File Too Large:**

```json
{
  "error": "FILE_TOO_LARGE",
  "message": "File size exceeds maximum allowed size",
  "details": {
    "file_size": 15728640,
    "max_size": 10485760
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "request_id": "req_125"
}
```

**Rate Limit Exceeded:**

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "details": {
    "limit": 1000,
    "window": 3600,
    "retry_after": 300
  },
  "timestamp": "2023-01-01T00:00:00Z",
  "request_id": "req_126"
}
```

## Rate Limiting

### Limits

- **Requests per hour**: 1000
- **Burst limit**: 10 requests per second
- **Window**: 1 hour (3600 seconds)

### Headers

Rate limit information is included in response headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Exceeded Limit Response

When rate limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 300
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
```

## Examples

### cURL Examples

**Health Check:**

```bash
curl -X GET "https://your-backend-url.run.app/health"
```

**Food Classification:**

```bash
curl -X POST "https://your-backend-url.run.app/classify" \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@food_image.jpg"
```

**With Error Handling:**

```bash
curl -X POST "https://your-backend-url.run.app/classify" \
  -H "X-API-Key: your-api-key-here" \
  -F "file=@food_image.jpg" \
  -w "\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"
```

### JavaScript Examples

**Using Fetch API:**

```javascript
async function classifyFood(imageFile, apiKey) {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await fetch('https://your-backend-url.run.app/classify', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Classification failed:', error);
    throw error;
  }
}

// Usage
const imageFile = document.getElementById('imageInput').files[0];
classifyFood(imageFile, 'your-api-key-here')
  .then(result => {
    console.log('Predictions:', result.predictions);
    console.log('Decision:', result.decision);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

**Using Axios:**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-backend-url.run.app',
  timeout: 10000,
});

// Add API key to all requests
api.interceptors.request.use(config => {
  config.headers['X-API-Key'] = 'your-api-key-here';
  return config;
});

async function classifyFood(imageFile) {
  const formData = new FormData();
  formData.append('file', imageFile);

  try {
    const response = await api.post('/classify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data;
      throw new Error(`API Error: ${errorData.message}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error: No response from server');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
  }
}
```

### Python Examples

**Using requests:**

```python
import requests
import json

def classify_food(image_path, api_key):
    url = "https://your-backend-url.run.app/classify"

    headers = {
        "X-API-Key": api_key
    }

    with open(image_path, 'rb') as image_file:
        files = {
            'file': (image_path, image_file, 'image/jpeg')
        }

        try:
            response = requests.post(url, headers=headers, files=files, timeout=30)
            response.raise_for_status()

            return response.json()

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise Exception("Invalid API key")
            elif e.response.status_code == 413:
                raise Exception("File too large")
            elif e.response.status_code == 429:
                raise Exception("Rate limit exceeded")
            else:
                error_data = e.response.json()
                raise Exception(f"API Error: {error_data.get('message', 'Unknown error')}")

        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")

# Usage
try:
    result = classify_food("food_image.jpg", "your-api-key-here")
    print(f"Predictions: {result['predictions']}")
    print(f"Decision: {result['decision']}")
except Exception as e:
    print(f"Error: {e}")
```

**Using httpx (async):**

```python
import httpx
import asyncio

async def classify_food_async(image_path, api_key):
    url = "https://your-backend-url.run.app/classify"

    headers = {
        "X-API-Key": api_key
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        with open(image_path, 'rb') as image_file:
            files = {
                'file': (image_path, image_file, 'image/jpeg')
            }

            try:
                response = await client.post(url, headers=headers, files=files)
                response.raise_for_status()

                return response.json()

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise Exception("Invalid API key")
                elif e.response.status_code == 413:
                    raise Exception("File too large")
                elif e.response.status_code == 429:
                    raise Exception("Rate limit exceeded")
                else:
                    error_data = e.response.json()
                    raise Exception(f"API Error: {error_data.get('message', 'Unknown error')}")

            except httpx.RequestError as e:
                raise Exception(f"Network error: {str(e)}")

# Usage
async def main():
    try:
        result = await classify_food_async("food_image.jpg", "your-api-key-here")
        print(f"Predictions: {result['predictions']}")
        print(f"Decision: {result['decision']}")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
```

## SDK Examples

### React Native SDK

```typescript
// FIIT SDK for React Native
class FIITSDK {
  private apiKey: string;
  private baseURL: string;

  constructor(
    apiKey: string,
    baseURL: string = 'https://your-backend-url.run.app'
  ) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async classifyFood(imageUri: string): Promise<ClassificationResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'food_image.jpg',
    } as any);

    const response = await fetch(`${this.baseURL}/classify`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseURL}/health`);
    return response.json();
  }

  async readinessCheck(): Promise<ReadyResponse> {
    const response = await fetch(`${this.baseURL}/ready`);
    return response.json();
  }
}

// Usage
const fiit = new FIITSDK('your-api-key-here');

// Classify food from image
fiit
  .classifyFood('file://path/to/image.jpg')
  .then(result => {
    console.log('Predictions:', result.predictions);
    console.log('Decision:', result.decision);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### Python SDK

```python
# FIIT SDK for Python
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class FoodPrediction:
    label: str
    confidence: float
    nutrition: Optional[Dict] = None

@dataclass
class ClassificationResponse:
    predictions: List[FoodPrediction]
    decision: str
    processingTime: float
    modelVersion: Optional[str] = None

class FIITSDK:
    def __init__(self, api_key: str, base_url: str = "https://your-backend-url.run.app"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({"X-API-Key": self.api_key})

    def classify_food(self, image_path: str) -> ClassificationResponse:
        """Classify food from an image file."""
        url = f"{self.base_url}/classify"

        with open(image_path, 'rb') as image_file:
            files = {'file': (image_path, image_file, 'image/jpeg')}

            response = self.session.post(url, files=files, timeout=30)
            response.raise_for_status()

            data = response.json()
            predictions = [
                FoodPrediction(
                    label=pred['label'],
                    confidence=pred['confidence'],
                    nutrition=pred.get('nutrition')
                )
                for pred in data['predictions']
            ]

            return ClassificationResponse(
                predictions=predictions,
                decision=data['decision'],
                processingTime=data['processingTime'],
                modelVersion=data.get('modelVersion')
            )

    def health_check(self) -> Dict:
        """Check if the service is healthy."""
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

    def readiness_check(self) -> Dict:
        """Check if the service is ready."""
        response = self.session.get(f"{self.base_url}/ready")
        response.raise_for_status()
        return response.json()

# Usage
fiit = FIITSDK('your-api-key-here')

# Classify food
try:
    result = fiit.classify_food('food_image.jpg')
    print(f"Top prediction: {result.predictions[0].label}")
    print(f"Confidence: {result.predictions[0].confidence}")
    print(f"Decision: {result.decision}")
except Exception as e:
    print(f"Error: {e}")
```

## Best Practices

### 1. Error Handling

- Always check response status codes
- Implement retry logic for transient errors
- Handle rate limiting gracefully
- Log errors for debugging

### 2. Performance

- Compress images before uploading
- Use appropriate timeouts
- Implement request cancellation
- Cache results when possible

### 3. Security

- Never expose API keys in client-side code
- Use HTTPS for all requests
- Validate file types and sizes
- Implement proper authentication

### 4. Monitoring

- Monitor API response times
- Track error rates
- Set up alerts for failures
- Use health check endpoints

---

For more information, refer to the [README.md](README.md) or contact support.
