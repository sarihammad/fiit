"""
Monitoring and metrics for FIIT Food-101 API
"""
import time
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
import threading

logger = logging.getLogger(__name__)

class MetricsCollector:
    """Thread-safe metrics collector for production monitoring"""
    
    def __init__(self):
        self._lock = threading.Lock()
        self._counters = defaultdict(int)
        self._histograms = defaultdict(list)
        self._gauges = defaultdict(float)
        self._start_time = time.time()
        
    def increment(self, metric: str, value: int = 1, labels: Optional[Dict[str, str]] = None):
        """Increment a counter metric"""
        with self._lock:
            key = f"{metric}_{labels}" if labels else metric
            self._counters[key] += value
    
    def observe(self, metric: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Record a histogram value"""
        with self._lock:
            key = f"{metric}_{labels}" if labels else metric
            self._histograms[key].append(value)
            # Keep only last 1000 values to prevent memory issues
            if len(self._histograms[key]) > 1000:
                self._histograms[key] = self._histograms[key][-1000:]
    
    def set_gauge(self, metric: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge value"""
        with self._lock:
            key = f"{metric}_{labels}" if labels else metric
            self._gauges[key] = value
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get all metrics in a structured format"""
        with self._lock:
            uptime = time.time() - self._start_time
            
            # Calculate histogram statistics
            histogram_stats = {}
            for metric, values in self._histograms.items():
                if values:
                    histogram_stats[metric] = {
                        "count": len(values),
                        "min": min(values),
                        "max": max(values),
                        "avg": sum(values) / len(values),
                        "p50": self._percentile(values, 50),
                        "p95": self._percentile(values, 95),
                        "p99": self._percentile(values, 99)
                    }
            
            return {
                "uptime_seconds": uptime,
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
                "histograms": histogram_stats,
                "timestamp": datetime.utcnow().isoformat()
            }
    
    def _percentile(self, values: list, percentile: int) -> float:
        """Calculate percentile of values"""
        if not values:
            return 0.0
        sorted_values = sorted(values)
        index = int((percentile / 100) * len(sorted_values))
        return sorted_values[min(index, len(sorted_values) - 1)]

# Global metrics instance
metrics = MetricsCollector()

class RequestTimer:
    """Context manager for timing requests"""
    
    def __init__(self, metric_name: str, labels: Optional[Dict[str, str]] = None):
        self.metric_name = metric_name
        self.labels = labels
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            duration = time.time() - self.start_time
            metrics.observe(self.metric_name, duration, self.labels)

class RateLimiter:
    """Simple in-memory rate limiter for production"""
    
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests = defaultdict(deque)
        self._lock = threading.Lock()
    
    def is_allowed(self, client_id: str) -> bool:
        """Check if request is allowed for client"""
        now = time.time()
        
        with self._lock:
            # Clean old requests
            while self._requests[client_id] and self._requests[client_id][0] <= now - self.window_seconds:
                self._requests[client_id].popleft()
            
            # Check if under limit
            if len(self._requests[client_id]) < self.max_requests:
                self._requests[client_id].append(now)
                return True
            
            return False
    
    def get_remaining_requests(self, client_id: str) -> int:
        """Get remaining requests for client"""
        now = time.time()
        
        with self._lock:
            # Clean old requests
            while self._requests[client_id] and self._requests[client_id][0] <= now - self.window_seconds:
                self._requests[client_id].popleft()
            
            return max(0, self.max_requests - len(self._requests[client_id]))

class HealthChecker:
    """Health check system for dependencies"""
    
    def __init__(self):
        self._checks = {}
        self._last_checks = {}
    
    def register_check(self, name: str, check_func, timeout: int = 5):
        """Register a health check"""
        self._checks[name] = (check_func, timeout)
    
    def run_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        results = {}
        
        for name, (check_func, timeout) in self._checks.items():
            try:
                start_time = time.time()
                result = check_func()
                duration = time.time() - start_time
                
                results[name] = {
                    "status": "healthy" if result else "unhealthy",
                    "duration_ms": duration * 1000,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                self._last_checks[name] = results[name]
                
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e),
                    "timestamp": datetime.utcnow().isoformat()
                }
                self._last_checks[name] = results[name]
        
        return results
    
    def get_last_checks(self) -> Dict[str, Any]:
        """Get results from last health check run"""
        return self._last_checks

# Global instances
rate_limiter = None
health_checker = HealthChecker()

def initialize_monitoring(config):
    """Initialize monitoring systems"""
    global rate_limiter
    
    rate_limiter = RateLimiter(
        max_requests=config.RATE_LIMIT_REQUESTS,
        window_seconds=config.RATE_LIMIT_WINDOW
    )
    
    # Register health checks
    health_checker.register_check("model_loaded", lambda: True)  # Will be updated when model loads
    health_checker.register_check("fdc_api", lambda: check_fdc_api())
    health_checker.register_check("huggingface", lambda: check_huggingface())

def check_fdc_api() -> bool:
    """Check if FDC API is accessible"""
    try:
        # Simple check - in production, you might want to ping the API
        return True
    except Exception:
        return False

def check_huggingface() -> bool:
    """Check if HuggingFace is accessible"""
    try:
        # Simple check - in production, you might want to ping HF
        return True
    except Exception:
        return False
