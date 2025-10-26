# FIIT Security Guide

This document outlines the security measures, best practices, and guidelines for the FIIT application.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Infrastructure Security](#infrastructure-security)
6. [Mobile Security](#mobile-security)
7. [Backend Security](#backend-security)
8. [Compliance & Privacy](#compliance--privacy)
9. [Security Monitoring](#security-monitoring)
10. [Incident Response](#incident-response)

## Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimum necessary access rights
3. **Zero Trust**: Never trust, always verify
4. **Security by Design**: Security built into every component
5. **Continuous Monitoring**: Real-time threat detection

### Threat Model

**Primary Threats:**

- Unauthorized access to user data
- API abuse and rate limiting bypass
- Data breaches and leaks
- Malicious file uploads
- Man-in-the-middle attacks
- Social engineering attacks

**Secondary Threats:**

- DDoS attacks
- SQL injection
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Session hijacking
- Privilege escalation

## Authentication & Authorization

### API Authentication

**API Key Authentication:**

```http
X-API-Key: your-secure-api-key-here
```

**Key Management:**

- Keys are 32-character random strings
- Stored securely in environment variables
- Rotated regularly (every 90 days)
- Different keys for different environments
- Revoked immediately if compromised

**Key Generation:**

```python
import secrets
import string

def generate_api_key():
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))
```

### User Authentication

**OAuth 2.0 Integration:**

- Google Sign-In
- Apple Sign-In
- Secure token storage with expo-secure-store
- JWT tokens with expiration
- Refresh token rotation

**Guest Mode:**

- Anonymous user creation
- Limited functionality
- Automatic cleanup after 30 days
- No personal data collection

### Authorization Levels

**Free Tier:**

- Basic meal logging
- Limited AI feedback
- Standard photo recognition

**Pro Tier:**

- Advanced meal planning
- Detailed nutrition analysis
- Priority support

**Premium Tier:**

- All Pro features
- Weekly AI check-ins
- Advanced analytics

## Data Protection

### Data Classification

**Public Data:**

- App store listings
- Public API documentation
- Open source code

**Internal Data:**

- System logs
- Performance metrics
- Error reports

**Confidential Data:**

- User profiles
- Meal logs
- Nutrition data
- Payment information

**Restricted Data:**

- API keys
- Database credentials
- Encryption keys

### Encryption

**Data at Rest:**

- Database encryption with AES-256
- File system encryption
- Backup encryption
- Key management with Google Cloud KMS

**Data in Transit:**

- TLS 1.3 for all communications
- Certificate pinning (mobile)
- HSTS headers
- Perfect Forward Secrecy

**Data in Use:**

- Memory encryption for sensitive data
- Secure key storage
- Zero-knowledge architecture where possible

### Data Retention

**User Data:**

- Active users: Indefinite
- Inactive users: 2 years
- Deleted users: 30 days (soft delete)

**System Logs:**

- Application logs: 90 days
- Access logs: 1 year
- Error logs: 6 months
- Audit logs: 7 years

**Backup Data:**

- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months

## API Security

### Input Validation

**File Upload Security:**

```python
def validate_image_file(file: UploadFile) -> bool:
    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(413, "File too large")

    # Check file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "Invalid file type")

    # Check file signature
    if not is_valid_image_signature(file.file):
        raise HTTPException(400, "Invalid image format")

    # Scan for malware
    if contains_malware(file.file):
        raise HTTPException(400, "File contains malware")

    return True
```

**Input Sanitization:**

```python
def sanitize_input(input_string: str) -> str:
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', input_string)

    # Remove SQL injection patterns
    clean = re.sub(r'[\'";]', '', clean)

    # Limit length
    clean = clean[:MAX_INPUT_LENGTH]

    return clean.strip()
```

### Rate Limiting

**Implementation:**

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/classify")
@limiter.limit("1000/hour")
@limiter.limit("10/second")
async def classify_food(request: Request, file: UploadFile):
    # Rate limiting applied automatically
    pass
```

**Rate Limits:**

- 1000 requests per hour per IP
- 10 requests per second burst
- 100 requests per minute per user
- Progressive penalties for violations

### CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["X-API-Key", "Content-Type"],
    max_age=3600,
)
```

### Security Headers

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    return response
```

## Infrastructure Security

### Google Cloud Security

**Service Account:**

```yaml
# Minimal permissions for backend service
permissions:
  - run.services.get
  - run.services.update
  - storage.objects.get
  - logging.logs.write
  - monitoring.metricDescriptors.write
```

**Network Security:**

- VPC with private subnets
- Firewall rules restricting access
- Load balancer with SSL termination
- DDoS protection enabled

**Container Security:**

```dockerfile
# Non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Security scanning
RUN apk add --no-cache --virtual .build-deps \
    && pip install safety \
    && safety check \
    && apk del .build-deps
```

### Database Security

**PostgreSQL Security:**

- Encrypted at rest
- SSL/TLS for connections
- Regular security updates
- Backup encryption
- Access logging

**Connection Security:**

```python
DATABASE_URL = f"postgresql://{user}:{password}@{host}:{port}/{database}?sslmode=require"
```

### Secrets Management

**Environment Variables:**

```bash
# Never commit to version control
API_KEY=your-secure-api-key
DATABASE_PASSWORD=your-secure-password
SENTRY_DSN=your-sentry-dsn
```

**Google Secret Manager:**

```python
from google.cloud import secretmanager

def get_secret(secret_name: str) -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{secret_name}/versions/latest"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
```

## Mobile Security

### Secure Storage

**Expo Secure Store:**

```typescript
import * as SecureStore from 'expo-secure-store';

// Store sensitive data
await SecureStore.setItemAsync('auth_token', token, {
  requireAuthentication: true,
  authenticationPrompt: 'Authenticate to access your data',
});

// Retrieve sensitive data
const token = await SecureStore.getItemAsync('auth_token', {
  requireAuthentication: true,
});
```

### Certificate Pinning

```typescript
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://your-backend-url.run.app/classify', {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
  },
  body: formData,
  sslPinning: {
    certs: ['your-certificate-hash'],
  },
});
```

### Code Obfuscation

**Metro Configuration:**

```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_fnames: true,
      mangle: {
        keep_fnames: true,
      },
    },
  },
};
```

### Root/Jailbreak Detection

```typescript
import { isJailBroken, isRooted } from 'react-native-device-info';

const checkDeviceSecurity = async () => {
  const isJailbroken = await isJailBroken();
  const isRootedDevice = await isRooted();

  if (isJailbroken || isRootedDevice) {
    // Show security warning or restrict functionality
    console.warn('Device is compromised');
  }
};
```

## Backend Security

### Input Validation

**Pydantic Models:**

```python
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class ClassificationRequest(BaseModel):
    file: UploadFile = Field(..., description="Image file to classify")

    @validator('file')
    def validate_file(cls, v):
        if v.size > MAX_FILE_SIZE:
            raise ValueError('File too large')
        if v.content_type not in ALLOWED_TYPES:
            raise ValueError('Invalid file type')
        return v
```

### SQL Injection Prevention

**Parameterized Queries:**

```python
# Good - Parameterized query
cursor.execute(
    "SELECT * FROM users WHERE id = %s AND email = %s",
    (user_id, email)
)

# Bad - String concatenation
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

### XSS Prevention

**Output Encoding:**

```python
import html

def safe_output(user_input: str) -> str:
    return html.escape(user_input)
```

### CSRF Protection

```python
from fastapi_csrf_protect import CsrfProtect

@app.post("/classify")
async def classify_food(
    request: Request,
    csrf_protect: CsrfProtect = Depends(),
    file: UploadFile = File(...)
):
    csrf_protect.validate_csrf(request)
    # Process request
```

## Compliance & Privacy

### GDPR Compliance

**Data Subject Rights:**

- Right to access
- Right to rectification
- Right to erasure
- Right to portability
- Right to object

**Implementation:**

```python
@app.get("/user/data")
async def get_user_data(user_id: str):
    # Return all user data
    pass

@app.delete("/user/data")
async def delete_user_data(user_id: str):
    # Anonymize or delete user data
    pass

@app.get("/user/data/export")
async def export_user_data(user_id: str):
    # Export user data in portable format
    pass
```

### CCPA Compliance

**Privacy Rights:**

- Right to know
- Right to delete
- Right to opt-out
- Right to non-discrimination

### HIPAA Considerations

**Health Data Protection:**

- Encryption in transit and at rest
- Access controls and audit logs
- Business associate agreements
- Incident response procedures

## Security Monitoring

### Logging

**Security Event Logging:**

```python
import logging
import json
from datetime import datetime

security_logger = logging.getLogger('security')

def log_security_event(event_type: str, details: dict):
    event = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'details': details,
        'user_id': details.get('user_id'),
        'ip_address': details.get('ip_address'),
        'user_agent': details.get('user_agent'),
    }

    security_logger.info(json.dumps(event))
```

**Event Types:**

- Authentication failures
- Authorization violations
- Rate limit violations
- File upload attempts
- API key usage
- Data access patterns

### Intrusion Detection

**Anomaly Detection:**

```python
def detect_anomalies(user_id: str, request_data: dict):
    # Check for unusual patterns
    if request_data['requests_per_hour'] > 1000:
        log_security_event('rate_limit_violation', {
            'user_id': user_id,
            'requests_per_hour': request_data['requests_per_hour']
        })

    if request_data['file_size'] > MAX_FILE_SIZE:
        log_security_event('oversized_file_upload', {
            'user_id': user_id,
            'file_size': request_data['file_size']
        })
```

### Security Metrics

**Key Metrics:**

- Failed authentication attempts
- Rate limit violations
- File upload rejections
- API key usage patterns
- Error rates by endpoint
- Response time anomalies

**Alerting:**

```python
def check_security_metrics():
    # Check for security anomalies
    if failed_auth_attempts > 100:
        send_alert('High number of failed authentication attempts')

    if rate_limit_violations > 50:
        send_alert('High number of rate limit violations')

    if error_rate > 0.05:
        send_alert('High error rate detected')
```

## Incident Response

### Incident Classification

**Severity Levels:**

- **Critical**: Data breach, system compromise
- **High**: Service disruption, security vulnerability
- **Medium**: Performance issues, minor security events
- **Low**: Informational events, maintenance

### Response Procedures

**1. Detection & Analysis:**

```python
def incident_detection():
    # Monitor for security events
    events = get_security_events()

    for event in events:
        if event.severity >= 'HIGH':
            create_incident(event)
            notify_security_team(event)
```

**2. Containment:**

```python
def contain_incident(incident_id: str):
    # Isolate affected systems
    if incident.type == 'data_breach':
        revoke_compromised_tokens()
        block_suspicious_ips()

    if incident.type == 'ddos':
        enable_ddos_protection()
        scale_up_resources()
```

**3. Eradication:**

```python
def eradicate_threat(incident_id: str):
    # Remove threat
    if incident.type == 'malware':
        scan_and_clean_systems()
        update_security_signatures()

    if incident.type == 'vulnerability':
        apply_security_patches()
        update_dependencies()
```

**4. Recovery:**

```python
def recover_systems(incident_id: str):
    # Restore normal operations
    if incident.type == 'service_outage':
        restore_from_backup()
        verify_system_integrity()

    if incident.type == 'data_corruption':
        restore_data_from_backup()
        validate_data_integrity()
```

### Communication Plan

**Internal Communication:**

- Security team notification
- Management escalation
- Developer team coordination
- Customer support preparation

**External Communication:**

- Customer notifications
- Regulatory reporting
- Public disclosure (if required)
- Media response

### Post-Incident Review

**Review Process:**

1. Timeline reconstruction
2. Root cause analysis
3. Impact assessment
4. Lessons learned
5. Process improvements
6. Documentation updates

## Security Checklist

### Pre-Deployment

- [ ] Security code review completed
- [ ] Vulnerability scanning passed
- [ ] Penetration testing completed
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Error handling secure
- [ ] Logging configured
- [ ] Monitoring enabled
- [ ] Backup procedures tested

### Post-Deployment

- [ ] Security monitoring active
- [ ] Incident response plan tested
- [ ] Regular security updates scheduled
- [ ] Access controls reviewed
- [ ] Audit logs monitored
- [ ] Performance metrics tracked
- [ ] Error rates monitored
- [ ] User feedback collected
- [ ] Security training completed
- [ ] Compliance requirements met

### Ongoing Maintenance

- [ ] Monthly security reviews
- [ ] Quarterly penetration testing
- [ ] Annual security audits
- [ ] Regular dependency updates
- [ ] Security training updates
- [ ] Incident response drills
- [ ] Backup restoration tests
- [ ] Disaster recovery tests
- [ ] Compliance assessments
- [ ] Threat intelligence updates

---

## Security Contacts

**Security Team:**

- Email: security@fiit.com
- Phone: +1-555-SECURITY
- Emergency: +1-555-EMERGENCY

**Incident Reporting:**

- Email: incidents@fiit.com
- Slack: #security-incidents
- PagerDuty: security-oncall

---

For more information, refer to the [README.md](README.md) or contact the security team.

