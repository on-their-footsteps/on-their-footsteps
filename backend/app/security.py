import secrets
import hashlib
import re
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bleach

from .config import settings
from .logging_config import get_logger, log_security_event

logger = get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token scheme
security = HTTPBearer()

class SecurityManager:
    """Centralized security management"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        return pwd_context.hash(password)
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except JWTError as e:
            log_security_event(logger, "invalid_token", {"error": str(e)})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def generate_secure_random_string(length: int = 32) -> str:
        """Generate cryptographically secure random string"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def sanitize_html(content: str, allowed_tags: List[str] = None) -> str:
        """Sanitize HTML content to prevent XSS"""
        if allowed_tags is None:
            allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']
        
        return bleach.clean(
            content,
            tags=allowed_tags,
            attributes={},
            strip=True
        )
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input to prevent injection attacks"""
        if not text:
            return ""
        
        # Remove potential SQL injection patterns
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)",
            r"(\-\-|\#|\/\*|\*\/)",
            r"(\bOR\b.*\b1\b\s*=\s*1|\bAND\b.*\b1\b\s*=\s*1)",
            r"(\bWHERE\b.*\bOR\b)",
        ]
        
        for pattern in sql_patterns:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        
        # Remove potential XSS patterns
        xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            r"<iframe[^>]*>",
            r"<object[^>]*>",
            r"<embed[^>]*>",
        ]
        
        for pattern in xss_patterns:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        
        return text.strip()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        result = {
            "is_valid": True,
            "errors": [],
            "score": 0
        }
        
        # Length check
        if len(password) < 8:
            result["errors"].append("Password must be at least 8 characters long")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        # Uppercase check
        if not re.search(r'[A-Z]', password):
            result["errors"].append("Password must contain at least one uppercase letter")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        # Lowercase check
        if not re.search(r'[a-z]', password):
            result["errors"].append("Password must contain at least one lowercase letter")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        # Number check
        if not re.search(r'\d', password):
            result["errors"].append("Password must contain at least one number")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        # Special character check
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            result["errors"].append("Password must contain at least one special character")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        return result
    
    @staticmethod
    async def rate_limit_check(request: Request, limit: int = 100, window: int = 3600) -> bool:
        """Check rate limiting (now uses dedicated rate limiter)"""
        from .utils.rate_limiter import get_rate_limiter
        
        rate_limiter = get_rate_limiter()
        if not rate_limiter:
            # Fallback to simple check if rate limiter not available
            client_ip = request.client.host if request.client else "unknown"
            log_security_event(
                logger,
                "rate_limit_check_fallback",
                {
                    "ip": client_ip,
                    "limit": limit,
                    "window": window
                }
            )
            return True
        
        # Use dedicated rate limiter
        try:
            result = await rate_limiter.check_rate_limit(request, 'default')
            return result['allowed']
        except Exception as e:
            logger.error(f"Rate limit check error: {e}")
            return True  # Allow request if rate limiter fails
    
    @staticmethod
    def is_safe_url(url: str, allowed_hosts: List[str] = None) -> bool:
        """Check if URL is safe for redirects"""
        if not url:
            return False
        
        # Check for dangerous protocols
        dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'file:']
        if any(url.lower().startswith(protocol) for protocol in dangerous_protocols):
            return False
        
        # Check against allowed hosts
        if allowed_hosts:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            if parsed.netloc not in allowed_hosts:
                return False
        
        return True

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user from JWT token"""
    from .database import get_db
    from .models import User
    
    token = credentials.credentials
    payload = SecurityManager.verify_token(token)
    
    user_email = payload.get("sub")
    if user_email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Get database session
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # Fetch user from database
        user = db.query(User).filter(User.email == user_email).first()
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive user"
            )
        
        return user
    finally:
        db.close()

# Export convenience functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return SecurityManager.verify_password(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    return SecurityManager.hash_password(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    return SecurityManager.create_access_token(data, expires_delta)

# Security headers middleware
def add_security_headers(request: Request, call_next):
    """Add security headers to responses"""
    response = call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response

# Input validation decorators
def validate_input(max_length: int = 1000, allow_html: bool = False):
    """Decorator to validate and sanitize input"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Sanitize string arguments
            for key, value in kwargs.items():
                if isinstance(value, str):
                    if not allow_html:
                        kwargs[key] = SecurityManager.sanitize_input(value)
                    else:
                        kwargs[key] = SecurityManager.sanitize_html(value)
                    
                    # Check length
                    if len(kwargs[key]) > max_length:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Input '{key}' exceeds maximum length of {max_length}"
                        )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# CSRF protection (simplified)
def generate_csrf_token() -> str:
    """Generate CSRF token"""
    return SecurityManager.generate_secure_random_string()

def verify_csrf_token(token: str, session_token: str) -> bool:
    """Verify CSRF token"""
    return secrets.compare_digest(token, session_token)

# File upload security
def validate_file_upload(filename: str, content_type: str, file_size: int) -> Dict[str, Any]:
    """Validate uploaded file for security"""
    result = {
        "is_valid": True,
        "errors": []
    }
    
    # Check file size
    if file_size > settings.MAX_FILE_SIZE:
        result["errors"].append(f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE} bytes")
        result["is_valid"] = False
    
    # Check file extension
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.ogg']
    file_extension = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    
    if file_extension not in allowed_extensions:
        result["errors"].append(f"File extension '{file_extension}' is not allowed")
        result["is_valid"] = False
    
    # Check MIME type
    allowed_mime_types = settings.ALLOWED_IMAGE_TYPES + ['audio/mpeg', 'audio/wav', 'audio/ogg']
    if content_type not in allowed_mime_types:
        result["errors"].append(f"MIME type '{content_type}' is not allowed")
        result["is_valid"] = False
    
    # Check for malicious filenames
    malicious_patterns = [
        r'\.\.',  # Directory traversal
        r'[<>:"|?*]',  # Invalid characters
        r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])',  # Windows reserved names
    ]
    
    for pattern in malicious_patterns:
        if re.search(pattern, filename, re.IGNORECASE):
            result["errors"].append("Filename contains malicious patterns")
            result["is_valid"] = False
            break
    
    return result
