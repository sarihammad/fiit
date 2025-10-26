# FIIT Testing Guide

This guide covers testing strategies, setup, and best practices for the FIIT application.

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Frontend Testing](#frontend-testing)
3. [Backend Testing](#backend-testing)
4. [E2E Testing](#e2e-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)
7. [CI/CD Integration](#cicd-integration)
8. [Test Data Management](#test-data-management)

## Testing Strategy

### Testing Pyramid

```
    /\
   /  \
  / E2E \     (10%) - End-to-end user journeys
 /______\
/        \
/  Integration \  (20%) - API integration, component integration
/______________\
/                \
/   Unit Tests    \  (70%) - Individual functions, components, services
/__________________\
```

### Coverage Targets

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 60%+ coverage
- **E2E Tests**: Critical user paths (100%)

## Frontend Testing

### 1. Unit Testing with Jest

**Setup:**

```bash
npm install --save-dev jest @types/jest jest-expo
```

**Configuration (`jest.config.js`):**

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.(ts|tsx|js)', '**/*.(test|spec).(ts|tsx|js)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Test Setup (`jest.setup.js`):**

```javascript
import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'fiit://auth'),
  startAsync: jest.fn(),
}));

jest.mock('expo-apple-authentication', () => ({
  isAvailable: true,
  signInAsync: jest.fn(),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  },
}));

jest.mock('react-native-purchases', () => ({
  Purchases: {
    configure: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getCustomerInfo: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      RC_IOS_API_KEY: 'test_ios_key',
      RC_ANDROID_API_KEY: 'test_android_key',
    },
  },
}));
```

### 2. Component Testing

**Example: Button Component Test**

```typescript
// src/components/__tests__/Button.test.tsx
import React from 'react';
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

  it('shows loading state', () => {
    const { getByTestId } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### 3. Service Testing

**Example: Auth Service Test**

```typescript
// src/services/__tests__/auth.test.ts
import { AuthService } from '../auth';
import * as SecureStore from 'expo-secure-store';
import { http } from '../http';

jest.mock('expo-secure-store');
jest.mock('../http');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    expect(http.post).toHaveBeenCalledWith('/auth/signin', {
      email: 'test@example.com',
      password: 'password',
    });
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'auth_token',
      'token'
    );
    expect(result?.success).toBe(true);
  });

  it('should handle sign in error', async () => {
    (http.post as jest.Mock).mockRejectedValue(
      new Error('Invalid credentials')
    );

    const result = await AuthService.signInWithEmail(
      'test@example.com',
      'password'
    );

    expect(result?.success).toBe(false);
    expect(result?.error).toBe('Invalid credentials');
  });
});
```

### 4. Store Testing

**Example: Auth Store Test**

```typescript
// src/state/__tests__/auth.store.test.ts
import { useAuthStore } from '../auth.store';
import { AuthService } from '@/services/auth';

jest.mock('@/services/auth');

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('should sign in successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    (AuthService.signInWithEmail as jest.Mock).mockResolvedValue({
      success: true,
      user: mockUser,
    });

    await useAuthStore
      .getState()
      .signInWithEmail('test@example.com', 'password');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockUser);
  });
});
```

## Backend Testing

### 1. Unit Testing with pytest

**Setup:**

```bash
cd backend/fiit-food101
pip install -r requirements-test.txt
```

**Configuration (`pytest.ini`):**

```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --cov=.
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
    -v
```

**Test Structure:**

```
backend/fiit-food101/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_api.py
│   ├── test_production_config.py
│   ├── test_monitoring.py
│   └── test_caching.py
```

### 2. API Testing

**Example: API Endpoint Test**

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestClassifyEndpoint:
    def test_classify_with_valid_image(self, sample_image):
        """Test food classification with valid image"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("test.jpg", sample_image, "image/jpeg")}
        )

        assert response.status_code == 200
        data = response.json()
        assert "predictions" in data
        assert len(data["predictions"]) > 0
        assert "label" in data["predictions"][0]
        assert "confidence" in data["predictions"][0]

    def test_classify_without_api_key(self, sample_image):
        """Test food classification without API key"""
        response = client.post(
            "/classify",
            files={"file": ("test.jpg", sample_image, "image/jpeg")}
        )

        assert response.status_code == 401
        assert "API key required" in response.json()["detail"]

    def test_classify_with_invalid_image(self):
        """Test food classification with invalid image"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("test.txt", b"not an image", "text/plain")}
        )

        assert response.status_code == 400
        assert "Invalid image format" in response.json()["detail"]

    def test_classify_with_large_image(self, large_image):
        """Test food classification with oversized image"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("large.jpg", large_image, "image/jpeg")}
        )

        assert response.status_code == 413
        assert "File too large" in response.json()["detail"]
```

### 3. Configuration Testing

**Example: Production Config Test**

```python
# tests/test_production_config.py
import pytest
from unittest.mock import patch
from production_config import ProductionConfig

class TestProductionConfig:
    def test_default_values(self):
        """Test default configuration values"""
        with patch.dict('os.environ', {}, clear=True):
            config = ProductionConfig()
            assert config.ENVIRONMENT == "development"
            assert config.LOG_LEVEL == "INFO"
            assert config.MAX_FILE_SIZE == 10485760

    def test_environment_override(self):
        """Test environment variable override"""
        with patch.dict('os.environ', {
            'ENVIRONMENT': 'production',
            'LOG_LEVEL': 'ERROR',
            'MAX_FILE_SIZE': '20971520'
        }, clear=True):
            config = ProductionConfig()
            assert config.ENVIRONMENT == "production"
            assert config.LOG_LEVEL == "ERROR"
            assert config.MAX_FILE_SIZE == 20971520

    def test_required_variables(self):
        """Test required environment variables"""
        with patch.dict('os.environ', {}, clear=True):
            config = ProductionConfig()
            assert config.API_KEY is None
            assert config.FDC_API_KEY is None
            assert config.HF_TOKEN is None
```

### 4. Monitoring Testing

**Example: Monitoring Test**

```python
# tests/test_monitoring.py
import pytest
from unittest.mock import Mock, patch
from monitoring import MetricsCollector, RateLimiter

class TestMetricsCollector:
    def test_increment_counter(self):
        """Test counter increment"""
        collector = MetricsCollector()
        collector.increment_counter("test_counter", {"label": "value"})

        # Verify counter was incremented
        assert collector.get_counter_value("test_counter", {"label": "value"}) == 1

    def test_record_histogram(self):
        """Test histogram recording"""
        collector = MetricsCollector()
        collector.record_histogram("test_histogram", 1.5, {"label": "value"})

        # Verify histogram was recorded
        assert collector.get_histogram_value("test_histogram", {"label": "value"}) == 1.5

class TestRateLimiter:
    def test_rate_limit_allows_requests(self):
        """Test rate limiter allows requests within limit"""
        limiter = RateLimiter(requests=10, window=60)

        for i in range(10):
            assert limiter.is_allowed("test_key") is True

    def test_rate_limit_blocks_requests(self):
        """Test rate limiter blocks requests over limit"""
        limiter = RateLimiter(requests=5, window=60)

        # Allow 5 requests
        for i in range(5):
            assert limiter.is_allowed("test_key") is True

        # Block 6th request
        assert limiter.is_allowed("test_key") is False
```

## E2E Testing

### 1. Detox Setup (iOS/Android)

**Installation:**

```bash
npm install --save-dev detox
```

**Configuration (`.detoxrc.js`):**

```javascript
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  configurations: {
    'ios.sim.debug': {
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/FIIT.app',
      build:
        'xcodebuild -workspace ios/FIIT.xcworkspace -scheme FIIT -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      type: 'ios.simulator',
      device: {
        type: 'iPhone 14',
      },
    },
    'android.emu.debug': {
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_4_API_30',
      },
    },
  },
};
```

**E2E Test Example:**

```typescript
// e2e/firstTest.e2e.ts
describe('FIIT App', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show welcome screen', async () => {
    await expect(element(by.id('welcome-screen'))).toBeVisible();
  });

  it('should navigate to sign in', async () => {
    await element(by.id('sign-in-button')).tap();
    await expect(element(by.id('sign-in-screen'))).toBeVisible();
  });

  it('should sign in with email', async () => {
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('sign-in-submit')).tap();

    await expect(element(by.id('home-screen'))).toBeVisible();
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

### 2. Maestro Setup (Alternative)

**Installation:**

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

**Maestro Flow Example:**

```yaml
# e2e/sign-in-flow.yaml
appId: com.yourcompany.fiit
---
- launchApp
- assertVisible: 'Welcome to FIIT'
- tapOn: 'Sign In'
- assertVisible: 'Sign In'
- inputText: 'test@example.com'
- tapOn: 'Email'
- inputText: 'password123'
- tapOn: 'Password'
- tapOn: 'Sign In'
- assertVisible: 'Home'
```

## Performance Testing

### 1. Frontend Performance

**React Native Performance Testing:**

```typescript
// src/utils/__tests__/performance.test.ts
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  it('should render home screen within 100ms', async () => {
    const start = performance.now();

    // Render home screen
    const { getByTestId } = render(<HomeScreen />);
    await waitFor(() => getByTestId('home-screen'));

    const end = performance.now();
    const renderTime = end - start;

    expect(renderTime).toBeLessThan(100);
  });

  it('should handle large meal list efficiently', async () => {
    const largeMealList = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Meal ${i}`,
      calories: 500,
    }));

    const start = performance.now();
    const { getByTestId } = render(<MealList meals={largeMealList} />);
    await waitFor(() => getByTestId('meal-list'));
    const end = performance.now();

    expect(end - start).toBeLessThan(200);
  });
});
```

### 2. Backend Performance

**Load Testing with Locust:**

```python
# tests/load_test.py
from locust import HttpUser, task, between

class FIITUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login and get API key"""
        response = self.client.post("/auth/signin", json={
            "email": "test@example.com",
            "password": "password123"
        })
        self.api_key = response.json()["tokens"]["accessToken"]

    @task(3)
    def classify_food(self):
        """Test food classification endpoint"""
        with open("test_image.jpg", "rb") as f:
            self.client.post(
                "/classify",
                headers={"X-API-Key": self.api_key},
                files={"file": ("test.jpg", f, "image/jpeg")}
            )

    @task(1)
    def get_health(self):
        """Test health endpoint"""
        self.client.get("/health")

    @task(1)
    def get_metrics(self):
        """Test metrics endpoint"""
        self.client.get("/metrics")
```

**Run Load Test:**

```bash
locust -f tests/load_test.py --host=https://your-backend-url.run.app
```

## Security Testing

### 1. API Security Testing

**Security Test Suite:**

```python
# tests/test_security.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestSecurity:
    def test_api_key_required(self):
        """Test that API key is required for protected endpoints"""
        response = client.post("/classify", files={"file": ("test.jpg", b"", "image/jpeg")})
        assert response.status_code == 401

    def test_invalid_api_key_rejected(self):
        """Test that invalid API key is rejected"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "invalid-key"},
            files={"file": ("test.jpg", b"", "image/jpeg")}
        )
        assert response.status_code == 401

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        # Make requests up to the limit
        for i in range(10):
            response = client.post(
                "/classify",
                headers={"X-API-Key": "test-api-key"},
                files={"file": ("test.jpg", b"", "image/jpeg")}
            )
            if i < 10:
                assert response.status_code in [200, 400]  # Valid requests
            else:
                assert response.status_code == 429  # Rate limited

    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.options("/classify")
        assert "Access-Control-Allow-Origin" in response.headers
        assert "Access-Control-Allow-Methods" in response.headers

    def test_security_headers(self):
        """Test security headers are present"""
        response = client.get("/health")
        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
```

### 2. Input Validation Testing

**Input Validation Tests:**

```python
# tests/test_validation.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

class TestInputValidation:
    def test_file_size_limit(self):
        """Test file size limit enforcement"""
        large_file = b"x" * (11 * 1024 * 1024)  # 11MB
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("large.jpg", large_file, "image/jpeg")}
        )
        assert response.status_code == 413

    def test_file_type_validation(self):
        """Test file type validation"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("malicious.exe", b"malicious content", "application/x-executable")}
        )
        assert response.status_code == 400

    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        response = client.post(
            "/classify",
            headers={"X-API-Key": "test-api-key"},
            files={"file": ("'; DROP TABLE users; --.jpg", b"", "image/jpeg")}
        )
        # Should not crash the application
        assert response.status_code in [200, 400]
```

## CI/CD Integration

### 1. GitHub Actions

**Frontend CI:**

```yaml
# .github/workflows/mobile-ci.yml
name: Mobile CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run linter
        run: npm run lint

      - name: Run type checker
        run: npm run typecheck

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

**Backend CI:**

```yaml
# .github/workflows/backend-ci.yml
name: Backend CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend/fiit-food101
          pip install -r requirements.txt
          pip install -r requirements-test.txt

      - name: Run tests
        run: |
          cd backend/fiit-food101
          pytest --cov=./ --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/fiit-food101/coverage.xml
```

### 2. Test Scripts

**Package.json Scripts:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "detox test",
    "test:e2e:build": "detox build",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

## Test Data Management

### 1. Test Fixtures

**Frontend Fixtures:**

```typescript
// src/__fixtures__/testData.ts
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

export const mockMeal = {
  id: '1',
  name: 'Chicken Breast',
  calories: 200,
  protein: 30,
  carbs: 0,
  fat: 5,
  timestamp: '2023-01-01T12:00:00Z',
};

export const mockNutritionData = {
  totalCalories: 2000,
  totalProtein: 150,
  totalCarbs: 200,
  totalFat: 70,
  targetCalories: 2200,
  targetProtein: 160,
  targetCarbs: 250,
  targetFat: 75,
};
```

**Backend Fixtures:**

```python
# tests/fixtures.py
import pytest
from PIL import Image
import io

@pytest.fixture
def sample_image():
    """Create a sample test image"""
    img = Image.new('RGB', (224, 224), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

@pytest.fixture
def large_image():
    """Create a large test image"""
    img = Image.new('RGB', (4000, 4000), color='blue')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

@pytest.fixture
def mock_fdc_response():
    """Mock FDC API response"""
    return {
        "foods": [
            {
                "fdcId": 12345,
                "description": "Chicken, breast, raw",
                "foodNutrients": [
                    {"nutrient": {"name": "Energy"}, "amount": 165},
                    {"nutrient": {"name": "Protein"}, "amount": 31},
                    {"nutrient": {"name": "Carbohydrate, by difference"}, "amount": 0},
                    {"nutrient": {"name": "Total lipid (fat)"}, "amount": 3.6},
                ]
            }
        ]
    }
```

### 2. Test Database

**Test Database Setup:**

```python
# tests/conftest.py
import pytest
import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db

@pytest.fixture(scope="session")
def test_db():
    """Create test database"""
    db_fd, db_path = tempfile.mkstemp()
    engine = create_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        try:
            db = TestingSessionLocal()
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield TestingSessionLocal

    os.close(db_fd)
    os.unlink(db_path)
```

## Running Tests

### Frontend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should render"
```

### Backend Tests

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=.

# Run specific test file
pytest tests/test_api.py

# Run tests matching pattern
pytest -k "test_classify"

# Run tests with verbose output
pytest -v

# Run tests in parallel
pytest -n auto
```

### E2E Tests

```bash
# Build and run E2E tests
npm run test:e2e:build
npm run test:e2e

# Run iOS E2E tests
npm run test:e2e:ios

# Run Android E2E tests
npm run test:e2e:android
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests independent and isolated

### 2. Mocking Strategy

- Mock external dependencies
- Use realistic test data
- Avoid over-mocking
- Test error scenarios

### 3. Coverage Goals

- Aim for 80%+ code coverage
- Focus on critical paths
- Don't sacrifice quality for coverage
- Review uncovered code regularly

### 4. Performance Testing

- Test with realistic data sizes
- Monitor memory usage
- Test on different devices
- Set performance budgets

### 5. Security Testing

- Test authentication and authorization
- Validate input sanitization
- Test rate limiting
- Check for common vulnerabilities

---

For more information, refer to the [README.md](README.md) or create an issue on GitHub.

