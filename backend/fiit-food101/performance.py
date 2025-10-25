"""
Performance optimization utilities for FIIT Food-101 API
"""
import asyncio
import time
import psutil
import gc
from typing import Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor
import threading
from contextlib import asynccontextmanager

class PerformanceMonitor:
    """Monitor system performance and resource usage"""
    
    def __init__(self):
        self._start_time = time.time()
        self._request_count = 0
        self._lock = threading.Lock()
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get current system performance metrics"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=0.1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available / (1024 * 1024)  # MB
            
            # Disk usage
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free = disk.free / (1024 * 1024 * 1024)  # GB
            
            # Process-specific metrics
            process = psutil.Process()
            process_memory = process.memory_info().rss / (1024 * 1024)  # MB
            process_cpu = process.cpu_percent()
            
            return {
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory_percent,
                    "memory_available_mb": memory_available,
                    "disk_percent": disk_percent,
                    "disk_free_gb": disk_free
                },
                "process": {
                    "memory_mb": process_memory,
                    "cpu_percent": process_cpu,
                    "threads": process.num_threads(),
                    "uptime_seconds": time.time() - self._start_time
                },
                "gc": {
                    "count": gc.get_count(),
                    "threshold": gc.get_threshold()
                }
            }
        except Exception as e:
            return {"error": str(e)}
    
    def record_request(self):
        """Record a request for performance tracking"""
        with self._lock:
            self._request_count += 1
    
    def get_request_metrics(self) -> Dict[str, Any]:
        """Get request-related metrics"""
        with self._lock:
            uptime = time.time() - self._start_time
            return {
                "total_requests": self._request_count,
                "requests_per_second": self._request_count / uptime if uptime > 0 else 0,
                "uptime_seconds": uptime
            }

class ResourceManager:
    """Manage system resources and optimization"""
    
    def __init__(self):
        self._executor = None
        self._max_workers = min(4, psutil.cpu_count())
    
    def get_executor(self) -> ThreadPoolExecutor:
        """Get or create thread pool executor"""
        if self._executor is None:
            self._executor = ThreadPoolExecutor(max_workers=self._max_workers)
        return self._executor
    
    def cleanup_resources(self):
        """Clean up resources"""
        if self._executor:
            self._executor.shutdown(wait=True)
            self._executor = None
        
        # Force garbage collection
        gc.collect()
    
    def optimize_memory(self):
        """Optimize memory usage"""
        # Force garbage collection
        collected = gc.collect()
        
        # Get memory stats
        memory = psutil.virtual_memory()
        
        return {
            "gc_collected": collected,
            "memory_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024)
        }
    
    def check_resource_limits(self) -> Dict[str, Any]:
        """Check if we're approaching resource limits"""
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=0.1)
        
        warnings = []
        
        if memory.percent > 80:
            warnings.append(f"High memory usage: {memory.percent:.1f}%")
        
        if cpu_percent > 90:
            warnings.append(f"High CPU usage: {cpu_percent:.1f}%")
        
        return {
            "warnings": warnings,
            "memory_percent": memory.percent,
            "cpu_percent": cpu_percent,
            "healthy": len(warnings) == 0
        }

class ModelOptimizer:
    """Optimize model performance and memory usage"""
    
    def __init__(self, model, processor):
        self.model = model
        self.processor = processor
        self._model_loaded = False
        self._warmup_done = False
    
    def warmup_model(self):
        """Warm up the model with dummy data"""
        if self._warmup_done:
            return
        
        try:
            import torch
            import numpy as np
            
            # Create dummy input
            dummy_input = torch.randn(1, 3, 224, 224)
            
            # Warm up the model
            with torch.no_grad():
                _ = self.model({"pixel_values": dummy_input})
            
            self._warmup_done = True
            print("Model warmup completed")
            
        except Exception as e:
            print(f"Model warmup failed: {e}")
    
    def optimize_model(self):
        """Optimize model for inference"""
        try:
            import torch
            
            # Set model to eval mode
            self.model.eval()
            
            # Enable optimizations
            if hasattr(torch, 'jit'):
                # Try to optimize with TorchScript if available
                try:
                    self.model = torch.jit.optimize_for_inference(self.model)
                except:
                    pass  # TorchScript optimization not available
            
            # Set memory efficient attention if available
            if hasattr(torch.backends, 'cudnn'):
                torch.backends.cudnn.benchmark = True
            
            self._model_loaded = True
            print("Model optimization completed")
            
        except Exception as e:
            print(f"Model optimization failed: {e}")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and memory usage"""
        try:
            import torch
            
            model_params = sum(p.numel() for p in self.model.parameters())
            model_size_mb = sum(p.numel() * p.element_size() for p in self.model.parameters()) / (1024 * 1024)
            
            return {
                "parameters": model_params,
                "size_mb": model_size_mb,
                "device": next(self.model.parameters()).device if hasattr(self.model, 'parameters') else "unknown",
                "dtype": str(next(self.model.parameters()).dtype) if hasattr(self.model, 'parameters') else "unknown",
                "warmup_done": self._warmup_done,
                "optimized": self._model_loaded
            }
            
        except Exception as e:
            return {"error": str(e)}

class AsyncBatchProcessor:
    """Process multiple requests in batches for efficiency"""
    
    def __init__(self, batch_size: int = 4, max_wait_time: float = 0.1):
        self.batch_size = batch_size
        self.max_wait_time = max_wait_time
        self._pending_requests = []
        self._lock = asyncio.Lock()
    
    async def add_request(self, request_data: Dict[str, Any]) -> asyncio.Future:
        """Add a request to the batch processor"""
        future = asyncio.Future()
        
        async with self._lock:
            self._pending_requests.append({
                "data": request_data,
                "future": future,
                "timestamp": time.time()
            })
            
            # Process batch if full
            if len(self._pending_requests) >= self.batch_size:
                await self._process_batch()
        
        return future
    
    async def _process_batch(self):
        """Process a batch of requests"""
        if not self._pending_requests:
            return
        
        # Get current batch
        batch = self._pending_requests[:self.batch_size]
        self._pending_requests = self._pending_requests[self.batch_size:]
        
        # Process batch (this would be implemented with actual model inference)
        try:
            results = await self._process_batch_inference(batch)
            
            # Set results for each future
            for i, result in enumerate(results):
                if i < len(batch):
                    batch[i]["future"].set_result(result)
                    
        except Exception as e:
            # Set error for all futures in batch
            for request in batch:
                request["future"].set_exception(e)
    
    async def _process_batch_inference(self, batch: list) -> list:
        """Process batch inference (placeholder)"""
        # This would contain the actual batch inference logic
        # For now, just return dummy results
        return [{"result": f"batch_{i}"} for i in range(len(batch))]

# Global instances
performance_monitor = PerformanceMonitor()
resource_manager = ResourceManager()

def get_performance_metrics() -> Dict[str, Any]:
    """Get comprehensive performance metrics"""
    return {
        "system": performance_monitor.get_system_metrics(),
        "requests": performance_monitor.get_request_metrics(),
        "resources": resource_manager.check_resource_limits(),
        "optimization": resource_manager.optimize_memory()
    }

def optimize_for_production():
    """Apply production optimizations"""
    # Set garbage collection thresholds
    gc.set_threshold(700, 10, 10)
    
    # Optimize memory
    resource_manager.optimize_memory()
    
    print("Production optimizations applied")

@asynccontextmanager
async def performance_context():
    """Context manager for performance monitoring"""
    start_time = time.time()
    performance_monitor.record_request()
    
    try:
        yield
    finally:
        duration = time.time() - start_time
        # Log performance metrics if needed
        if duration > 1.0:  # Log slow requests
            print(f"Slow request detected: {duration:.3f}s")
