# Security Documentation

## Overview

This document outlines the security measures implemented in the fiit-food101 API to protect against common vulnerabilities and ensure secure operation.

## Security Features

### 1. Authentication & Authorization

- **API Key Authentication**: All endpoints require a valid API key
- **Bearer Token**: Uses HTTP Bearer token authentication
- **Secure Key Generation**: API keys are generated using cryptographically secure methods

### 2. Input Validation & Sanitization

- **File Upload Validation**:
  - Maximum file size limit (10MB default)
  - Content type validation (images only)
  - Image dimension limits (4096x4096 max)
  - File content validation
- **Input Sanitization**: All user inputs are validated and sanitized
- **Length Limits**: Maximum lengths for labels and queries

### 3. Rate Limiting

- **Per-IP Rate Limiting**: 100 requests per hour per IP (configurable)
- **Sliding Window**: Rate limiting uses a sliding time window
- **HTTP 429 Response**: Proper rate limit exceeded responses

### 4. CORS Security

- **Specific Origins**: Only allows specific origins (not wildcard in production)
- **Limited Methods**: Only allows GET and POST methods
- **Header Restrictions**: Limits allowed headers

### 5. Security Headers

- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filtering
- **Strict-Transport-Security**: Enforces HTTPS
- **Content-Security-Policy**: Restricts resource loading

### 6. Container Security

- **Non-root User**: Runs as non-root user in container
- **Multi-stage Build**: Minimal attack surface
- **Minimal Dependencies**: Only essential runtime dependencies
- **Health Checks**: Container health monitoring

### 7. External API Security

- **Timeout Protection**: All external API calls have timeouts
- **Error Handling**: Secure error handling without information leakage
- **Input Validation**: All external API inputs are validated

### 8. Logging & Monitoring

- **Structured Logging**: Comprehensive logging for security events
- **Error Tracking**: Secure error logging without sensitive data exposure
- **Request Tracking**: Logs all classification requests

## Environment Variables

### Required Security Variables

```bash
# API Authentication
API_KEY=your_secure_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://yourdomain2.com

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# File Upload Limits
MAX_FILE_SIZE=10485760

# Environment
ENVIRONMENT=production
```

### Optional Security Variables

```bash
# Logging
LOG_LEVEL=INFO

# External API Timeouts
FDC_API_TIMEOUT=5
HF_API_TIMEOUT=10
```

## Deployment Security Checklist

### Before Deployment

- [ ] Set secure API_KEY environment variable
- [ ] Configure ALLOWED_ORIGINS for your domains
- [ ] Set ENVIRONMENT=production
- [ ] Review and adjust rate limiting settings
- [ ] Ensure HTTPS is enabled
- [ ] Verify file size limits are appropriate

### Container Security

- [ ] Use multi-stage build (already implemented)
- [ ] Run as non-root user (already implemented)
- [ ] Use minimal base image (already implemented)
- [ ] Scan container for vulnerabilities
- [ ] Keep dependencies updated

### Network Security

- [ ] Use HTTPS in production
- [ ] Configure proper firewall rules
- [ ] Use VPC/private networks where possible
- [ ] Implement proper load balancing
- [ ] Use CDN for static assets

## Vulnerability Prevention

### Common Vulnerabilities Addressed

1. **SQL Injection**: Not applicable (no database)
2. **XSS**: Prevented by proper input validation and CSP headers
3. **CSRF**: Prevented by CORS configuration and API key authentication
4. **File Upload Attacks**: Prevented by file validation and size limits
5. **DoS Attacks**: Mitigated by rate limiting and file size limits
6. **Information Disclosure**: Prevented by secure error handling
7. **Insecure Direct Object References**: Not applicable
8. **Security Misconfiguration**: Addressed by secure defaults and documentation

### Regular Security Tasks

1. **Dependency Updates**: Regularly update all dependencies
2. **Security Scanning**: Run security scans on container images
3. **Log Monitoring**: Monitor logs for suspicious activity
4. **Rate Limit Monitoring**: Monitor rate limit triggers
5. **API Key Rotation**: Rotate API keys periodically

## Incident Response

### Security Incident Response Plan

1. **Detection**: Monitor logs and alerts for suspicious activity
2. **Assessment**: Evaluate the severity and scope of the incident
3. **Containment**: Isolate affected systems if necessary
4. **Investigation**: Analyze logs and system state
5. **Recovery**: Restore normal operations
6. **Post-incident**: Document lessons learned and improve security

### Contact Information

- Security Team: [Your security contact]
- Incident Response: [Your incident response contact]

## Compliance

This API is designed to meet common security standards:

- OWASP Top 10 compliance
- Container security best practices
- API security best practices
- Data protection requirements

## Updates

This security documentation should be reviewed and updated regularly as new security measures are implemented or vulnerabilities are discovered.
