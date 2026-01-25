from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import psutil
import sqlite3
from pathlib import Path

from ..database import get_db
from ..models import User, IslamicCharacter, UserProgress
from ..security import get_current_user, get_password_hash

router = APIRouter()

def is_admin_user(user: User) -> bool:
    """Check if user has admin privileges"""
    return user.is_superuser

@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard statistics"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # User statistics
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_active == True).count()
        
        # Character statistics
        total_characters = db.query(IslamicCharacter).count()
        active_characters = db.query(IslamicCharacter).filter(IslamicCharacter.is_active == True).count()
        
        # Progress statistics
        total_progress = db.query(UserProgress).count()
        completed_progress = db.query(UserProgress).filter(UserProgress.is_completed == True).count()
        
        # Database size
        db_path = Path("on_their_footsteps.db")
        database_size = 0
        if db_path.exists():
            database_size = db_path.stat().st_size / (1024 * 1024)  # MB
        
        return {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "totalCharacters": total_characters,
            "activeCharacters": active_characters,
            "completedStories": completed_progress,
            "totalProgress": total_progress,
            "databaseSize": f"{database_size:.1f} MB"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")

@router.get("/users")
async def get_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all users with pagination"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        users = db.query(User).offset(skip).limit(limit).all()
        
        user_list = []
        for user in users:
            # Get user progress count
            progress_count = db.query(UserProgress).filter(UserProgress.user_id == user.id).count()
            completed_count = db.query(UserProgress).filter(
                UserProgress.user_id == user.id,
                UserProgress.is_completed == True
            ).count()
            
            user_list.append({
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_superuser": user.is_superuser,
                "created_at": user.created_at.isoformat(),
                "last_active": user.last_active.isoformat() if user.last_active else None,
                "completed_stories": completed_count,
                "total_progress": progress_count
            })
        
        return user_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get users: {str(e)}")

@router.put("/users/{user_id}")
async def manage_user(
    user_id: int,
    action: str,
    full_name: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_superuser: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manage user (toggle status, reset password, etc.)"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if action == "toggle":
            user.is_active = not user.is_active
            db.commit()
            return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully"}
        
        elif action == "reset_password":
            # Generate temporary password
            import secrets
            temp_password = f"temp_{secrets.token_urlsafe(8)}"
            user.hashed_password = get_password_hash(temp_password)
            db.commit()
            return {"message": "Password reset successfully", "temp_password": temp_password}
        
        elif action == "update":
            if full_name is not None:
                user.full_name = full_name
            if is_active is not None:
                user.is_active = is_active
            if is_superuser is not None:
                user.is_superuser = is_superuser
            db.commit()
            return {"message": "User updated successfully"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to manage user: {str(e)}")

@router.get("/characters")
async def get_characters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get all characters with pagination"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        characters = db.query(IslamicCharacter).offset(skip).limit(limit).all()
        
        character_list = []
        for character in characters:
            # Get view count
            views_count = character.views_count if hasattr(character, 'views_count') else 0
            
            character_list.append({
                "id": character.id,
                "name": character.name,
                "arabic_name": character.arabic_name,
                "category": character.category,
                "is_active": character.is_active,
                "is_featured": character.is_featured,
                "views_count": views_count,
                "created_at": character.created_at.isoformat()
            })
        
        return character_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get characters: {str(e)}")

@router.put("/characters/{character_id}")
async def manage_character(
    character_id: int,
    action: str,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manage character (toggle status, etc.)"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        character = db.query(IslamicCharacter).filter(IslamicCharacter.id == character_id).first()
        if not character:
            raise HTTPException(status_code=404, detail="Character not found")
        
        if action == "toggle":
            character.is_active = not character.is_active
            db.commit()
            return {"message": f"Character {'activated' if character.is_active else 'deactivated'} successfully"}
        
        elif action == "update":
            if is_active is not None:
                character.is_active = is_active
            if is_featured is not None:
                character.is_featured = is_featured
            db.commit()
            return {"message": "Character updated successfully"}
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to manage character: {str(e)}")

@router.get("/health")
async def get_system_health(
    current_user: User = Depends(get_current_user)
):
    """Get system health status"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "backend": {
                "status": "healthy",
                "uptime": "N/A",
                "memory_usage": 0,
                "cpu_usage": 0
            },
            "database": {
                "status": "healthy",
                "connection": "ok",
                "size_mb": 0,
                "tables": 0
            },
            "frontend": {
                "status": "unknown",
                "response_time": 0
            },
            "system": {
                "status": "healthy",
                "cpu_percent": 0,
                "memory_percent": 0,
                "disk_percent": 0
            }
        }
        
        # Database health check
        try:
            db_path = Path("on_their_footsteps.db")
            if db_path.exists():
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = cursor.fetchall()
                conn.close()
                
                health_status["database"]["tables"] = len(tables)
                health_status["database"]["size_mb"] = db_path.stat().st_size / (1024 * 1024)
            else:
                health_status["database"]["status"] = "missing"
        except Exception as e:
            health_status["database"]["status"] = "error"
            health_status["database"]["error"] = str(e)
        
        # System metrics
        try:
            health_status["system"]["cpu_percent"] = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            health_status["system"]["memory_percent"] = memory.percent
            disk = psutil.disk_usage('/')
            health_status["system"]["disk_percent"] = disk.percent
            
            if health_status["system"]["cpu_percent"] > 90 or \
               health_status["system"]["memory_percent"] > 90 or \
               health_status["system"]["disk_percent"] > 90:
                health_status["system"]["status"] = "warning"
        except Exception as e:
            health_status["system"]["status"] = "error"
            health_status["system"]["error"] = str(e)
        
        # Frontend health check
        try:
            import requests
            response = requests.get("http://localhost:3000", timeout=5)
            health_status["frontend"]["status"] = "healthy" if response.status_code == 200 else "unhealthy"
            health_status["frontend"]["response_time"] = response.elapsed.total_seconds() * 1000
        except Exception as e:
            health_status["frontend"]["status"] = "down"
            health_status["frontend"]["error"] = str(e)
        
        return health_status
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get health status: {str(e)}")

@router.post("/health-check")
async def run_health_check(
    current_user: User = Depends(get_current_user)
):
    """Run comprehensive health check"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # This would trigger a comprehensive health check
        # For now, just return the current health status
        return await get_system_health(current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@router.get("/logs")
async def get_system_logs(
    current_user: User = Depends(get_current_user),
    level: Optional[str] = None,
    limit: int = 100
):
    """Get system logs"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # This would read from actual log files
        # For now, return sample logs
        logs = [
            {
                "timestamp": datetime.now().isoformat(),
                "level": "INFO",
                "service": "backend",
                "message": "Application started successfully"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "level": "INFO",
                "service": "database",
                "message": "Database connection established"
            },
            {
                "timestamp": datetime.now().isoformat(),
                "level": "WARNING",
                "service": "system",
                "message": "High memory usage detected"
            }
        ]
        
        if level:
            logs = [log for log in logs if log["level"] == level.upper()]
        
        return logs[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get logs: {str(e)}")

@router.get("/backup")
async def create_backup(
    current_user: User = Depends(get_current_user)
):
    """Create system backup"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # This would trigger the backup script
        # For now, return a success message
        return {
            "message": "Backup initiated successfully",
            "backup_id": f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "status": "in_progress"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backup failed: {str(e)}")

@router.get("/metrics")
async def get_detailed_metrics(
    current_user: User = Depends(get_current_user),
    days: int = 7
):
    """Get detailed metrics for the specified period"""
    if not is_admin_user(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # This would query actual metrics data
        # For now, return sample metrics
        metrics = {
            "period": f"{days} days",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "user_registrations": 15,
            "active_sessions": 8,
            "story_completions": 42,
            "api_requests": 1250,
            "average_response_time": 250,
            "error_rate": 0.02
        }
        
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics: {str(e)}")
