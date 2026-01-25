import time
import psutil
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from functools import wraps
from fastapi import Request, Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CollectorRegistry

from .logging_config import get_logger

logger = get_logger(__name__)

# Create a custom registry
REGISTRY = CollectorRegistry()

# Metrics definitions
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code'],
    registry=REGISTRY
)

REQUEST_DURATION = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    registry=REGISTRY
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections',
    registry=REGISTRY
)

DATABASE_CONNECTIONS = Gauge(
    'database_connections',
    'Number of database connections',
    registry=REGISTRY
)

MEMORY_USAGE = Gauge(
    'memory_usage_bytes',
    'Memory usage in bytes',
    registry=REGISTRY
)

CPU_USAGE = Gauge(
    'cpu_usage_percent',
    'CPU usage percentage',
    registry=REGISTRY
)

CACHE_HIT_RATE = Gauge(
    'cache_hit_rate',
    'Cache hit rate percentage',
    registry=REGISTRY
)

ERROR_COUNT = Counter(
    'errors_total',
    'Total number of errors',
    ['error_type', 'endpoint'],
    registry=REGISTRY
)

class PerformanceMonitor:
    """Performance monitoring and metrics collection"""
    
    def __init__(self):
        self.start_time = time.time()
        self.request_count = 0
        self.error_count = 0
        self.cache_hits = 0
        self.cache_misses = 0
    
    def record_request(self, method: str, endpoint: str, status_code: int, duration: float):
        """Record HTTP request metrics"""
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=str(status_code)
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        self.request_count += 1
    
    def record_error(self, error_type: str, endpoint: str, error_message: str = ""):
        """Record error metrics"""
        ERROR_COUNT.labels(
            error_type=error_type,
            endpoint=endpoint
        ).inc()
        
        self.error_count += 1
        logger.error(f"Error recorded: {error_type} at {endpoint}: {error_message}")
    
    def record_cache_hit(self):
        """Record cache hit"""
        self.cache_hits += 1
        self._update_cache_hit_rate()
    
    def record_cache_miss(self):
        """Record cache miss"""
        self.cache_misses += 1
        self._update_cache_hit_rate()
    
    def _update_cache_hit_rate(self):
        """Update cache hit rate gauge"""
        total_cache_requests = self.cache_hits + self.cache_misses
        if total_cache_requests > 0:
            hit_rate = (self.cache_hits / total_cache_requests) * 100
            CACHE_HIT_RATE.set(hit_rate)
    
    def collect_system_metrics(self) -> Dict[str, Any]:
        """Collect system performance metrics"""
        try:
            # Memory usage
            memory = psutil.virtual_memory()
            MEMORY_USAGE.set(memory.used)
            
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            CPU_USAGE.set(cpu_percent)
            
            # Active connections (simplified)
            ACTIVE_CONNECTIONS.set(self.request_count)
            
            return {
                'memory_usage': {
                    'used': memory.used,
                    'available': memory.available,
                    'percent': memory.percent
                },
                'cpu_usage': cpu_percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'network_io': psutil.net_io_counters()._asdict() if hasattr(psutil, 'net_io_counters') else {},
                'process_count': len(psutil.pids()),
                'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat()
            }
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
            return {}
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary of all metrics"""
        uptime = time.time() - self.start_time
        
        return {
            'uptime_seconds': uptime,
            'total_requests': self.request_count,
            'total_errors': self.error_count,
            'error_rate': (self.error_count / max(self.request_count, 1)) * 100,
            'cache_hits': self.cache_hits,
            'cache_misses': self.cache_misses,
            'cache_hit_rate': (self.cache_hits / max(self.cache_hits + self.cache_misses, 1)) * 100,
            'requests_per_second': self.request_count / max(uptime, 1),
            'system_metrics': self.collect_system_metrics()
        }

# Global performance monitor instance
monitor = PerformanceMonitor()

async def metrics_middleware(request: Request, call_next):
    """FastAPI middleware for collecting metrics"""
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        # Calculate duration
        duration = time.time() - start_time
        
        # Record metrics
        endpoint = request.url.path or "unknown"
        monitor.record_request(
            method=request.method,
            endpoint=endpoint,
            status_code=response.status_code,
            duration=duration
        )
        
        # Add custom headers
        response.headers["X-Response-Time"] = str(duration)
        response.headers["X-Metrics-Enabled"] = "true"
        
        return response
        
    except Exception as e:
        # Record error
        monitor.record_error(
            error_type=type(e).__name__,
            endpoint=request.url.path or "unknown",
            error_message=str(e)
        )
        raise

def track_performance(operation_type: str = "database"):
    """Decorator for tracking performance of specific operations"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                logger.info(f"Performance: {operation_type} operation completed in {duration:.3f}s")
                
                # Record slow operations (> 1 second)
                if duration > 1.0:
                    monitor.record_error(
                        error_type="slow_operation",
                        endpoint=f"{operation_type}_operation",
                        error_message=f"Operation took {duration:.3f}s"
                    )
                
                return result
            except Exception as e:
                duration = time.time() - start_time
                monitor.record_error(
                    error_type=f"{operation_type}_error",
                    endpoint=f"{operation_type}_operation",
                    error_message=str(e)
                )
                raise
        return wrapper
    return decorator

class HealthChecker:
    """Health check utilities for monitoring"""
    
    @staticmethod
    def check_database_health() -> Dict[str, Any]:
        """Check database health"""
        try:
            # This would be implemented based on your database
            # For now, return mock data
            return {
                'status': 'healthy',
                'connection_pool_size': 10,
                'active_connections': 3,
                'response_time_ms': 45
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e)
            }
    
    @staticmethod
    def check_cache_health() -> Dict[str, Any]:
        """Check in-memory cache health"""
        from ..cache import cache
        return {
            'status': 'healthy',
            'type': 'in-memory',
            'max_size': cache._cache.maxsize,
            'current_size': len(cache._cache)
        }
    
    @staticmethod
    def check_system_health() -> Dict[str, Any]:
        """Check overall system health"""
        system_metrics = monitor.collect_system_metrics()
        
        # Determine health status
        health_status = 'healthy'
        issues = []
        
        if system_metrics.get('cpu_usage', 0) > 80:
            health_status = 'degraded'
            issues.append('High CPU usage')
        
        if system_metrics.get('memory_usage', {}).get('percent', 0) > 85:
            health_status = 'degraded'
            issues.append('High memory usage')
        
        if monitor.error_count > 10:  # More than 10 errors
            health_status = 'unhealthy'
            issues.append('High error rate')
        
        return {
            'status': health_status,
            'issues': issues,
            'uptime_seconds': time.time() - monitor.start_time,
            'system_metrics': system_metrics
        }

# Metrics endpoint for monitoring
async def get_metrics() -> Dict[str, Any]:
    """Get all metrics for monitoring"""
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'metrics': monitor.get_metrics_summary(),
        'health': {
            'database': HealthChecker.check_database_health(),
            'cache': HealthChecker.check_cache_health(),
            'system': HealthChecker.check_system_health()
        }
    }

# Prometheus metrics endpoint
async def get_prometheus_metrics() -> str:
    """Get metrics in Prometheus format"""
    return generate_latest(REGISTRY)
