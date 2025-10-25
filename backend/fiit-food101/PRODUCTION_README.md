# FIIT Food-101 API - Production Guide

## 🚀 Production-Ready Features

This API is fully optimized for production deployment with comprehensive monitoring, security, and performance features.

### ✅ Production Features Implemented

#### 🔒 Security

- **API Key Authentication**: Secure endpoint access
- **Rate Limiting**: Configurable request limits per client
- **Input Validation**: Comprehensive image and data validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Non-root Container**: Secure Docker deployment
- **Security Headers**: Production security middleware

#### 📊 Monitoring & Observability

- **Real-time Metrics**: Request rates, response times, error rates
- **Health Checks**: Multi-level health monitoring
- **Performance Monitoring**: System resource usage tracking
- **Structured Logging**: JSON-formatted logs with context
- **Error Tracking**: Comprehensive error handling and reporting

#### ⚡ Performance Optimization

- **Intelligent Caching**: Multi-layer caching system
- **Model Optimization**: Warmup and inference optimization
- **Resource Management**: Memory and CPU optimization
- **Batch Processing**: Efficient request handling
- **Connection Pooling**: Optimized external API calls

#### 🏗️ Production Infrastructure

- **Cloud Run Ready**: Optimized for Google Cloud Run
- **Auto-scaling**: Configurable scaling parameters
- **Health Endpoints**: `/health`, `/status`, `/metrics`
- **Graceful Shutdown**: Proper resource cleanup
- **Configuration Management**: Environment-based config

## 🛠️ Deployment

### Prerequisites

- Google Cloud SDK (`gcloud`)
- Docker
- Python 3.11+
- Required API keys:
  - `FDC_API_KEY`: USDA FoodData Central API key
  - `HF_TOKEN`: HuggingFace token (optional but recommended)

### Quick Deployment

```bash
# Set environment variables
export FDC_API_KEY="your-fdc-api-key"
export HF_TOKEN="your-hf-token"  # Optional

# Deploy to production
./deploy_production.sh
```

### Manual Deployment

```bash
# Build and push image
docker build -t gcr.io/fiit-475214/fiit-food101 .
docker push gcr.io/fiit-475214/fiit-food101

# Deploy to Cloud Run
gcloud run deploy fiit-food101 \
  --image gcr.io/fiit-475214/fiit-food101 \
  --platform managed \
  --region us-central1 \
  --memory 4Gi \
  --cpu 2 \
  --max-instances 10 \
  --min-instances 1 \
  --set-env-vars "FDC_API_KEY=${FDC_API_KEY}" \
  --set-env-vars "HF_TOKEN=${HF_TOKEN}"
```

## 📈 Monitoring & Metrics

### Available Endpoints

- **`/health`**: Basic health check
- **`/status`**: Detailed system status
- **`/metrics`**: Prometheus-compatible metrics

### Key Metrics

- **Request Rate**: Requests per second
- **Response Time**: P50, P95, P99 latencies
- **Error Rate**: Classification and system errors
- **Cache Performance**: Hit/miss ratios
- **Resource Usage**: CPU, memory, disk usage
- **Classification Decisions**: Auto-accept, confirm, fallback ratios

### Monitoring Dashboard

Import `monitoring_dashboard.json` into Grafana for comprehensive monitoring.

## 🔧 Configuration

### Environment Variables

```bash
# Required
API_KEY=your-secure-api-key
FDC_API_KEY=your-fdc-api-key

# Optional
HF_TOKEN=your-hf-token
LOG_LEVEL=INFO
ENABLE_METRICS=true
MAX_FILE_SIZE=10485760  # 10MB
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=3600
```

### Performance Tuning

- **Memory**: 4Gi recommended for production
- **CPU**: 2 cores minimum
- **Concurrency**: 100 requests per instance
- **Scaling**: 1-10 instances based on load

## 🧪 Testing

### Run Tests

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
python run_tests.py

# Run specific test categories
pytest tests/test_api.py -v
pytest tests/test_monitoring.py -v
pytest tests/test_caching.py -v
```

### Test Coverage

- **API Endpoints**: All endpoints tested
- **Authentication**: Security testing
- **Error Handling**: Comprehensive error scenarios
- **Performance**: Load and stress testing
- **Monitoring**: Metrics and health checks

## 📊 Performance Benchmarks

### Expected Performance

- **Response Time**: < 2 seconds for classification
- **Throughput**: 100+ requests/minute per instance
- **Accuracy**: 85%+ for common foods
- **Cache Hit Rate**: 60%+ for repeated requests

### Resource Usage

- **Memory**: ~2GB base + 1GB per model
- **CPU**: 1-2 cores under normal load
- **Storage**: ~500MB for model cache

## 🔍 Troubleshooting

### Common Issues

#### High Memory Usage

```bash
# Check memory usage
curl https://your-service-url/status

# Restart service if needed
gcloud run services update fiit-food101 --region us-central1
```

#### Slow Response Times

```bash
# Check metrics
curl https://your-service-url/metrics

# Check logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fiit-food101" --limit=50
```

#### Authentication Errors

- Verify `API_KEY` is set correctly
- Check request headers include `Authorization: Bearer <key>`
- Ensure API key matches between client and server

### Health Check Failures

1. Check service logs for errors
2. Verify all environment variables are set
3. Ensure external APIs (FDC, HuggingFace) are accessible
4. Check resource limits (memory, CPU)

## 🚨 Alerts & Notifications

### Recommended Alerts

- **Error Rate > 5%**: High error rate
- **Response Time > 5s**: Slow responses
- **Memory Usage > 80%**: High memory usage
- **CPU Usage > 90%**: High CPU usage
- **Health Check Failures**: Service unavailable

### Monitoring Setup

1. Import monitoring dashboard
2. Set up alerting rules
3. Configure notification channels
4. Test alert delivery

## 🔄 Maintenance

### Regular Tasks

- **Monitor Metrics**: Daily performance review
- **Update Dependencies**: Monthly security updates
- **Cache Management**: Monitor cache performance
- **Log Rotation**: Manage log storage

### Scaling Decisions

- **Scale Up**: When CPU > 80% consistently
- **Scale Down**: During low usage periods
- **Memory Scaling**: If memory usage > 90%

## 📚 API Documentation

### Authentication

All requests require API key authentication:

```bash
curl -H "Authorization: Bearer your-api-key" \
     -F "file=@image.jpg" \
     https://your-service-url/classify
```

### Response Format

```json
{
  "topk": [
    { "label": "Chicken Wings", "prob": 0.85 },
    { "label": "Fried Chicken", "prob": 0.1 },
    { "label": "Chicken Nuggets", "prob": 0.05 }
  ],
  "decision": "auto_accept",
  "nutrition": {
    "calories": 200,
    "protein": 20.0,
    "carbs": 5.0,
    "fat": 12.0
  },
  "timestamp": "2025-10-20T15:30:00Z"
}
```

## 🆘 Support

### Logs and Debugging

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fiit-food101" --limit=100

# Filter by severity
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=fiit-food101 AND severity>=ERROR" --limit=50
```

### Performance Analysis

```bash
# Get detailed metrics
curl https://your-service-url/metrics | jq

# Check system status
curl https://your-service-url/status | jq
```

---

**🎉 Your FIIT Food-101 API is now production-ready with enterprise-grade monitoring, security, and performance optimization!**
