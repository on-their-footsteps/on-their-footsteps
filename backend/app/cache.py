"""
In-memory caching utilities using cachetools.
"""

import time
import asyncio
from typing import Any, Optional, Callable, TypeVar, cast, Union
from functools import wraps
from cachetools import TTLCache, cached
from .config import settings
from .logging_config import get_logger

logger = get_logger(__name__)

# Type variable for generic function typing
F = TypeVar('F', bound=Callable[..., Any])

class CacheManager:
    """In-memory cache manager using cachetools"""
    
    def __init__(self, maxsize: int = 1000, ttl: int = 300):
        """Initialize the cache with max size and default TTL"""
        self._cache = TTLCache(maxsize=maxsize, ttl=ttl)
        logger.info("In-memory cache initialized")
    
    def is_available(self) -> bool:
        """Always return True as in-memory cache is always available"""
        return True
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            return self._cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """Set value in cache with optional expiration"""
        try:
            self._cache[key] = value
            if expire is not None:
                # cachetools doesn't support per-item TTL, so we'll store the expiry time
                # and check it in get()
                self._cache[f"_expiry_{key}"] = time.time() + expire
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            if key in self._cache:
                del self._cache[key]
                # Also clean up any expiry entry
                expiry_key = f"_expiry_{key}"
                if expiry_key in self._cache:
                    del self._cache[expiry_key]
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern (supports simple * wildcard)"""
        try:
            count = 0
            keys_to_delete = []
            
            # Convert pattern to startswith/endswith for simple patterns
            if pattern.endswith('*'):
                prefix = pattern[:-1]
                keys_to_delete = [k for k in self._cache if k.startswith(prefix)]
            elif pattern.startswith('*'):
                suffix = pattern[1:]
                keys_to_delete = [k for k in self._cache if k.endswith(suffix)]
            else:
                # Exact match
                if pattern in self._cache:
                    keys_to_delete = [pattern]
            
            # Delete the keys
            for key in keys_to_delete:
                del self._cache[key]
                count += 1
                
                # Also clean up any expiry entry
                if not key.startswith('_expiry_'):
                    expiry_key = f"_expiry_{key}"
                    if expiry_key in self._cache:
                        del self._cache[expiry_key]
                        
            return count
        except Exception as e:
            logger.error(f"Cache clear pattern error for {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            return key in self._cache
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

# Global cache instance (1000 items max, 5 minutes default TTL)
cache = CacheManager(maxsize=1000, ttl=300)

def cache_key(*parts: str) -> str:
    """Generate consistent cache key from parts"""
    return ":".join(str(part) for part in parts)

def cache_result(expire: int = 300, key_prefix: str = "") -> Callable[[F], F]:
    """Decorator for caching function results with TTL"""
    def decorator(func: F) -> F:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            key_parts = [key_prefix, func.__name__]
            
            # Add relevant args to key
            if args:
                key_parts.extend(str(arg) for arg in args)
            if kwargs:
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            
            cache_key_str = cache_key(*key_parts)
            
            # Check cache first
            cached_result = cache.get(cache_key_str)
            if cached_result is not None:
                # Check if the item has expired
                expiry_key = f"_expiry_{cache_key_str}"
                expiry_time = cache.get(expiry_key)
                if expiry_time is None or time.time() < expiry_time:
                    return cached_result
                # If expired, remove it
                cache.delete(cache_key_str)
            
            # Call function if not in cache or expired
            result = await func(*args, **kwargs)
            
            # Cache the result with TTL
            cache.set(cache_key_str, result)
            if expire is not None:
                cache.set(f"_expiry_{cache_key_str}", time.time() + expire)
            
            return result
        
        # For sync functions, use cachetools directly
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            key_parts = [key_prefix, func.__name__]
            if args:
                key_parts.extend(str(arg) for arg in args)
            if kwargs:
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
            
            cache_key_str = cache_key(*key_parts)
            
            # Check cache first
            cached_result = cache.get(cache_key_str)
            if cached_result is not None:
                # Check if the item has expired
                expiry_key = f"_expiry_{cache_key_str}"
                expiry_time = cache.get(expiry_key)
                if expiry_time is None or time.time() < expiry_time:
                    return cached_result
                # If expired, remove it
                cache.delete(cache_key_str)
            
            # Call function if not in cache or expired
            result = func(*args, **kwargs)
            
            # Cache the result with TTL
            cache.set(cache_key_str, result)
            if expire is not None:
                cache.set(f"_expiry_{cache_key_str}", time.time() + expire)
            
            return result
        
        # Return the appropriate wrapper based on whether the function is async
        if asyncio.iscoroutinefunction(func):
            return cast(F, async_wrapper)
        return cast(F, sync_wrapper)
    
        return wrapper
    return decorator

def invalidate_cache_pattern(pattern: str) -> bool:
    """Invalidate cache entries matching pattern"""
    try:
        deleted_count = cache.clear_pattern(pattern)
        logger.info(f"Invalidated {deleted_count} cache entries matching {pattern}")
        return deleted_count > 0
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return False

# Specific cache utilities for different data types
class CharacterCache:
    """Character-specific caching utilities"""
    
    @staticmethod
    def get_character_list_key(category: str = None, era: str = None, page: int = 1, limit: int = 12) -> str:
        """Generate cache key for character list"""
        parts = ["characters", "list"]
        if category:
            parts.append(f"cat:{category}")
        if era:
            parts.append(f"era:{era}")
        parts.extend([f"page:{page}", f"limit:{limit}"])
        return cache_key(*parts)
    
    @staticmethod
    def get_character_detail_key(character_id: Union[str, int]) -> str:
        """Generate cache key for character detail"""
        return cache_key("character", "detail", str(character_id))
    
    @staticmethod
    def get_search_key(query: str, category: str = None) -> str:
        """Generate cache key for search results"""
        parts = ["characters", "search", query]
        if category:
            parts.append(f"cat:{category}")
        return cache_key(*parts)
    
    @staticmethod
    def get_stats_key(character_id: Union[str, int] = None) -> str:
        """Generate cache key for statistics"""
        if character_id:
            return cache_key("stats", "character", str(character_id))
        return cache_key("stats", "overall")

class ProgressCache:
    """Progress-specific caching utilities"""
    
    @staticmethod
    def get_user_progress_key(user_id: int) -> str:
        """Generate cache key for user progress"""
        return cache_key("progress", "user", str(user_id))
    
    @staticmethod
    def get_character_progress_key(character_id: Union[str, int], user_id: int) -> str:
        """Generate cache key for character progress"""
        return cache_key("progress", "character", str(character_id), "user", str(user_id))

# Cache invalidation utilities
def invalidate_character_cache(character_id: Union[str, int] = None):
    """Invalidate character-related cache entries"""
    patterns = ["character:*"]
    if character_id:
        patterns.append(f"character:{character_id}:*")
    
    for pattern in patterns:
        invalidate_cache_pattern(pattern)

def invalidate_progress_cache(user_id: int = None, character_id: Union[str, int] = None):
    """Invalidate progress-related cache entries"""
    patterns = ["progress:*"]
    if user_id:
        patterns.append(f"progress:user:{user_id}:*")
    if character_id:
        patterns.append(f"progress:character:{character_id}:*")
    
    for pattern in patterns:
        invalidate_cache_pattern(pattern)
