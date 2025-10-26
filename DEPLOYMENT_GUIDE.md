# FIIT Food Recognition Deployment Guide

## Overview

This guide covers deploying the new Food-101 ViT classifier microservice and configuring the Expo app to use it.

## Backend Deployment (Cloud Run)

### 1. Prerequisites

- Google Cloud Project with billing enabled
- `gcloud` CLI installed and authenticated
- Docker installed locally

### 2. Security Setup

**Generate a secure API key:**

```bash
# Generate a secure API key
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Important Security Considerations:**

- The API now requires authentication via API key
- Rate limiting is enabled (100 requests/hour per IP by default)
- File upload size is limited (10MB by default)
- CORS is configured for specific origins only
- All inputs are validated and sanitized

### 2. Deploy the Microservice

```bash
# Navigate to backend directory
cd backend/fiit-food101

# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fiit-food101:v1
gcloud run deploy fiit-food101 \
  --image gcr.io/YOUR_PROJECT_ID/fiit-food101:v1 \
  --region us-central1 --platform managed \
  --allow-unauthenticated --cpu 1 --memory 1Gi \
  --max-instances 1 \
  --set-env-vars MODEL_ID=eslamxm/vit-base-food101,T_HIGH=0.70,T_MID=0.50,T_LOW=0.35,FDC_API_KEY=YOUR_FDC_KEY,HF_TOKEN=YOUR_HF_TOKEN,API_KEY=YOUR_GENERATED_API_KEY,ALLOWED_ORIGINS=https://yourdomain.com,ENVIRONMENT=production,RATE_LIMIT_REQUESTS=100,MAX_FILE_SIZE=10485760

# Note the service URL from the output
# Example: https://fiit-food101-XXXXX-uc.a.run.app
```

### 3. FDC Mapping Setup (Optional)

```bash
# Get your free FDC API key from https://fdc.nal.usda.gov/api-guide.html
export FDC_API_KEY=your_fdc_api_key_here

# Seed FDC IDs for better nutrition lookup
python seed_fdc_ids.py

# This generates food101_to_fdc_ids.csv with resolved FDC IDs
```

### 4. Update Environment Variables

Add these to your `app.json` or environment configuration:

```json
{
  "extra": {
    "EXPO_PUBLIC_FIIT_FOOD_API_BASE": "https://fiit-food101-505393897095.us-central1.run.app",
    "EXPO_PUBLIC_FIIT_API_KEY": "your_generated_api_key_here",
    "EXPO_PUBLIC_PREDICT_T_HIGH": "0.70",
    "EXPO_PUBLIC_PREDICT_T_MID": "0.50",
    "EXPO_PUBLIC_PREDICT_T_LOW": "0.35"
  }
}
```

**Important:** Make sure to use the same API key that you set in the backend deployment.

**Your Cloud Run service is now live at:**
`https://fiit-food101-505393897095.us-central1.run.app`

You can test it with:

```bash
curl https://fiit-food101-505393897095.us-central1.run.app/health
```

## Frontend Configuration

### 1. Environment Variables

The app automatically reads these environment variables:

- `EXPO_PUBLIC_FIIT_FOOD_API_BASE` - Your Cloud Run service URL
- `EXPO_PUBLIC_PREDICT_T_HIGH` - High confidence threshold (default: 0.70)
- `EXPO_PUBLIC_PREDICT_T_MID` - Medium confidence threshold (default: 0.50)
- `EXPO_PUBLIC_PREDICT_T_LOW` - Low confidence threshold (default: 0.35)

### 2. Testing the Integration

```bash
# Start the Expo development server
npx expo start

# Test on device or simulator
# 1. Navigate to Log tab
# 2. Take a photo of food
# 3. Verify the new flow works:
#    - High confidence (>70%): Auto-accept
#    - Medium confidence (50-70%): Show 3 options
#    - Low confidence (<50%): Fallback to manual entry
```

## Cost Optimization

### Cloud Run Free Tier

- **$0 cost** for low volume traffic
- **Scale-to-zero** when not in use
- **Cold starts** ~10-15 seconds (first request)
- **Warm requests** ~1-2 seconds

### Monitoring

```bash
# Check service health
curl https://your-service-url/health

# View logs
gcloud logs read --service=fiit-food101 --limit=50

# Monitor usage
gcloud monitoring dashboards list
```

## Troubleshooting

### Common Issues

1. **Cold Start Timeout**
   - First request may take 10-15 seconds
   - Consider keeping one instance warm for production

2. **Model Loading Errors**
   - Check Cloud Run logs for HuggingFace model download issues
   - Ensure sufficient memory (1Gi minimum)

3. **FDC API Rate Limits**
   - Free tier: 1000 requests/day
   - Implement caching for production use

4. **Photo Analysis Failures**
   - Check network connectivity
   - Verify Cloud Run service is accessible
   - Review error logs in analytics

### Debug Mode

Enable debug logging by setting:

```json
{
  "extra": {
    "EXPO_PUBLIC_DEBUG_FOOD_RECOGNITION": "true"
  }
}
```

## Performance Metrics

### Expected Performance

- **Cold Start**: 10-15 seconds
- **Warm Request**: 1-2 seconds
- **Photo Processing**: 0.5-1 second
- **Total UX**: <3 seconds (warm) or <18 seconds (cold)

### Analytics Events

The app tracks these events for monitoring:

- `food_recognition_request` - Photo analysis started
- `food_recognition_result` - API response received
- `food_recognition_confirmed` - User accepted prediction
- `food_recognition_fallback` - Fallback to manual entry

## Production Checklist

- [ ] Cloud Run service deployed and accessible
- [ ] Environment variables configured in app.json
- [ ] FDC API key configured (optional)
- [ ] Analytics events tracking correctly
- [ ] Error handling working (network failures, timeouts)
- [ ] Performance acceptable (cold start < 20s)
- [ ] Cost monitoring enabled
- [ ] Backup manual entry flow tested

## Rollback Plan

If issues arise, you can quickly rollback by:

1. **Revert app.json** environment variables to remove the new API base URL
2. **The app will automatically fallback** to the legacy photo analysis (if configured)
3. **Or show manual entry** if no legacy APIs are configured

The new code is designed to gracefully degrade when the Cloud Run service is unavailable.
