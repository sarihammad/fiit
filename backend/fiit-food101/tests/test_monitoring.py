"""
Tests for monitoring and metrics functionality
"""
import pytest
import time
import threading
from unittest.mock import patch, MagicMock

# Import monitoring modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from monitoring import MetricsCollector, RateLimiter, HealthChecker, metrics, rate_limiter, health_checker

class TestMetricsCollector:
    """Test metrics collection functionality"""
    
    def test_metrics_collector_creation(self):
        """Test metrics collector can be created"""
        collector = MetricsCollector()
        assert collector is not None
        assert collector._counters == {}
        assert collector._histograms == {}
        assert collector._gauges == {}
    
    def test_increment_counter(self):
        """Test counter increment"""
        collector = MetricsCollector()
        collector.increment("test_counter")
        assert collector._counters["test_counter"] == 1
        
        collector.increment("test_counter", 5)
        assert collector._counters["test_counter"] == 6
    
    def test_increment_counter_with_labels(self):
        """Test counter increment with labels"""
        collector = MetricsCollector()
        collector.increment("test_counter", labels={"service": "api"})
        assert collector._counters["test_counter_{'service': 'api'}"] == 1
    
    def test_observe_histogram(self):
        """Test histogram observation"""
        collector = MetricsCollector()
        collector.observe("test_histogram", 1.5)
        collector.observe("test_histogram", 2.5)
        
        assert len(collector._histograms["test_histogram"]) == 2
        assert collector._histograms["test_histogram"] == [1.5, 2.5]
    
    def test_set_gauge(self):
        """Test gauge setting"""
        collector = MetricsCollector()
        collector.set_gauge("test_gauge", 42.0)
        assert collector._gauges["test_gauge"] == 42.0
        
        collector.set_gauge("test_gauge", 100.0)
        assert collector._gauges["test_gauge"] == 100.0
    
    def test_get_metrics(self):
        """Test metrics retrieval"""
        collector = MetricsCollector()
        collector.increment("test_counter")
        collector.observe("test_histogram", 1.0)
        collector.observe("test_histogram", 2.0)
        collector.set_gauge("test_gauge", 50.0)
        
        metrics_data = collector.get_metrics()
        
        assert "uptime_seconds" in metrics_data
        assert "counters" in metrics_data
        assert "gauges" in metrics_data
        assert "histograms" in metrics_data
        assert "timestamp" in metrics_data
        
        assert metrics_data["counters"]["test_counter"] == 1
        assert metrics_data["gauges"]["test_gauge"] == 50.0
        assert "test_histogram" in metrics_data["histograms"]
    
    def test_histogram_statistics(self):
        """Test histogram statistics calculation"""
        collector = MetricsCollector()
        values = [1, 2, 3, 4, 5]
        for value in values:
            collector.observe("test_histogram", value)
        
        metrics_data = collector.get_metrics()
        hist_stats = metrics_data["histograms"]["test_histogram"]
        
        assert hist_stats["count"] == 5
        assert hist_stats["min"] == 1
        assert hist_stats["max"] == 5
        assert hist_stats["avg"] == 3.0
        assert hist_stats["p50"] == 3
        assert hist_stats["p95"] == 5
        assert hist_stats["p99"] == 5
    
    def test_thread_safety(self):
        """Test that metrics collector is thread-safe"""
        collector = MetricsCollector()
        
        def increment_counter():
            for _ in range(100):
                collector.increment("thread_test")
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=increment_counter)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Should have 500 total increments
        assert collector._counters["thread_test"] == 500
    
    def test_histogram_size_limit(self):
        """Test that histogram size is limited"""
        collector = MetricsCollector()
        
        # Add more than 1000 values
        for i in range(1500):
            collector.observe("large_histogram", i)
        
        # Should only keep the last 1000 values
        assert len(collector._histograms["large_histogram"]) == 1000
        assert collector._histograms["large_histogram"][0] == 500  # First value should be 500

class TestRateLimiter:
    """Test rate limiting functionality"""
    
    def test_rate_limiter_creation(self):
        """Test rate limiter can be created"""
        limiter = RateLimiter(max_requests=10, window_seconds=60)
        assert limiter.max_requests == 10
        assert limiter.window_seconds == 60
    
    def test_rate_limit_allowed(self):
        """Test rate limit allows requests within limit"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        
        # Should allow first 5 requests
        for i in range(5):
            assert limiter.is_allowed("test_client") is True
    
    def test_rate_limit_exceeded(self):
        """Test rate limit blocks requests over limit"""
        limiter = RateLimiter(max_requests=3, window_seconds=60)
        
        # Should allow first 3 requests
        for i in range(3):
            assert limiter.is_allowed("test_client") is True
        
        # Should block the 4th request
        assert limiter.is_allowed("test_client") is False
    
    def test_rate_limit_window_reset(self):
        """Test rate limit window resets after time"""
        limiter = RateLimiter(max_requests=2, window_seconds=1)  # 1 second window
        
        # Use up the limit
        assert limiter.is_allowed("test_client") is True
        assert limiter.is_allowed("test_client") is True
        assert limiter.is_allowed("test_client") is False
        
        # Wait for window to reset
        time.sleep(1.1)
        
        # Should allow requests again
        assert limiter.is_allowed("test_client") is True
    
    def test_different_clients(self):
        """Test rate limiting works per client"""
        limiter = RateLimiter(max_requests=2, window_seconds=60)
        
        # Client 1 uses up their limit
        assert limiter.is_allowed("client1") is True
        assert limiter.is_allowed("client1") is True
        assert limiter.is_allowed("client1") is False
        
        # Client 2 should still be allowed
        assert limiter.is_allowed("client2") is True
        assert limiter.is_allowed("client2") is True
        assert limiter.is_allowed("client2") is False
    
    def test_get_remaining_requests(self):
        """Test getting remaining requests"""
        limiter = RateLimiter(max_requests=5, window_seconds=60)
        
        # Should start with 5 remaining
        assert limiter.get_remaining_requests("test_client") == 5
        
        # Use 2 requests
        limiter.is_allowed("test_client")
        limiter.is_allowed("test_client")
        
        # Should have 3 remaining
        assert limiter.get_remaining_requests("test_client") == 3

class TestHealthChecker:
    """Test health check functionality"""
    
    def test_health_checker_creation(self):
        """Test health checker can be created"""
        checker = HealthChecker()
        assert checker is not None
        assert checker._checks == {}
        assert checker._last_checks == {}
    
    def test_register_check(self):
        """Test registering health checks"""
        checker = HealthChecker()
        
        def test_check():
            return True
        
        checker.register_check("test_check", test_check, timeout=5)
        assert "test_check" in checker._checks
        assert checker._checks["test_check"][0] == test_check
        assert checker._checks["test_check"][1] == 5
    
    def test_run_checks_success(self):
        """Test running successful health checks"""
        checker = HealthChecker()
        
        def successful_check():
            return True
        
        checker.register_check("success_check", successful_check)
        results = checker.run_checks()
        
        assert "success_check" in results
        assert results["success_check"]["status"] == "healthy"
        assert "duration_ms" in results["success_check"]
        assert "timestamp" in results["success_check"]
    
    def test_run_checks_failure(self):
        """Test running failed health checks"""
        checker = HealthChecker()
        
        def failed_check():
            return False
        
        checker.register_check("failed_check", failed_check)
        results = checker.run_checks()
        
        assert "failed_check" in results
        assert results["failed_check"]["status"] == "unhealthy"
    
    def test_run_checks_exception(self):
        """Test running health checks that raise exceptions"""
        checker = HealthChecker()
        
        def exception_check():
            raise Exception("Test exception")
        
        checker.register_check("exception_check", exception_check)
        results = checker.run_checks()
        
        assert "exception_check" in results
        assert results["exception_check"]["status"] == "error"
        assert "error" in results["exception_check"]
        assert "Test exception" in results["exception_check"]["error"]
    
    def test_get_last_checks(self):
        """Test getting last check results"""
        checker = HealthChecker()
        
        def test_check():
            return True
        
        checker.register_check("test_check", test_check)
        checker.run_checks()
        
        last_checks = checker.get_last_checks()
        assert "test_check" in last_checks
        assert last_checks["test_check"]["status"] == "healthy"

class TestGlobalInstances:
    """Test global monitoring instances"""
    
    def test_metrics_instance(self):
        """Test global metrics instance"""
        assert metrics is not None
        assert isinstance(metrics, MetricsCollector)
    
    def test_rate_limiter_instance(self):
        """Test global rate limiter instance"""
        # Rate limiter might be None if not initialized
        # This is expected behavior
        assert rate_limiter is None or isinstance(rate_limiter, RateLimiter)
    
    def test_health_checker_instance(self):
        """Test global health checker instance"""
        assert health_checker is not None
        assert isinstance(health_checker, HealthChecker)

class TestRequestTimer:
    """Test request timing functionality"""
    
    def test_request_timer_context_manager(self):
        """Test request timer as context manager"""
        from monitoring import RequestTimer
        
        with RequestTimer("test_metric") as timer:
            time.sleep(0.01)  # Small delay
        
        # Timer should have recorded the duration
        # This is tested indirectly through the metrics system
    
    def test_request_timer_with_labels(self):
        """Test request timer with labels"""
        from monitoring import RequestTimer
        
        with RequestTimer("test_metric", labels={"service": "api"}):
            time.sleep(0.01)
        
        # Should record metrics with labels
        # This is tested indirectly through the metrics system

if __name__ == "__main__":
    pytest.main([__file__])
