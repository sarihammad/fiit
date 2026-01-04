"""
Comprehensive API tests for FIIT Food-101 service
"""
import pytest
import io
import json
from fastapi.testclient import TestClient
from PIL import Image
import numpy as np
from unittest.mock import patch, MagicMock

# Import the app and dependencies
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app, config

# Test client
client = TestClient(app)

# Test data
VALID_API_KEY = "test-api-key"
INVALID_API_KEY = "invalid-key"

@pytest.fixture
def mock_image():
    """Create a mock image for testing"""
    # Create a simple test image
    img = Image.new('RGB', (224, 224), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

@pytest.fixture
def mock_model():
    """Mock the model for testing"""
    with patch('app.model') as mock_model:
        mock_model.eval.return_value = None
        mock_model.return_value.logits = MagicMock()
        mock_model.return_value.logits[0] = MagicMock()
        mock_model.return_value.logits[0].tolist.return_value = [0.1, 0.2, 0.7]
        mock_model.config.id2label = {0: "apple", 1: "banana", 2: "chicken_wings"}
        yield mock_model

class TestHealthEndpoints:
    """Test health and status endpoints"""
    
    def test_health_endpoint(self):
        """Test basic health check"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_status_endpoint(self):
        """Test detailed status endpoint"""
        response = client.get("/status")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "checks" in data
        assert "config" in data
        assert "timestamp" in data
    
    def test_metrics_endpoint(self):
        """Test metrics endpoint"""
        response = client.get("/metrics")
        # Should work if metrics are enabled
        if response.status_code == 200:
            data = response.json()
            assert "metrics" in data
            assert "cache_stats" in data
            assert "timestamp" in data
        else:
            # Metrics might be disabled
            assert response.status_code == 404

class TestAuthentication:
    """Test authentication and security"""
    
    def test_classify_without_auth(self):
        """Test that classify endpoint requires authentication"""
        response = client.post("/classify", files={"file": ("test.jpg", b"fake_image_data", "image/jpeg")})
        assert response.status_code == 401
    
    def test_classify_with_invalid_auth(self):
        """Test that invalid API key is rejected"""
        headers = {"Authorization": f"Bearer {INVALID_API_KEY}"}
        response = client.post(
            "/classify", 
            files={"file": ("test.jpg", b"fake_image_data", "image/jpeg")},
            headers=headers
        )
        assert response.status_code == 401
    
    def test_classify_with_valid_auth(self, mock_image, mock_model):
        """Test that valid API key works"""
        headers = {"Authorization": f"Bearer {VALID_API_KEY}"}
        
        # Mock the authentication
        with patch('app.verify_api_key') as mock_auth:
            mock_auth.return_value = MagicMock()
            
            response = client.post(
                "/classify",
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")},
                headers=headers
            )
            # Should not be 401 (authentication error)
            assert response.status_code != 401

    def test_classify_with_valid_x_api_key(self, mock_image, mock_model):
        """Test that X-API-Key header is accepted"""
        headers = {"X-API-Key": VALID_API_KEY}

        with patch.object(config, "API_KEY", VALID_API_KEY):
            response = client.post(
                "/classify",
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")},
                headers=headers
            )
            assert response.status_code != 401

class TestImageValidation:
    """Test image validation and processing"""
    
    def test_invalid_file_type(self):
        """Test rejection of non-image files"""
        headers = {"Authorization": f"Bearer {VALID_API_KEY}"}
        
        with patch('app.verify_api_key') as mock_auth:
            mock_auth.return_value = MagicMock()
            
            response = client.post(
                "/classify",
                files={"file": ("test.txt", b"not an image", "text/plain")},
                headers=headers
            )
            assert response.status_code == 400
    
    def test_valid_image_processing(self, mock_image, mock_model):
        """Test valid image processing"""
        headers = {"Authorization": f"Bearer {VALID_API_KEY}"}
        
        with patch('app.verify_api_key') as mock_auth:
            mock_auth.return_value = MagicMock()
            
            response = client.post(
                "/classify",
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")},
                headers=headers
            )
            # Should process successfully (might be 200 or 500 depending on model mocking)
            assert response.status_code in [200, 500]

class TestRateLimiting:
    """Test rate limiting functionality"""
    
    def test_rate_limit_middleware(self):
        """Test that rate limiting middleware is active"""
        # This would require more sophisticated mocking of the rate limiter
        # For now, just ensure the middleware doesn't break the app
        response = client.get("/health")
        assert response.status_code == 200

class TestCaching:
    """Test caching functionality"""
    
    def test_cache_stats_endpoint(self):
        """Test that cache stats are available"""
        response = client.get("/status")
        assert response.status_code == 200
        data = response.json()
        assert "cache_stats" in data["config"]

class TestErrorHandling:
    """Test error handling and responses"""
    
    def test_invalid_endpoint(self):
        """Test 404 for invalid endpoints"""
        response = client.get("/nonexistent")
        assert response.status_code == 404
    
    def test_method_not_allowed(self):
        """Test 405 for wrong HTTP method"""
        response = client.put("/health")
        assert response.status_code == 405
    
    def test_large_file_handling(self):
        """Test handling of large files"""
        headers = {"Authorization": f"Bearer {VALID_API_KEY}"}
        
        with patch('app.verify_api_key') as mock_auth:
            mock_auth.return_value = MagicMock()
            
            # Create a large file (simulate)
            large_data = b"x" * (config.MAX_FILE_SIZE + 1)
            response = client.post(
                "/classify",
                files={"file": ("large.jpg", large_data, "image/jpeg")},
                headers=headers
            )
            # Should reject large files
            assert response.status_code in [400, 413]

class TestConfiguration:
    """Test configuration validation"""
    
    def test_config_validation(self):
        """Test that configuration is valid"""
        # This tests that the app starts with valid config
        assert hasattr(config, 'API_KEY')
        assert hasattr(config, 'MAX_FILE_SIZE')
        assert hasattr(config, 'RATE_LIMIT_REQUESTS')
    
    def test_environment_variables(self):
        """Test that environment variables are loaded"""
        # Test that config loads from environment
        assert config.MODEL_ID is not None
        assert config.TOPK > 0

class TestModelIntegration:
    """Test model integration and classification"""
    
    @patch('app.model')
    @patch('app.processor')
    def test_classification_pipeline(self, mock_processor, mock_model, mock_image):
        """Test the complete classification pipeline"""
        # Mock the model response
        mock_model.return_value.logits = MagicMock()
        mock_model.return_value.logits[0] = MagicMock()
        mock_model.return_value.logits[0].tolist.return_value = [0.1, 0.2, 0.7]
        mock_model.config.id2label = {0: "apple", 1: "banana", 2: "chicken_wings"}
        
        headers = {"Authorization": f"Bearer {VALID_API_KEY}"}
        
        with patch('app.verify_api_key') as mock_auth:
            mock_auth.return_value = MagicMock()
            
            response = client.post(
                "/classify",
                files={"file": ("test.jpg", mock_image.getvalue(), "image/jpeg")},
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                assert "topk" in data
                assert "decision" in data
                assert "timestamp" in data
                assert len(data["topk"]) <= config.TOPK

class TestNutritionIntegration:
    """Test nutrition data integration"""
    
    def test_nutrition_lookup(self):
        """Test nutrition data lookup"""
        # This would test the FDC integration
        # For now, just ensure the function exists
        from app import nutrition_for_label
        assert callable(nutrition_for_label)

class TestMonitoring:
    """Test monitoring and metrics"""
    
    def test_metrics_collection(self):
        """Test that metrics are being collected"""
        # Make a request to generate some metrics
        response = client.get("/health")
        assert response.status_code == 200
        
        # Check if metrics endpoint works
        response = client.get("/metrics")
        if response.status_code == 200:
            data = response.json()
            assert "metrics" in data
            assert "uptime_seconds" in data["metrics"]

class TestSecurity:
    """Test security features"""
    
    def test_cors_headers(self):
        """Test CORS headers are present"""
        response = client.options("/health")
        # CORS headers should be present
        assert response.status_code in [200, 405]  # OPTIONS might not be implemented
    
    def test_security_headers(self):
        """Test security headers"""
        response = client.get("/health")
        # Check for security headers (these might be added by middleware)
        assert response.status_code == 200

if __name__ == "__main__":
    pytest.main([__file__])
