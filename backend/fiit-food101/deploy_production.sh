#!/bin/bash
# Production deployment script for FIIT Food-101 API

set -e  # Exit on any error

echo "🚀 Deploying FIIT Food-101 API to Production"
echo "=============================================="

# Configuration
PROJECT_ID="fiit-475214"
SERVICE_NAME="fiit-food101"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "Not authenticated with gcloud. Please run 'gcloud auth login' first."
    exit 1
fi

# Set the project
print_status "Setting project to ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

# Build the Docker image
print_status "Building Docker image..."
docker build -t ${IMAGE_NAME} .

# Push the image to Google Container Registry
print_status "Pushing image to GCR..."
docker push ${IMAGE_NAME}

# Deploy to Cloud Run with production settings
print_status "Deploying to Cloud Run with production configuration..."

gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --timeout 900 \
    --concurrency 100 \
    --max-instances 10 \
    --min-instances 1 \
    --port 8080 \
    --set-env-vars "ENVIRONMENT=production,LOG_LEVEL=INFO,ENABLE_METRICS=true" \
    --set-env-vars "API_KEY=${API_KEY:-$(openssl rand -base64 32)}" \
    --set-env-vars "FDC_API_KEY=${FDC_API_KEY}" \
    --set-env-vars "HF_TOKEN=${HF_TOKEN}" \
    --set-env-vars "MAX_FILE_SIZE=10485760" \
    --set-env-vars "RATE_LIMIT_REQUESTS=1000" \
    --set-env-vars "RATE_LIMIT_WINDOW=3600" \
    --set-env-vars "MODEL_CACHE_SIZE=20" \
    --set-env-vars "REQUEST_TIMEOUT=30" \
    --set-env-vars "MAX_CONCURRENT_REQUESTS=10" \
    --set-env-vars "HEALTH_CHECK_INTERVAL=30" \
    --set-env-vars "HEALTH_CHECK_TIMEOUT=5"

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

print_status "Deployment completed successfully!"
print_status "Service URL: ${SERVICE_URL}"

# Run health check
print_status "Running health check..."
sleep 10  # Wait for service to be ready

if curl -f -s "${SERVICE_URL}/health" > /dev/null; then
    print_status "✅ Health check passed!"
else
    print_warning "⚠️  Health check failed. Service might still be starting up."
fi

# Display useful information
echo ""
echo "📊 Production Deployment Summary"
echo "================================"
echo "Service Name: ${SERVICE_NAME}"
echo "Region: ${REGION}"
echo "URL: ${SERVICE_URL}"
echo "Memory: 4Gi"
echo "CPU: 2"
echo "Max Instances: 10"
echo "Min Instances: 1"
echo ""
echo "🔧 Useful Commands:"
echo "View logs: gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}' --limit=50"
echo "Update service: gcloud run services update ${SERVICE_NAME} --region=${REGION}"
echo "Delete service: gcloud run services delete ${SERVICE_NAME} --region=${REGION}"
echo ""
echo "📈 Monitoring:"
echo "Metrics: ${SERVICE_URL}/metrics"
echo "Status: ${SERVICE_URL}/status"
echo "Health: ${SERVICE_URL}/health"
echo ""
print_status "🎉 Production deployment completed!"
