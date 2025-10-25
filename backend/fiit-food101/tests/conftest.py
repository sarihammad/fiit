"""
Pytest configuration and fixtures for FIIT Food-101 tests
"""
import pytest
import os
import sys
from unittest.mock import patch, MagicMock

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

@pytest.fixture(scope="session")
def test_environment():
    """Set up test environment variables"""
    test_env = {
        "API_KEY": "test-api-key",
        "FDC_API_KEY": "test-fdc-key",
        "HF_TOKEN": "test-hf-token",
        "ENVIRONMENT": "test",
        "LOG_LEVEL": "DEBUG",
        "ENABLE_METRICS": "true",
        "MAX_FILE_SIZE": "1048576",  # 1MB for testing
        "RATE_LIMIT_REQUESTS": "100",
        "RATE_LIMIT_WINDOW": "60"
    }
    
    with patch.dict(os.environ, test_env):
        yield test_env

@pytest.fixture
def mock_model():
    """Mock the ML model for testing"""
    with patch('app.model') as mock_model:
        mock_model.eval.return_value = None
        mock_model.return_value.logits = MagicMock()
        mock_model.return_value.logits[0] = MagicMock()
        mock_model.return_value.logits[0].tolist.return_value = [0.1, 0.2, 0.7]
        mock_model.config.id2label = {0: "apple", 1: "banana", 2: "chicken_wings"}
        yield mock_model

@pytest.fixture
def mock_processor():
    """Mock the image processor for testing"""
    with patch('app.processor') as mock_processor:
        mock_processor.return_value = {"pixel_values": MagicMock()}
        yield mock_processor

@pytest.fixture
def sample_image():
    """Create a sample image for testing"""
    from PIL import Image
    import io
    
    # Create a simple test image
    img = Image.new('RGB', (224, 224), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes

@pytest.fixture
def mock_fdc_response():
    """Mock FDC API response"""
    return {
        "fdcId": 12345,
        "description": "Chicken wings, fried",
        "foodNutrients": [
            {"nutrient": {"name": "Energy"}, "amount": 200},
            {"nutrient": {"name": "Protein"}, "amount": 20},
            {"nutrient": {"name": "Carbohydrate, by difference"}, "amount": 5},
            {"nutrient": {"name": "Total lipid (fat)"}, "amount": 12}
        ]
    }

@pytest.fixture
def mock_nutrition_data():
    """Mock nutrition data"""
    return {
        "calories": 200,
        "protein": 20.0,
        "carbs": 5.0,
        "fat": 12.0,
        "fiber": 0.0
    }

@pytest.fixture(autouse=True)
def reset_global_state():
    """Reset global state between tests"""
    # Clear any global caches or state
    from caching import cache_manager
    cache_manager.clear_all()
    
    # Reset metrics
    from monitoring import metrics
    metrics._counters.clear()
    metrics._histograms.clear()
    metrics._gauges.clear()
    
    yield
    
    # Cleanup after test
    cache_manager.clear_all()
    metrics._counters.clear()
    metrics._histograms.clear()
    metrics._gauges.clear()

# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    # Add custom markers
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")

def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Add markers based on test file names
        if "test_api" in item.nodeid:
            item.add_marker(pytest.mark.integration)
        elif "test_monitoring" in item.nodeid or "test_caching" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        
        # Mark slow tests
        if "thread_safety" in item.nodeid or "performance" in item.nodeid:
            item.add_marker(pytest.mark.slow)
