"""
Content Pipeline API
Handles the complete content creation lifecycle from idea to publishing
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import os

from ..database import get_db
from ..models import (
    User, TeamMember, Role, Script, Illustration, VoiceRecording, Animation, 
    ContentProduction, ContentTemplate, PublishingPlatform, Publication
)
from ..security import get_current_user
from .admin import has_permission

router = APIRouter()

# Content Production Management
@router.post("/productions", response_model=dict)
async def create_content_production(
    production_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new content production project
    """
    # Check permissions
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "CREATE_CHARACTER"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # Create content production
    production = ContentProduction(
        title=production_data["title"],
        description=production_data.get("description"),
        content_type=production_data.get("content_type", "character_story"),
        character_id=production_data.get("character_id"),
        project_manager_id=team_member.id,
        start_date=datetime.now(),
        target_completion=datetime.now() + timedelta(days=30),
        estimated_budget=production_data.get("estimated_budget"),
        target_audience=production_data.get("target_audience"),
        tags=production_data.get("tags", [])
    )
    
    db.add(production)
    db.commit()
    db.refresh(production)
    
    # Create initial task for script writing
    from .admin import Task
    script_task = Task(
        title=f"Write script for {production.title}",
        description="Create initial script based on character story",
        task_type="script_writing",
        status="pending",
        priority="high",
        character_id=production.character_id,
        created_by_id=team_member.id,
        due_date=datetime.now() + timedelta(days=7)
    )
    
    db.add(script_task)
    db.commit()
    
    return {
        "message": "Content production created successfully",
        "production_id": production.id,
        "task_id": script_task.id
    }

@router.get("/productions", response_model=List[dict])
async def get_content_productions(
    status: Optional[str] = None,
    character_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all content productions with filtering
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=403, detail="User is not a team member")
    
    query = db.query(ContentProduction)
    
    if status:
        query = query.filter(ContentProduction.overall_status == status)
    if character_id:
        query = query.filter(ContentProduction.character_id == character_id)
    
    productions = query.all()
    
    result = []
    for production in productions:
        result.append({
            "id": production.id,
            "title": production.title,
            "description": production.description,
            "content_type": production.content_type,
            "character_id": production.character_id,
            "current_stage": production.current_stage,
            "overall_status": production.overall_status,
            "completion_percentage": production.completion_percentage,
            "start_date": production.start_date,
            "target_completion": production.target_completion,
            "project_manager": production.project_manager.user.full_name if production.project_manager else None
        })
    
    return result

# Script Management
@router.post("/scripts", response_model=dict)
async def create_script(
    script_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new script
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "CREATE_SCRIPT"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    script = Script(
        title=script_data["title"],
        content=script_data["content"],
        summary=script_data.get("summary"),
        character_id=script_data.get("character_id"),
        content_type=script_data.get("content_type", "character_story"),
        target_audience=script_data.get("target_audience"),
        estimated_duration=script_data.get("estimated_duration"),
        difficulty_level=script_data.get("difficulty_level", "medium"),
        written_by_id=team_member.id,
        word_count=len(script_data["content"].split()),
        reading_time=script_data.get("reading_time", len(script_data["content"].split()) // 200)  # avg reading speed
    )
    
    db.add(script)
    db.commit()
    db.refresh(script)
    
    # Update production status if linked
    if script.character_id:
        production = db.query(ContentProduction).filter(
            ContentProduction.character_id == script.character_id,
            ContentProduction.overall_status == "in_production"
        ).first()
        
        if production:
            production.current_stage = "scripting"
            production.script_id = script.id
            production.script_writer_id = team_member.id
            db.commit()
    
    return {
        "message": "Script created successfully",
        "script_id": script.id
    }

@router.put("/scripts/{script_id}/submit-review")
async def submit_script_for_review(
    script_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit script for review
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    if script.written_by_id != team_member.id:
        raise HTTPException(status_code=403, detail="Can only submit own scripts")
    
    script.status = "pending_review"
    script.submitted_for_review = datetime.now()
    db.commit()
    
    return {"message": "Script submitted for review"}

@router.post("/scripts/{script_id}/approve")
async def approve_script(
    script_id: int,
    approval_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve a script
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "APPROVE_SCRIPT"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    
    script.status = "approved"
    script.reviewed_by_id = team_member.id
    script.approved_by_id = team_member.id
    script.approval_notes = approval_data.get("notes", "")
    script.approved_at = datetime.now()
    
    # Update production status
    if script.character_id:
        production = db.query(ContentProduction).filter(
            ContentProduction.character_id == script.character_id
        ).first()
        
        if production:
            production.current_stage = "drawing"
            production.completion_percentage = 20.0  # Script completed
            db.commit()
    
    db.commit()
    
    return {"message": "Script approved successfully"}

# Illustration Management
@router.post("/illustrations", response_model=dict)
async def create_illustration(
    illustration_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new illustration
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "UPLOAD_ANIMATION"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    illustration = Illustration(
        title=illustration_data["title"],
        description=illustration_data.get("description"),
        scene_description=illustration_data.get("scene_description"),
        script_id=illustration_data["script_id"],
        scene_number=illustration_data.get("scene_number"),
        illustration_type=illustration_data.get("illustration_type", "character"),
        art_style=illustration_data.get("art_style"),
        color_scheme=illustration_data.get("color_scheme"),
        illustrated_by_id=team_member.id
    )
    
    db.add(illustration)
    db.commit()
    db.refresh(illustration)
    
    return {
        "message": "Illustration created successfully",
        "illustration_id": illustration.id
    }

@router.post("/illustrations/{illustration_id}/upload")
async def upload_illustration_file(
    illustration_id: int,
    file: UploadFile = File(...),
    file_type: str = Form(...),  # sketch, final, thumbnail
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload illustration file
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    illustration = db.query(Illustration).filter(Illustration.id == illustration_id).first()
    if not illustration:
        raise HTTPException(status_code=404, detail="Illustration not found")
    
    if illustration.illustrated_by_id != team_member.id:
        raise HTTPException(status_code=403, detail="Can only upload own illustrations")
    
    # Save file
    upload_dir = "backend/static/illustrations"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/illustration_{illustration_id}_{file_type}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Update illustration record
    if file_type == "sketch":
        illustration.sketch_file = file_path
        illustration.status = "sketch_uploaded"
    elif file_type == "final":
        illustration.final_file = file_path
        illustration.status = "completed"
        illustration.completed_at = datetime.now()
    elif file_type == "thumbnail":
        illustration.thumbnail = file_path
    
    db.commit()
    
    return {"message": f"{file_type} file uploaded successfully", "file_path": file_path}

# Voice Recording Management
@router.post("/voice-recordings", response_model=dict)
async def create_voice_recording(
    recording_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new voice recording session
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "UPLOAD_VOICE"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    recording = VoiceRecording(
        title=recording_data["title"],
        script_text=recording_data["script_text"],
        script_id=recording_data["script_id"],
        scene_number=recording_data.get("scene_number"),
        voice_style=recording_data.get("voice_style"),
        tone=recording_data.get("tone"),
        language=recording_data.get("language", "ar"),
        voice_artist_id=team_member.id
    )
    
    db.add(recording)
    db.commit()
    db.refresh(recording)
    
    return {
        "message": "Voice recording session created",
        "recording_id": recording.id
    }

@router.post("/voice-recordings/{recording_id}/upload")
async def upload_voice_file(
    recording_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload voice recording file
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    recording = db.query(VoiceRecording).filter(VoiceRecording.id == recording_id).first()
    if not recording:
        raise HTTPException(status_code=404, detail="Voice recording not found")
    
    if recording.voice_artist_id != team_member.id:
        raise HTTPException(status_code=403, detail="Can only upload own recordings")
    
    # Save file
    upload_dir = "backend/static/audio/voice_recordings"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/voice_{recording_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Update recording record
    recording.audio_file = file_path
    recording.status = "recorded"
    recording.recorded_at = datetime.now()
    recording.file_size = len(content)
    
    db.commit()
    
    return {"message": "Voice file uploaded successfully", "file_path": file_path}

# Animation Management
@router.post("/animations", response_model=dict)
async def create_animation(
    animation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new animation project
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "UPLOAD_ANIMATION"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    animation = Animation(
        title=animation_data["title"],
        description=animation_data.get("description"),
        script_id=animation_data["script_id"],
        scene_number=animation_data.get("scene_number"),
        animation_type=animation_data.get("animation_type", "2d"),
        style=animation_data.get("style"),
        animator_id=team_member.id
    )
    
    db.add(animation)
    db.commit()
    db.refresh(animation)
    
    return {
        "message": "Animation project created",
        "animation_id": animation.id
    }

@router.post("/animations/{animation_id}/upload")
async def upload_animation_file(
    animation_id: int,
    file: UploadFile = File(...),
    file_type: str = Form(...),  # storyboard, preview, final
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload animation file
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    animation = db.query(Animation).filter(Animation.id == animation_id).first()
    if not animation:
        raise HTTPException(status_code=404, detail="Animation not found")
    
    if animation.animator_id != team_member.id:
        raise HTTPException(status_code=403, detail="Can only upload own animations")
    
    # Save file
    upload_dir = "backend/static/animations"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/animation_{animation_id}_{file_type}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Update animation record
    if file_type == "storyboard":
        animation.storyboard_file = file_path
        animation.status = "storyboard_uploaded"
    elif file_type == "preview":
        animation.preview_file = file_path
        animation.status = "in_progress"
    elif file_type == "final":
        animation.animation_file = file_path
        animation.status = "completed"
        animation.completed_at = datetime.now()
    
    animation.file_size = len(content)
    db.commit()
    
    return {"message": f"{file_type} file uploaded successfully", "file_path": file_path}

# Publishing Management
@router.post("/productions/{production_id}/publish")
async def publish_content(
    production_id: int,
    publishing_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Publish content production
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member or not has_permission(team_member.role, "APPROVE_ANIMATION"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    production = db.query(ContentProduction).filter(
        ContentProduction.id == production_id
    ).first()
    
    if not production:
        raise HTTPException(status_code=404, detail="Content production not found")
    
    # Update production status
    production.overall_status = "published"
    production.completion_percentage = 100.0
    production.published_at = datetime.now()
    production.publish_platforms = publishing_data.get("platforms", [])
    
    # Create publication records
    publications = []
    for platform in publishing_data.get("platforms", []):
        publication = Publication(
            title=production.title,
            description=production.description,
            content_production_id=production.id,
            platform_id=platform.get("id"),
            published_url=platform.get("url"),
            publish_date=datetime.now()
        )
        
        db.add(publication)
        publications.append(publication)
    
    db.commit()
    
    return {
        "message": "Content published successfully",
        "publication_count": len(publications)
    }

@router.get("/productions/{production_id}/pipeline")
async def get_production_pipeline(
    production_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get complete pipeline status for a production
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id
    ).first()
    
    if not team_member:
        raise HTTPException(status_code=403, detail="User is not a team member")
    
    production = db.query(ContentProduction).filter(
        ContentProduction.id == production_id
    ).first()
    
    if not production:
        raise HTTPException(status_code=404, detail="Content production not found")
    
    # Get all related content
    script = None
    if production.script_id:
        script = db.query(Script).filter(Script.id == production.script_id).first()
    
    illustrations = []
    if script:
        illustrations = db.query(Illustration).filter(
            Illustration.script_id == script.id
        ).all()
    
    voice_recordings = []
    if script:
        voice_recordings = db.query(VoiceRecording).filter(
            VoiceRecording.script_id == script.id
        ).all()
    
    animations = []
    if script:
        animations = db.query(Animation).filter(
            Animation.script_id == script.id
        ).all()
    
    return {
        "production": {
            "id": production.id,
            "title": production.title,
            "current_stage": production.current_stage,
            "completion_percentage": production.completion_percentage,
            "overall_status": production.overall_status
        },
        "pipeline": {
            "script": {
                "status": script.status if script else "not_started",
                "completed_at": script.approved_at if script else None,
                "writer": script.writer.user.full_name if script and script.writer else None
            },
            "illustration": {
                "status": "completed" if illustrations else "not_started",
                "count": len(illustrations),
                "completed_count": len([i for i in illustrations if i.status == "completed"])
            },
            "voice": {
                "status": "completed" if voice_recordings else "not_started", 
                "count": len(voice_recordings),
                "completed_count": len([v for v in voice_recordings if v.status == "recorded"])
            },
            "animation": {
                "status": "completed" if animations else "not_started",
                "count": len(animations),
                "completed_count": len([a for a in animations if a.status == "completed"])
            }
        }
    }
