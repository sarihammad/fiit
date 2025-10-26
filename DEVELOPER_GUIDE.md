# FIIT Developer Guide

This guide provides comprehensive information for developers working on the FIIT project.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Setup](#development-setup)
4. [Code Standards](#code-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Deployment Process](#deployment-process)
7. [Contributing](#contributing)
8. [API Development](#api-development)
9. [Mobile Development](#mobile-development)
10. [Backend Development](#backend-development)

## Project Overview

### Technology Stack

**Frontend (Mobile):**

- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Styling**: Tailwind CSS with custom theme
- **Testing**: Jest, React Native Testing Library
- **E2E Testing**: Detox

**Backend:**

- **Framework**: FastAPI (Python 3.11)
- **AI/ML**: HuggingFace Transformers, PyTorch
- **Database**: PostgreSQL
- **Caching**: Redis
- **Monitoring**: Prometheus, Grafana
- **Deployment**: Google Cloud Run
- **Testing**: pytest, httpx

**Infrastructure:**

- **Cloud Provider**: Google Cloud Platform
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry, Google Cloud Monitoring
- **Secrets**: Google Secret Manager

### Project Structure

```
fiit/
├── src/                          # Frontend source code
│   ├── components/               # Reusable UI components
│   ├── screens/                  # Screen components
│   ├── services/                 # API and business logic
│   ├── state/                    # Zustand stores
│   ├── providers/                # Context providers
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── assets/                   # Images, fonts, etc.
├── backend/                      # Backend source code
│   └── fiit-food101/            # FastAPI application
│       ├── app.py               # Main application
│       ├── models/              # ML models
│       ├── services/            # Business logic
│       ├── tests/               # Test files
│       └── requirements.txt     # Python dependencies
├── docs/                        # Documentation
├── .github/                     # GitHub Actions workflows
├── eas.json                     # EAS build configuration
├── package.json                 # Node.js dependencies
└── tsconfig.json               # TypeScript configuration
```

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │   Admin Panel   │
│   (React Native)│    │   (React)       │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (FastAPI)     │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Service    │    │   Auth Service  │    │   Data Service  │
│   (Food Vision) │    │   (OAuth)       │    │   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   External APIs │
                    │   (USDA FDC)    │
                    └─────────────────┘
```

### Data Flow

1. **User takes photo** → Mobile app
2. **Photo uploaded** → API Gateway
3. **AI analysis** → Food Vision Service
4. **Nutrition lookup** → USDA FDC API
5. **Response sent** → Mobile app
6. **Data stored** → PostgreSQL
7. **Analytics tracked** → Monitoring system

### Security Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client        │    │   API Gateway   │    │   Services      │
│   (Mobile/Web)  │    │   (FastAPI)     │    │   (Internal)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ TLS 1.3               │ mTLS                  │ mTLS
         │ API Key Auth          │ JWT Validation        │ Service Auth
         │ Rate Limiting         │ Input Validation      │ Access Control
         │ CORS                  │ Security Headers      │ Audit Logging
```

## Development Setup

### Prerequisites

**Required Software:**

- Node.js 18+ and npm 9+
- Python 3.11+
- Docker and Docker Compose
- Git
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Google Cloud SDK

**Required Accounts:**

- GitHub account
- Google Cloud Platform account
- Expo account
- RevenueCat account
- Sentry account

### Local Development Setup

**1. Clone Repository:**

```bash
git clone https://github.com/your-username/fiit.git
cd fiit
```

**2. Install Dependencies:**

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend/fiit-food101
pip install -r requirements.txt
pip install -r requirements-test.txt
cd ../..
```

**3. Environment Setup:**

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**4. Start Development Servers:**

```bash
# Start backend (in one terminal)
cd backend/fiit-food101
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Start frontend (in another terminal)
npm start
```

**5. Run Tests:**

```bash
# Frontend tests
npm test

# Backend tests
cd backend/fiit-food101
pytest
```

### IDE Setup

**VS Code Extensions:**

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.pylint",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-jest"
  ]
}
```

**VS Code Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black"
}
```

## Code Standards

### TypeScript Standards

**Strict Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Naming Conventions:**

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types**: PascalCase (`UserProfile`)

**Code Style:**

```typescript
// Good
interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

const getUserProfile = async (id: string): Promise<UserProfile> => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};

// Bad
interface userProfile {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

const getUserProfile = async (id: string) => {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
};
```

### Python Standards

**Code Style (Black):**

```python
# Good
def classify_food(image: bytes) -> ClassificationResponse:
    """Classify food from image bytes."""
    try:
        result = model.predict(image)
        return ClassificationResponse(
            predictions=result.predictions,
            decision=result.decision,
            processing_time=result.processing_time,
        )
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")

# Bad
def classify_food(image:bytes)->ClassificationResponse:
    try:
        result=model.predict(image)
        return ClassificationResponse(predictions=result.predictions,decision=result.decision,processing_time=result.processing_time)
    except Exception as e:
        logger.error(f"Classification failed: {e}")
        raise HTTPException(status_code=500, detail="Classification failed")
```

**Type Hints:**

```python
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class ClassificationRequest(BaseModel):
    file: UploadFile
    user_id: Optional[str] = None

def process_classification(
    request: ClassificationRequest,
    model: Any,
) -> ClassificationResponse:
    """Process food classification request."""
    pass
```

### Git Standards

**Commit Message Format:**

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```
feat(auth): add Google Sign-In integration

- Implement OAuth 2.0 flow
- Add secure token storage
- Update user authentication flow

Closes #123
```

**Branch Naming:**

- `feature/feature-name`
- `bugfix/bug-description`
- `hotfix/critical-fix`
- `chore/task-description`

## Testing Guidelines

### Frontend Testing

**Unit Tests:**

```typescript
// Component test
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

**Service Tests:**

```typescript
// Service test
import { AuthService } from '../auth';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('AuthService', () => {
  it('should sign in with email and password', async () => {
    const mockResponse = {
      user: { id: '1', email: 'test@example.com' },
      tokens: { accessToken: 'token', refreshToken: 'refresh' },
    };

    (http.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await AuthService.signInWithEmail(
      'test@example.com',
      'password'
    );

    expect(result?.success).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'token'
    );
  });
});
```

### Backend Testing

**API Tests:**

```python
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_classify_with_valid_image(sample_image):
    """Test food classification with valid image."""
    response = client.post(
        "/classify",
        headers={"X-API-Key": "test-api-key"},
        files={"file": ("test.jpg", sample_image, "image/jpeg")}
    )

    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) > 0
```

**Service Tests:**

```python
def test_food_classification_service():
    """Test food classification service."""
    service = FoodClassificationService()
    result = service.classify("test_image.jpg")

    assert result is not None
    assert len(result.predictions) > 0
    assert result.decision in ["auto_accept", "confirm", "fallback"]
```

### E2E Testing

**Detox Tests:**

```typescript
describe('FIIT App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should log a meal with photo', async () => {
    await element(by.id('log-meal-button')).tap();
    await element(by.id('camera-button')).tap();

    // Mock camera permission
    await device.grantPermissions(['camera']);

    await element(by.id('take-photo-button')).tap();
    await element(by.id('confirm-photo-button')).tap();

    await expect(element(by.id('meal-confirmation'))).toBeVisible();
  });
});
```

## Deployment Process

### Frontend Deployment

**1. Build Configuration:**

```json
// eas.json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-url.run.app",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
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
  }
}
```

**2. Build Process:**

```bash
# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### Backend Deployment

**1. Docker Configuration:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Expose port
EXPOSE 8000

# Start application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**2. Deployment Script:**

```bash
#!/bin/bash
# deploy.sh

# Build and push Docker image
docker build -t gcr.io/$PROJECT_ID/fiit-backend .
docker push gcr.io/$PROJECT_ID/fiit-backend

# Deploy to Cloud Run
gcloud run deploy fiit-backend \
    --image gcr.io/$PROJECT_ID/fiit-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --concurrency 10 \
    --min-instances 0 \
    --max-instances 10
```

## Contributing

### Development Workflow

**1. Create Feature Branch:**

```bash
git checkout -b feature/new-feature
```

**2. Make Changes:**

- Write code following standards
- Add tests for new functionality
- Update documentation
- Ensure all tests pass

**3. Commit Changes:**

```bash
git add .
git commit -m "feat(auth): add Google Sign-In integration"
```

**4. Push and Create PR:**

```bash
git push origin feature/new-feature
# Create pull request on GitHub
```

**5. Code Review:**

- Address review feedback
- Make necessary changes
- Ensure CI passes

**6. Merge:**

- Squash and merge
- Delete feature branch
- Update documentation

### Pull Request Guidelines

**Required Information:**

- Clear description of changes
- Link to related issues
- Screenshots for UI changes
- Test coverage information
- Breaking changes documentation

**Review Checklist:**

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No breaking changes (or documented)
- [ ] Security considerations addressed
- [ ] Performance impact considered

### Code Review Process

**Reviewer Responsibilities:**

- Check code quality and standards
- Verify test coverage
- Ensure security best practices
- Validate performance implications
- Check documentation updates

**Author Responsibilities:**

- Respond to feedback promptly
- Make requested changes
- Explain complex logic
- Update tests as needed
- Keep PR up to date

## API Development

### API Design Principles

**RESTful Design:**

- Use HTTP methods appropriately
- Consistent URL structure
- Proper status codes
- Clear error messages

**Versioning:**

- URL versioning (`/v1/classify`)
- Header versioning (`API-Version: 1.0`)
- Backward compatibility
- Deprecation notices

**Documentation:**

- OpenAPI/Swagger specs
- Interactive documentation
- Code examples
- Error code reference

### API Endpoints

**Food Classification:**

```python
@app.post("/v1/classify")
async def classify_food(
    request: Request,
    file: UploadFile = File(...),
    api_key: str = Header(..., alias="X-API-Key")
) -> ClassificationResponse:
    """Classify food from uploaded image."""
    pass
```

**Health Check:**

```python
@app.get("/health")
async def health_check() -> HealthResponse:
    """Check service health."""
    pass
```

**Metrics:**

```python
@app.get("/metrics")
async def get_metrics() -> str:
    """Get Prometheus metrics."""
    pass
```

### Error Handling

**Custom Exceptions:**

```python
class FIITException(Exception):
    """Base exception for FIIT API."""
    pass

class ValidationError(FIITException):
    """Validation error."""
    pass

class AuthenticationError(FIITException):
    """Authentication error."""
    pass
```

**Error Response Format:**

```python
@app.exception_handler(FIITException)
async def fiit_exception_handler(request: Request, exc: FIITException):
    return JSONResponse(
        status_code=400,
        content={
            "error": exc.__class__.__name__,
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat(),
            "request_id": request.state.request_id
        }
    )
```

## Mobile Development

### React Native Best Practices

**Component Structure:**

```typescript
// Component file structure
interface ComponentProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
}

export const Component: React.FC<ComponentProps> = ({
  title,
  onPress,
  loading = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={loading}
    >
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
});
```

**State Management:**

```typescript
// Zustand store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await AuthService.signInWithEmail(email, password);
          if (result?.success) {
            set({ user: result.user, isAuthenticated: true });
          } else {
            set({ error: result?.error || 'Sign in failed' });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          set({ isLoading: false });
        }
      },

      signOut: async () => {
        await AuthService.signOut();
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### Performance Optimization

**Image Optimization:**

```typescript
import { Image } from 'expo-image';

// Use expo-image for better performance
<Image
  source={{ uri: imageUri }}
  style={styles.image}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

**List Optimization:**

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

**Memory Management:**

```typescript
useEffect(() => {
  const subscription =
    Notifications.addNotificationReceivedListener(handleNotification);

  return () => {
    subscription.remove();
  };
}, []);
```

## Backend Development

### FastAPI Best Practices

**Application Structure:**

```python
# app.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI(
    title="FIIT API",
    description="AI-powered nutrition tracking API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# Dependencies
async def get_api_key(api_key: str = Header(..., alias="X-API-Key")):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return api_key

# Routes
@app.post("/classify")
async def classify_food(
    file: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    pass
```

**Service Layer:**

```python
# services/food_classification.py
class FoodClassificationService:
    def __init__(self):
        self.model = self._load_model()
        self.fdc_client = FDCClient()

    def _load_model(self):
        """Load the food classification model."""
        pass

    async def classify(self, image: bytes) -> ClassificationResponse:
        """Classify food from image bytes."""
        try:
            # Preprocess image
            processed_image = self._preprocess_image(image)

            # Get predictions
            predictions = self.model.predict(processed_image)

            # Get nutrition data
            nutrition_data = await self._get_nutrition_data(predictions[0].label)

            # Determine decision
            decision = self._determine_decision(predictions[0].confidence)

            return ClassificationResponse(
                predictions=predictions,
                decision=decision,
                processing_time=time.time() - start_time,
                model_version="1.0.0"
            )
        except Exception as e:
            logger.error(f"Classification failed: {e}")
            raise ClassificationError("Failed to classify food")

    def _preprocess_image(self, image: bytes) -> torch.Tensor:
        """Preprocess image for model input."""
        pass

    async def _get_nutrition_data(self, label: str) -> Optional[NutritionData]:
        """Get nutrition data for food label."""
        pass

    def _determine_decision(self, confidence: float) -> str:
        """Determine decision based on confidence."""
        if confidence >= 0.8:
            return "auto_accept"
        elif confidence >= 0.5:
            return "confirm"
        else:
            return "fallback"
```

### Database Integration

**SQLAlchemy Models:**

```python
# models/user.py
from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True)
```

**Database Operations:**

```python
# services/user_service.py
from sqlalchemy.orm import Session

class UserService:
    def __init__(self, db: Session):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        user = User(**user_data.dict())
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    async def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()

    async def update_user(self, user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Update user data."""
        user = await self.get_user(user_id)
        if user:
            for field, value in user_data.dict(exclude_unset=True).items():
                setattr(user, field, value)
            self.db.commit()
            self.db.refresh(user)
        return user
```

### Monitoring and Logging

**Structured Logging:**

```python
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def log_api_call(endpoint: str, method: str, status_code: int, duration: float):
    """Log API call details."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "duration": duration,
        "type": "api_call"
    }
    logger.info(json.dumps(log_data))

def log_classification_result(label: str, confidence: float, processing_time: float):
    """Log classification result."""
    log_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "label": label,
        "confidence": confidence,
        "processing_time": processing_time,
        "type": "classification"
    }
    logger.info(json.dumps(log_data))
```

**Metrics Collection:**

```python
from prometheus_client import Counter, Histogram, Gauge

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
CLASSIFICATION_COUNT = Counter('classifications_total', 'Total classifications', ['label', 'decision'])
CLASSIFICATION_DURATION = Histogram('classification_duration_seconds', 'Classification duration')

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()

    REQUEST_DURATION.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response
```

---

## Resources

### Documentation

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [Docker](https://www.docker.com/)
- [GitHub](https://github.com/)

### Communities

- [React Native Community](https://reactnative.dev/community/overview)
- [FastAPI Community](https://github.com/tiangolo/fastapi/discussions)
- [Expo Community](https://forums.expo.dev/)

---

For more information, refer to the [README.md](README.md) or contact the development team.

