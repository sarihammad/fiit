"""
Tests for production configuration
"""
import pytest
import os
from unittest.mock import patch

# Import the production config
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from production_config import ProductionConfig

class TestProductionConfig:
    """Test production configuration validation"""
    
    def test_config_creation(self):
        """Test that config can be created"""
        config = ProductionConfig()
        assert config is not None
        assert hasattr(config, 'API_KEY')
        assert hasattr(config, 'MAX_FILE_SIZE')
        assert hasattr(config, 'RATE_LIMIT_REQUESTS')
    
    def test_config_validation_with_valid_config(self):
        """Test config validation with valid settings"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'HF_TOKEN': 'test-hf-token'
        }):
            config = ProductionConfig()
            validation = config.validate()
            assert validation['valid'] is True
            assert len(validation['issues']) == 0
    
    def test_config_validation_missing_api_key(self):
        """Test config validation with missing API key"""
        with patch.dict(os.environ, {
            'FDC_API_KEY': 'test-fdc-key',
            'HF_TOKEN': 'test-hf-token'
        }, clear=True):
            config = ProductionConfig()
            validation = config.validate()
            assert validation['valid'] is False
            assert 'API_KEY is required' in validation['issues']
    
    def test_config_validation_missing_fdc_key(self):
        """Test config validation with missing FDC key"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'HF_TOKEN': 'test-hf-token'
        }, clear=True):
            config = ProductionConfig()
            validation = config.validate()
            assert validation['valid'] is False
            assert 'FDC_API_KEY is required' in validation['issues']
    
    def test_config_validation_large_file_size(self):
        """Test config validation with too large file size"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'MAX_FILE_SIZE': '104857600'  # 100MB
        }, clear=True):
            config = ProductionConfig()
            validation = config.validate()
            assert validation['valid'] is False
            assert 'MAX_FILE_SIZE is too large' in validation['issues']
    
    def test_config_validation_high_rate_limit(self):
        """Test config validation with very high rate limit"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'RATE_LIMIT_REQUESTS': '50000'  # Very high
        }, clear=True):
            config = ProductionConfig()
            validation = config.validate()
            assert validation['valid'] is False
            assert 'RATE_LIMIT_REQUESTS is very high' in validation['issues']
    
    def test_config_defaults(self):
        """Test that config has reasonable defaults"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key'
        }, clear=True):
            config = ProductionConfig()
            
            # Test defaults
            assert config.MAX_FILE_SIZE == 10485760  # 10MB
            assert config.RATE_LIMIT_REQUESTS == 1000
            assert config.RATE_LIMIT_WINDOW == 3600
            assert config.TOPK == 3
            assert config.MODEL_ID == "eslamxm/vit-base-food101"
    
    def test_confidence_thresholds(self):
        """Test confidence threshold configuration"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'T_HIGH': '0.8',
            'T_MID': '0.6',
            'T_LOW': '0.4'
        }, clear=True):
            config = ProductionConfig()
            
            assert config.CONFIDENCE_THRESHOLDS['high'] == 0.8
            assert config.CONFIDENCE_THRESHOLDS['mid'] == 0.6
            assert config.CONFIDENCE_THRESHOLDS['low'] == 0.4
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'ALLOWED_ORIGINS': 'https://example.com,https://app.example.com'
        }, clear=True):
            config = ProductionConfig()
            
            assert 'https://example.com' in config.CORS_ORIGINS
            assert 'https://app.example.com' in config.CORS_ORIGINS
    
    def test_environment_detection(self):
        """Test environment-specific settings"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'ENVIRONMENT': 'production'
        }, clear=True):
            config = ProductionConfig()
            
            # In production, docs should be disabled
            # This would be tested in the FastAPI app creation
            assert config.LOG_LEVEL == "INFO"  # Default
    
    def test_performance_settings(self):
        """Test performance-related settings"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'MODEL_CACHE_SIZE': '20',
            'REQUEST_TIMEOUT': '60',
            'MAX_CONCURRENT_REQUESTS': '20'
        }, clear=True):
            config = ProductionConfig()
            
            assert config.MODEL_CACHE_SIZE == 20
            assert config.REQUEST_TIMEOUT == 60
            assert config.MAX_CONCURRENT_REQUESTS == 20
    
    def test_monitoring_settings(self):
        """Test monitoring configuration"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'ENABLE_METRICS': 'false',
            'LOG_LEVEL': 'DEBUG'
        }, clear=True):
            config = ProductionConfig()
            
            assert config.ENABLE_METRICS is False
            assert config.LOG_LEVEL == "DEBUG"
    
    def test_health_check_settings(self):
        """Test health check configuration"""
        with patch.dict(os.environ, {
            'API_KEY': 'test-key',
            'FDC_API_KEY': 'test-fdc-key',
            'HEALTH_CHECK_INTERVAL': '60',
            'HEALTH_CHECK_TIMEOUT': '10'
        }, clear=True):
            config = ProductionConfig()
            
            assert config.HEALTH_CHECK_INTERVAL == 60
            assert config.HEALTH_CHECK_TIMEOUT == 10

if __name__ == "__main__":
    pytest.main([__file__])
