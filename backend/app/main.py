"""FastAPI application for Islamic characters educational platform.

This module provides the main FastAPI application with comprehensive middleware,
routing, and lifecycle management. It handles database initialization, caching,
monitoring, and request logging.

Attributes:
    app (FastAPI): The main FastAPI application instance
    logger: Structured logger for application events
    MONITORING_AVAILABLE (bool): Flag indicating if monitoring is enabled
    CACHE_AVAILABLE (bool): Flag indicating if Redis cache is available

Example:
    >>> from app.main import app
    >>> app.title
    'على خطاهم API'
"""

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
import time
import uuid

from .database import init_db, get_db
from .api import characters, progress, stats, auth, content, users, media, analytics, recommendations, performance, admin, levels, learning_paths
from .config import settings
from .logging_config import get_logger, log_api_request, log_api_response, log_security_event

# Import monitoring modules with error handling
try:
    from .monitoring import metrics_middleware, get_metrics, get_prometheus_metrics
    MONITORING_AVAILABLE = True
except ImportError as e:
    logger = get_logger(__name__)
    logger.warning(f"Monitoring modules not available: {e}")
    MONITORING_AVAILABLE = False

try:
    from .cache import cache
    CACHE_AVAILABLE = True
except ImportError as e:
    logger = get_logger(__name__)
    logger.warning(f"Cache module not available: {e}")
    CACHE_AVAILABLE = False

# Import rate limiter modules with error handling
try:
    from .utils.rate_limiter import set_rate_limiter, set_ip_blocker
    RATE_LIMITING_AVAILABLE = True
except ImportError as e:
    logger = get_logger(__name__)
    logger.warning(f"Rate limiting modules not available: {e}")
    RATE_LIMITING_AVAILABLE = False

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown procedures.
    
    Handles database initialization, Redis connection testing, upload directory
    creation, and graceful shutdown procedures.
    
    Args:
        app (FastAPI): The FastAPI application instance
        
    Yields:
        None: Control is yielded to the application during runtime
        
    Raises:
        Exception: If critical startup components fail to initialize
        
    Example:
        >>> app = FastAPI(lifespan=lifespan)
        >>> # Application will startup and shutdown properly
    """
    # Startup
    logger.info("Application starting up...")
    logger.info(f"Database initialized: {settings.DATABASE_URL}")
    
    try:
        # Initialize database and create tables
        init_db()
        logger.info("Database initialization successful")
        
        # Test database connection
        db = next(get_db())
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("Database connection test successful")
        
        # Test Redis connection
        if CACHE_AVAILABLE and cache.is_available():
            cache.redis_client.ping()
            logger.info("Redis connection test successful")
            
            # Initialize rate limiter with Redis
            if RATE_LIMITING_AVAILABLE:
                set_rate_limiter(cache.redis_client)
                set_ip_blocker(cache.redis_client)
                logger.info("Rate limiting initialized with Redis")
        else:
            logger.warning("Redis not available - caching and rate limiting disabled")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    # Ensure upload directory exists
    upload_dir = settings.UPLOAD_DIR
    os.makedirs(upload_dir, exist_ok=True)
    logger.info(f"Upload directory: {upload_dir}")
    
    logger.info("Application startup complete")
    yield
    
    # Shutdown
    logger.info("Application shutting down...")

app = FastAPI(
    title="على خطاهم API",
    description="API لتطبيق قصص الشخصيات الإسلامية",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware - Updated for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://on-their-footsteps.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests and outgoing responses.
    
    Adds request ID and process time headers to responses.
    
    Args:
        request (Request): The incoming request instance
        call_next (Callable): The next middleware or route handler
        
    Returns:
        Response: The outgoing response instance
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Log request
    log_api_request(
        logger,
        request.method,
        str(request.url),
        ip_address=client_ip
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    process_time = time.time() - start_time
    
    # Log response
    log_api_response(
        logger,
        request.method,
        str(request.url),
        response.status_code,
        duration=process_time
    )
    
    # Add headers
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Health check endpoint
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring application status.
    
    Returns basic health information including service status, version,
    and current timestamp. Used by load balancers and monitoring systems.
    
    Returns:
        dict: Health status information with service details
        
    Example:
        >>> response = client.get("/api/health")
        >>> response.json()
        {'status': 'healthy', 'service': 'على خطاهم API', 'version': '2.0.0'}
    """
    return {
        "status": "healthy", 
        "service": "على خطاهم API",
        "version": "2.0.0",
        "timestamp": time.time()
    }

# Metrics endpoints
if MONITORING_AVAILABLE:
    @app.get("/api/metrics", tags=["Monitoring"])
    async def metrics_endpoint():
        """Get application metrics for monitoring and performance analysis.
        
        Returns comprehensive application metrics including request counts,
        response times, database performance, and system resource usage.
        
        Returns:
            dict: Application metrics data
            
        Raises:
            HTTPException: If monitoring is not available (503)
            
        Example:
            >>> response = client.get("/api/metrics")
            >>> response.json()
            {'requests_total': 1000, 'avg_response_time': 0.123}
        """
        return await get_metrics()

    @app.get("/api/metrics/prometheus", tags=["Monitoring"])
    async def prometheus_metrics():
        """Get metrics in Prometheus format for integration with monitoring systems.
        
        Returns metrics formatted according to Prometheus exposition format,
        suitable for scraping by Prometheus server or compatible monitoring tools.
        
        Returns:
            str: Prometheus-formatted metrics data
            
        Raises:
            HTTPException: If monitoring is not available (503)
            
        Example:
            >>> response = client.get("/api/metrics/prometheus")
            >>> response.text
            '# HELP api_requests_total Total API requests'
        """
        return get_prometheus_metrics()
else:
    @app.get("/api/metrics", tags=["Monitoring"])
    async def metrics_endpoint():
        """Get application metrics - monitoring disabled"""
        return {"message": "Monitoring not available"}

    @app.get("/api/metrics/prometheus", tags=["Monitoring"])
    async def prometheus_metrics():
        """Get metrics in Prometheus format - monitoring disabled"""
        return {"message": "Monitoring not available"}

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(characters.router, prefix="/api/characters", tags=["Characters"])
app.include_router(levels.router, prefix="/api/levels", tags=["Levels & Quizzes"])
app.include_router(progress.router, prefix="/api/progress", tags=["User Progress"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
app.include_router(content.router, prefix="/api/content", tags=["Content Management"])
app.include_router(users.router, prefix="/api/users", tags=["User Management"])
app.include_router(media.router, prefix="/api/media", tags=["Media Management"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["Recommendations"])
app.include_router(performance.router, prefix="/api/performance", tags=["Performance"])
app.include_router(learning_paths.router, tags=["Learning Paths"])

@app.get("/")
async def root():
    """Root endpoint providing basic API information and navigation links.
    
    Returns a welcome message with API version and links to documentation
    and health check endpoints. Useful for API discovery and basic
    connectivity testing.
    
    Returns:
        dict: Welcome message with API information and navigation links
        
    Example:
        >>> response = client.get("/")
        >>> response.json()
        {'message': 'مرحباً بك في تطبيق على خُطاهم', 'version': '2.0.0'}
    """
    return {
        "message": "مرحباً بك في تطبيق 'على خُطاهم'",
        "version": "2.0.0",
        "docs": "/api/docs",
        "health": "/api/health"
    }