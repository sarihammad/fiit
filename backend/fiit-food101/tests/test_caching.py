"""
Tests for caching functionality
"""
import pytest
import time
import threading
from unittest.mock import patch, MagicMock

# Import caching modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from caching import LRUCache, CacheManager, cache_manager

class TestLRUCache:
    """Test LRU cache functionality"""
    
    def test_cache_creation(self):
        """Test cache can be created"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        assert cache.max_size == 10
        assert cache.ttl_seconds == 60
        assert cache.size() == 0
    
    def test_basic_set_get(self):
        """Test basic set and get operations"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        assert cache.size() == 1
    
    def test_get_nonexistent_key(self):
        """Test getting non-existent key"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        assert cache.get("nonexistent") is None
    
    def test_lru_eviction(self):
        """Test LRU eviction when cache is full"""
        cache = LRUCache(max_size=3, ttl_seconds=60)
        
        # Fill cache
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.set("key3", "value3")
        
        # Access key1 to make it recently used
        cache.get("key1")
        
        # Add new key - should evict key2 (least recently used)
        cache.set("key4", "value4")
        
        assert cache.get("key1") == "value1"  # Should still be there
        assert cache.get("key2") is None  # Should be evicted
        assert cache.get("key3") == "value3"  # Should still be there
        assert cache.get("key4") == "value4"  # Should be there
    
    def test_ttl_expiration(self):
        """Test TTL expiration"""
        cache = LRUCache(max_size=10, ttl_seconds=1)  # 1 second TTL
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        # Wait for expiration
        time.sleep(1.1)
        assert cache.get("key1") is None
    
    def test_delete_key(self):
        """Test deleting keys"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        
        cache.set("key1", "value1")
        assert cache.get("key1") == "value1"
        
        assert cache.delete("key1") is True
        assert cache.get("key1") is None
        assert cache.delete("key1") is False  # Already deleted
    
    def test_clear_cache(self):
        """Test clearing cache"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        assert cache.size() == 2
        
        cache.clear()
        assert cache.size() == 0
        assert cache.get("key1") is None
        assert cache.get("key2") is None
    
    def test_cache_stats(self):
        """Test cache statistics"""
        cache = LRUCache(max_size=10, ttl_seconds=60)
        
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        
        stats = cache.stats()
        assert stats["size"] == 2
        assert stats["max_size"] == 10
        assert stats["ttl_seconds"] == 60
        assert stats["expired_entries"] == 0
    
    def test_expired_entries_cleanup(self):
        """Test cleanup of expired entries"""
        cache = LRUCache(max_size=10, ttl_seconds=1)
        
        cache.set("key1", "value1")
        time.sleep(1.1)  # Let it expire
        
        # Adding new key should trigger cleanup
        cache.set("key2", "value2")
        
        assert cache.get("key1") is None  # Should be cleaned up
        assert cache.get("key2") == "value2"  # Should be there
    
    def test_thread_safety(self):
        """Test that cache is thread-safe"""
        cache = LRUCache(max_size=100, ttl_seconds=60)
        
        def add_values():
            for i in range(50):
                cache.set(f"key_{i}", f"value_{i}")
        
        # Create multiple threads
        threads = []
        for _ in range(2):
            thread = threading.Thread(target=add_values)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Should have some values (might be less than 100 due to eviction)
        assert cache.size() > 0
        assert cache.size() <= 100

class TestCacheManager:
    """Test cache manager functionality"""
    
    def test_cache_manager_creation(self):
        """Test cache manager can be created"""
        manager = CacheManager()
        assert manager is not None
        assert hasattr(manager, '_model_cache')
        assert hasattr(manager, '_fdc_cache')
        assert hasattr(manager, '_classification_cache')
        assert hasattr(manager, '_nutrition_cache')
    
    def test_model_prediction_caching(self):
        """Test model prediction caching"""
        manager = CacheManager()
        
        # Test setting and getting model prediction
        prediction = {"label": "chicken_wings", "confidence": 0.95}
        manager.set_model_prediction("hash123", prediction)
        
        retrieved = manager.get_model_prediction("hash123")
        assert retrieved == prediction
        
        # Test non-existent hash
        assert manager.get_model_prediction("nonexistent") is None
    
    def test_fdc_nutrition_caching(self):
        """Test FDC nutrition caching"""
        manager = CacheManager()
        
        nutrition = {"calories": 200, "protein": 20, "carbs": 5}
        manager.set_fdc_nutrition("fdc123", nutrition)
        
        retrieved = manager.get_fdc_nutrition("fdc123")
        assert retrieved == nutrition
        
        # Test non-existent FDC ID
        assert manager.get_fdc_nutrition("nonexistent") is None
    
    def test_classification_result_caching(self):
        """Test classification result caching"""
        manager = CacheManager()
        
        result = {"topk": [{"label": "pizza", "prob": 0.9}], "decision": "auto_accept"}
        model_params = {"topk": 3, "threshold": 0.7}
        
        manager.set_classification_result("hash123", model_params, result)
        
        retrieved = manager.get_classification_result("hash123", model_params)
        assert retrieved == result
        
        # Test with different params (should not match)
        different_params = {"topk": 5, "threshold": 0.8}
        assert manager.get_classification_result("hash123", different_params) is None
    
    def test_nutrition_lookup_caching(self):
        """Test nutrition lookup caching"""
        manager = CacheManager()
        
        nutrition = {"calories": 150, "protein": 15}
        manager.set_nutrition_lookup("chicken_wings", nutrition)
        
        retrieved = manager.get_nutrition_lookup("chicken_wings")
        assert retrieved == nutrition
        
        # Test non-existent food label
        assert manager.get_nutrition_lookup("nonexistent") is None
    
    def test_cache_key_generation(self):
        """Test cache key generation"""
        manager = CacheManager()
        
        # Test with different data types
        data1 = {"key": "value"}
        data2 = {"key": "value", "order": "different"}
        
        key1 = manager._generate_cache_key("test", data1)
        key2 = manager._generate_cache_key("test", data2)
        
        # Keys should be different for different data
        assert key1 != key2
        
        # Same data should generate same key
        key3 = manager._generate_cache_key("test", data1)
        assert key1 == key3
    
    def test_clear_all_caches(self):
        """Test clearing all caches"""
        manager = CacheManager()
        
        # Add some data to all caches
        manager.set_model_prediction("hash1", {"test": "data"})
        manager.set_fdc_nutrition("fdc1", {"calories": 100})
        manager.set_nutrition_lookup("food1", {"protein": 10})
        
        # Clear all
        manager.clear_all()
        
        # All caches should be empty
        assert manager.get_model_prediction("hash1") is None
        assert manager.get_fdc_nutrition("fdc1") is None
        assert manager.get_nutrition_lookup("food1") is None
    
    def test_cache_stats(self):
        """Test cache statistics"""
        manager = CacheManager()
        
        # Add some data
        manager.set_model_prediction("hash1", {"test": "data"})
        manager.set_fdc_nutrition("fdc1", {"calories": 100})
        
        stats = manager.get_stats()
        
        assert "model_cache" in stats
        assert "fdc_cache" in stats
        assert "classification_cache" in stats
        assert "nutrition_cache" in stats
        
        # Each cache should have stats
        for cache_name in ["model_cache", "fdc_cache", "classification_cache", "nutrition_cache"]:
            cache_stats = stats[cache_name]
            assert "size" in cache_stats
            assert "max_size" in cache_stats
            assert "ttl_seconds" in cache_stats

class TestGlobalCacheManager:
    """Test global cache manager instance"""
    
    def test_global_cache_manager(self):
        """Test global cache manager instance"""
        assert cache_manager is not None
        assert isinstance(cache_manager, CacheManager)
    
    def test_global_cache_operations(self):
        """Test operations on global cache manager"""
        # Test model prediction caching
        prediction = {"label": "test_food", "confidence": 0.8}
        cache_manager.set_model_prediction("test_hash", prediction)
        
        retrieved = cache_manager.get_model_prediction("test_hash")
        assert retrieved == prediction
        
        # Test FDC nutrition caching
        nutrition = {"calories": 300, "protein": 25}
        cache_manager.set_fdc_nutrition("test_fdc", nutrition)
        
        retrieved_nutrition = cache_manager.get_fdc_nutrition("test_fdc")
        assert retrieved_nutrition == nutrition

class TestCacheIntegration:
    """Test cache integration with other components"""
    
    def test_cache_with_ttl(self):
        """Test cache behavior with TTL"""
        manager = CacheManager()
        
        # Set data with short TTL
        manager._model_cache.ttl_seconds = 1
        manager.set_model_prediction("test_hash", {"test": "data"})
        
        # Should be available immediately
        assert manager.get_model_prediction("test_hash") is not None
        
        # Wait for expiration
        time.sleep(1.1)
        
        # Should be expired
        assert manager.get_model_prediction("test_hash") is None
    
    def test_cache_size_limits(self):
        """Test cache size limits"""
        manager = CacheManager()
        
        # Set small cache size
        manager._model_cache.max_size = 2
        
        # Add 3 items
        manager.set_model_prediction("hash1", {"data": 1})
        manager.set_model_prediction("hash2", {"data": 2})
        manager.set_model_prediction("hash3", {"data": 3})
        
        # First item should be evicted
        assert manager.get_model_prediction("hash1") is None
        assert manager.get_model_prediction("hash2") is not None
        assert manager.get_model_prediction("hash3") is not None

if __name__ == "__main__":
    pytest.main([__file__])
