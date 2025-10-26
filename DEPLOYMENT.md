# FIIT Production Deployment Guide

This guide covers deploying FIIT to production environments for both mobile and backend services.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Backend Deployment](#backend-deployment)
4. [Mobile App Deployment](#mobile-app-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Security Checklist](#security-checklist)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts & Services

- **Google Cloud Platform** account with billing enabled
- **Apple Developer** account ($99/year)
- **Google Play Console** account ($25 one-time)
- **RevenueCat** account (free tier available)
- **Sentry** account (free tier available)
- **USDA FoodData Central** API key (free)

### Required Tools

- **Google Cloud SDK** (`gcloud`)
- **EAS CLI** (`npm install -g eas-cli`)
- **Docker** (for backend deployment)
- **Node.js 18+** and **npm 9+**
- **Python 3.11+**

## Environment Setup

### 1. Clone and Setup Repository

```bash
git clone https://github.com/your-username/fiit.git
cd fiit
npm install
```

### 2. Environment Variables

Create production environment files:

**`.env.production`** (root directory):

```env
# Frontend (Expo) Public Variables
EXPO_PUBLIC_API_URL="https://your-backend-url.run.app"
EXPO_PUBLIC_NUTRITIONIX_APP_ID="your_nutritionix_app_id"
EXPO_PUBLIC_NUTRITIONIX_API_KEY="your_nutritionix_api_key"
EXPO_PUBLIC_CALORIEMAMA_API_KEY="your_caloriemama_api_key"
EXPO_PUBLIC_FIIT_API_KEY="your_secure_api_key"
EXPO_PUBLIC_SENTRY_DSN="your_sentry_dsn"
EXPO_PUBLIC_ENVIRONMENT="production"
EXPO_PUBLIC_APP_VERSION="1.0.0"

# RevenueCat API Keys
RC_IOS_API_KEY="your_revenuecat_ios_key"
RC_ANDROID_API_KEY="your_revenuecat_android_key"

# Backend (FastAPI) Private Variables
API_KEY="your_secure_api_key" # Must match EXPO_PUBLIC_FIIT_API_KEY
FDC_API_KEY="your_usda_fdc_api_key"
HF_TOKEN="your_huggingface_token"
SENTRY_DSN="your_backend_sentry_dsn"
ENVIRONMENT="production"
APP_VERSION="1.0.0"
LOG_LEVEL="INFO"
MAX_FILE_SIZE="10485760"
RATE_LIMIT_REQUESTS="1000"
RATE_LIMIT_WINDOW="3600"
RATE_LIMIT_BURST="10"
ALLOWED_ORIGINS="https://your-frontend-domain.com"
```

### 3. Service Account Setup

**Google Cloud Service Account:**

```bash
# Create service account
gcloud iam service-accounts create fiit-backend \
    --description="FIIT Backend Service Account" \
    --display-name="FIIT Backend"

# Grant necessary permissions
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:fiit-backend@your-project-id.iam.gserviceaccount.com" \
    --role="roles/run.admin"

# Create and download key
gcloud iam service-accounts keys create fiit-backend-key.json \
    --iam-account=fiit-backend@your-project-id.iam.gserviceaccount.com
```

## Backend Deployment

### 1. Google Cloud Run Setup

```bash
# Set project
gcloud config set project your-project-id

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Set default region
gcloud config set run/region us-central1
```

### 2. Deploy Backend

```bash
cd backend/fiit-food101

# Build and deploy
gcloud run deploy fiit-backend \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 10 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars="API_KEY=your_secure_api_key,FDC_API_KEY=your_usda_fdc_api_key,HF_TOKEN=your_huggingface_token,SENTRY_DSN=your_backend_sentry_dsn,ENVIRONMENT=production,APP_VERSION=1.0.0,LOG_LEVEL=INFO,MAX_FILE_SIZE=10485760,RATE_LIMIT_REQUESTS=1000,RATE_LIMIT_WINDOW=3600,RATE_LIMIT_BURST=10,ALLOWED_ORIGINS=https://your-frontend-domain.com"
```

### 3. Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-url.run.app/health

# Test readiness endpoint
curl https://your-backend-url.run.app/ready

# Test API key authentication
curl -H "X-API-Key: your_secure_api_key" \
     https://your-backend-url.run.app/classify \
     -F "file=@test_image.jpg"
```

## Mobile App Deployment

### 1. EAS Setup

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Update eas.json with production settings
```

**`eas.json`** (production profile):

```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-url.run.app",
        "EXPO_PUBLIC_ENVIRONMENT": "production",
        "EXPO_PUBLIC_APP_VERSION": "1.0.0"
      },
      "ios": {
        "buildConfiguration": "Release",
        "bundleIdentifier": "com.yourcompany.fiit"
      },
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

### 2. Build Production Apps

```bash
# Build iOS
eas build --platform ios --profile production

# Build Android
eas build --platform android --profile production

# Build both platforms
eas build --platform all --profile production
```

### 3. Submit to App Stores

```bash
# Submit iOS to App Store
eas submit --platform ios --profile production

# Submit Android to Google Play
eas submit --platform android --profile production
```

## Monitoring & Maintenance

### 1. Sentry Setup

**Mobile App:**

- Create project in Sentry
- Get DSN and add to environment variables
- Configure release tracking

**Backend:**

- Create separate project in Sentry
- Configure error tracking and performance monitoring
- Set up alerts for critical errors

### 2. Google Cloud Monitoring

```bash
# Enable monitoring APIs
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Set up log-based metrics
gcloud logging metrics create fiit_error_rate \
    --description="FIIT Error Rate" \
    --log-filter="resource.type=cloud_run_revision AND severity>=ERROR"

# Create alerting policy
gcloud alpha monitoring policies create \
    --policy-from-file=monitoring/alert-policy.yaml
```

### 3. Health Checks

**Backend Health Endpoints:**

- `/health` - Basic health check
- `/ready` - Readiness check with dependencies
- `/metrics` - Prometheus metrics

**Monitoring Script:**

```bash
#!/bin/bash
# health-check.sh

BACKEND_URL="https://your-backend-url.run.app"
API_KEY="your_secure_api_key"

# Health check
curl -f "$BACKEND_URL/health" || exit 1

# Readiness check
curl -f "$BACKEND_URL/ready" || exit 1

# API functionality test
curl -f -H "X-API-Key: $API_KEY" \
     "$BACKEND_URL/classify" \
     -F "file=@test_image.jpg" || exit 1

echo "All health checks passed"
```

## Security Checklist

### ✅ Backend Security

- [ ] API key authentication enabled
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation with Pydantic
- [ ] Non-root Docker user
- [ ] Security headers implemented
- [ ] Error sanitization enabled
- [ ] HTTPS only
- [ ] Environment variables secured

### ✅ Mobile Security

- [ ] Secure storage for tokens
- [ ] API keys in environment variables
- [ ] Certificate pinning (optional)
- [ ] Code obfuscation enabled
- [ ] Root/jailbreak detection
- [ ] Secure communication with backend

### ✅ Infrastructure Security

- [ ] Service account with minimal permissions
- [ ] Network security groups configured
- [ ] Logging and monitoring enabled
- [ ] Backup and disaster recovery plan
- [ ] Regular security updates
- [ ] Vulnerability scanning

## Troubleshooting

### Common Issues

**1. Backend Deployment Fails**

```bash
# Check logs
gcloud run services logs read fiit-backend --region us-central1

# Check service status
gcloud run services describe fiit-backend --region us-central1
```

**2. Mobile Build Fails**

```bash
# Check build logs
eas build:list
eas build:view [build-id]

# Clear cache and retry
eas build --clear-cache --platform ios --profile production
```

**3. API Authentication Issues**

```bash
# Verify API key
curl -H "X-API-Key: your_api_key" \
     https://your-backend-url.run.app/health

# Check CORS configuration
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-API-Key" \
     -X OPTIONS \
     https://your-backend-url.run.app/classify
```

**4. Performance Issues**

```bash
# Check Cloud Run metrics
gcloud run services describe fiit-backend --region us-central1

# Monitor memory usage
gcloud logging read "resource.type=cloud_run_revision" \
    --limit=50 --format="table(timestamp,jsonPayload.message)"
```

### Support Resources

- **Google Cloud Run Documentation**: https://cloud.google.com/run/docs
- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **RevenueCat Documentation**: https://docs.revenuecat.com/
- **Sentry Documentation**: https://docs.sentry.io/

### Emergency Procedures

**1. Rollback Backend**

```bash
# List revisions
gcloud run revisions list --service fiit-backend --region us-central1

# Rollback to previous revision
gcloud run services update-traffic fiit-backend \
    --to-revisions=fiit-backend-00001-abc=100 \
    --region us-central1
```

**2. Rollback Mobile App**

```bash
# Submit previous version to app stores
eas submit --platform ios --profile production --latest
```

**3. Emergency Maintenance**

```bash
# Scale down to 0 instances
gcloud run services update fiit-backend \
    --min-instances 0 \
    --max-instances 0 \
    --region us-central1

# Scale back up
gcloud run services update fiit-backend \
    --min-instances 1 \
    --max-instances 10 \
    --region us-central1
```

---

## Post-Deployment Checklist

### ✅ Immediate (Day 1)

- [ ] All health checks passing
- [ ] Error rates within acceptable limits
- [ ] Performance metrics normal
- [ ] User authentication working
- [ ] Photo upload functionality working
- [ ] Payment processing working

### ✅ Short-term (Week 1)

- [ ] Monitor error rates and performance
- [ ] User feedback collection
- [ ] Analytics data flowing
- [ ] Backup procedures tested
- [ ] Security scan completed

### ✅ Long-term (Month 1)

- [ ] Performance optimization
- [ ] User retention analysis
- [ ] Cost optimization review
- [ ] Security audit completed
- [ ] Disaster recovery tested

---

For additional support or questions, please refer to the [README.md](README.md) or create an issue on GitHub.

