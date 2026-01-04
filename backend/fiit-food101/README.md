# FIIT Food-101 Classifier (Cloud Run)

## Local Development

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export MODEL_ID=eslamxm/vit-base-food101
export T_HIGH=0.70 T_MID=0.50 T_LOW=0.35
export FDC_API_KEY=your_fdc_api_key_here
uvicorn app:app --reload --port 8080
```

## Cloud Run Deployment

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/fiit-food101:v1 backend/fiit-food101
gcloud run deploy fiit-food101 \
  --image gcr.io/PROJECT_ID/fiit-food101:v1 \
  --region us-central1 --platform managed \
  --allow-unauthenticated --cpu 1 --memory 1Gi \
  --max-instances 1 \
  --set-env-vars MODEL_ID=eslamxm/vit-base-food101,T_HIGH=0.70,T_MID=0.50,T_LOW=0.35,FDC_API_KEY=YOUR_FDC_KEY
```

## FDC Mapping Setup

1. Get your free FDC API key from https://fdc.nal.usda.gov/api-guide.html
2. Run the seeding script to resolve FDC IDs:

```bash
export FDC_API_KEY=your_fdc_api_key_here
python seed_fdc_ids.py
```

This generates `food101_to_fdc_ids.csv` with resolved FDC IDs for better nutrition lookup.

## API Endpoints

- `POST /classify` - Upload image for food classification
- `POST /ai/analyze` - Proxy AI requests to provider APIs
- `GET /health` - Health check endpoint

## Environment Variables

- `MODEL_ID` - HuggingFace model ID (default: eslamxm/vit-base-food101)
- `T_HIGH` - High confidence threshold for auto-accept (default: 0.70)
- `T_MID` - Medium confidence threshold for confirmation (default: 0.50)
- `T_LOW` - Low confidence threshold (default: 0.35)
- `FDC_API_KEY` - USDA FoodData Central API key
- `OPENAI_API_KEY` - OpenAI API key for AI proxy
- `ANTHROPIC_API_KEY` - Anthropic API key for AI proxy
- `FDC_MAP_PATH` - Path to FDC mapping CSV (default: food101_to_fdc_ids.csv)

## Cost Optimization

- Cloud Run free tier provides $0 cost at low volume
- CPU-only model for cost efficiency
- Scale-to-zero when not in use
- Cached FDC lookups to minimize API calls

## Notes

- Model loads on first request (cold start ~10-15s)
- Subsequent requests are fast (~1-2s)
- Free FDC API has rate limits (1000 requests/day)
