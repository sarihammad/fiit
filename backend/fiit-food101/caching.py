"""
Caching system for FIIT Food-101 API
"""
import time
import hashlib
import json
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import OrderedDict
import threading

logger = logging.getLogger(__name__)

class LRUCache:
    """Thread-safe LRU cache implementation"""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 3600):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._cache = OrderedDict()
        self._timestamps = {}
        self._lock = threading.Lock()
    
    def _is_expired(self, key: str) -> bool:
        """Check if key is expired"""
        if key not in self._timestamps:
            return True
        return time.time() - self._timestamps[key] > self.ttl_seconds
    
    def _cleanup_expired(self):
        """Remove expired entries"""
        current_time = time.time()
        expired_keys = [
            key for key, timestamp in self._timestamps.items()
            if current_time - timestamp > self.ttl_seconds
        ]
        
        for key in expired_keys:
            self._cache.pop(key, None)
            self._timestamps.pop(key, None)
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self._lock:
            if key in self._cache and not self._is_expired(key):
                # Move to end (most recently used)
                value = self._cache.pop(key)
                self._cache[key] = value
                return value
            else:
                # Remove if expired
                self._cache.pop(key, None)
                self._timestamps.pop(key, None)
                return None
    
    def set(self, key: str, value: Any) -> None:
        """Set value in cache"""
        with self._lock:
            # Clean up expired entries periodically
            if len(self._cache) > self.max_size * 0.9:
                self._cleanup_expired()
            
            # Remove oldest if at capacity
            while len(self._cache) >= self.max_size:
                oldest_key = next(iter(self._cache))
                self._cache.pop(oldest_key)
                self._timestamps.pop(oldest_key, None)
            
            self._cache[key] = value
            self._timestamps[key] = time.time()
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self._lock:
            if key in self._cache:
                self._cache.pop(key)
                self._timestamps.pop(key, None)
                return True
            return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
            self._timestamps.clear()
    
    def size(self) -> int:
        """Get current cache size"""
        with self._lock:
            return len(self._cache)
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            current_time = time.time()
            expired_count = sum(
                1 for timestamp in self._timestamps.values()
                if current_time - timestamp > self.ttl_seconds
            )
            
            return {
                "size": len(self._cache),
                "max_size": self.max_size,
                "expired_entries": expired_count,
                "ttl_seconds": self.ttl_seconds
            }

class CacheManager:
    """Centralized cache management for the API"""
    
    def __init__(self):
        # Different caches for different data types
        self._model_cache = LRUCache(max_size=100, ttl_seconds=3600)  # 1 hour
        self._fdc_cache = LRUCache(max_size=1000, ttl_seconds=86400)  # 24 hours
        self._classification_cache = LRUCache(max_size=500, ttl_seconds=1800)  # 30 minutes
        self._nutrition_cache = LRUCache(max_size=2000, ttl_seconds=3600)  # 1 hour
    
    def _generate_cache_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        if isinstance(data, (dict, list)):
            data_str = json.dumps(data, sort_keys=True)
        else:
            data_str = str(data)
        
        return f"{prefix}:{hashlib.md5(data_str.encode()).hexdigest()}"
    
    def get_model_prediction(self, image_hash: str) -> Optional[Dict[str, Any]]:
        """Get cached model prediction"""
        return self._model_cache.get(f"prediction:{image_hash}")
    
    def set_model_prediction(self, image_hash: str, prediction: Dict[str, Any]) -> None:
        """Cache model prediction"""
        self._model_cache.set(f"prediction:{image_hash}", prediction)
    
    def get_fdc_nutrition(self, fdc_id: str) -> Optional[Dict[str, Any]]:
        """Get cached FDC nutrition data"""
        return self._fdc_cache.get(f"nutrition:{fdc_id}")
    
    def set_fdc_nutrition(self, fdc_id: str, nutrition: Dict[str, Any]) -> None:
        """Cache FDC nutrition data"""
        self._fdc_cache.set(f"nutrition:{fdc_id}", nutrition)
    
    def get_classification_result(self, image_hash: str, model_params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Get cached classification result"""
        key = self._generate_cache_key("classification", {"image": image_hash, "params": model_params})
        return self._classification_cache.get(key)
    
    def set_classification_result(self, image_hash: str, model_params: Dict[str, Any], result: Dict[str, Any]) -> None:
        """Cache classification result"""
        key = self._generate_cache_key("classification", {"image": image_hash, "params": model_params})
        self._classification_cache.set(key, result)
    
    def get_nutrition_lookup(self, food_label: str) -> Optional[Dict[str, Any]]:
        """Get cached nutrition lookup"""
        return self._nutrition_cache.get(f"lookup:{food_label}")
    
    def set_nutrition_lookup(self, food_label: str, nutrition: Dict[str, Any]) -> None:
        """Cache nutrition lookup"""
        self._nutrition_cache.set(f"lookup:{food_label}", nutrition)
    
    def clear_all(self) -> None:
        """Clear all caches"""
        self._model_cache.clear()
        self._fdc_cache.clear()
        self._classification_cache.clear()
        self._nutrition_cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "model_cache": self._model_cache.stats(),
            "fdc_cache": self._fdc_cache.stats(),
            "classification_cache": self._classification_cache.stats(),
            "nutrition_cache": self._nutrition_cache.stats()
        }

# Global cache manager instance
cache_manager = CacheManager()

def cache_model_prediction(image_hash: str, prediction: Dict[str, Any]) -> None:
    """Cache model prediction with logging"""
    cache_manager.set_model_prediction(image_hash, prediction)
    logger.debug(f"Cached model prediction for image hash: {image_hash[:8]}...")

def get_cached_model_prediction(image_hash: str) -> Optional[Dict[str, Any]]:
    """Get cached model prediction with logging"""
    result = cache_manager.get_model_prediction(image_hash)
    if result:
        logger.debug(f"Cache hit for image hash: {image_hash[:8]}...")
    return result

def cache_fdc_nutrition(fdc_id: str, nutrition: Dict[str, Any]) -> None:
    """Cache FDC nutrition data with logging"""
    cache_manager.set_fdc_nutrition(fdc_id, nutrition)
    logger.debug(f"Cached FDC nutrition for ID: {fdc_id}")

def get_cached_fdc_nutrition(fdc_id: str) -> Optional[Dict[str, Any]]:
    """Get cached FDC nutrition data with logging"""
    result = cache_manager.get_fdc_nutrition(fdc_id)
    if result:
        logger.debug(f"Cache hit for FDC ID: {fdc_id}")
    return result
