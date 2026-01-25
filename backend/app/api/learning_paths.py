from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas
from ..database import get_db
from ..security import get_current_user

router = APIRouter(prefix="/api/learning-paths", tags=["learning_paths"])

@router.get("/", response_model=List[schemas.LearningPathResponse])
def get_learning_paths(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all available learning paths"""
    return db.query(models.LearningPath).filter(
        models.LearningPath.is_active == True
    ).order_by(
        models.LearningPath.sort_order
    ).offset(skip).limit(limit).all()

@router.get("/{path_id}/lessons", response_model=List[schemas.LessonResponse])
def get_path_lessons(
    path_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get lessons for a specific learning path"""
    path = db.query(models.LearningPath).filter(
        models.LearningPath.id == path_id,
        models.LearningPath.is_active == True
    ).first()
    
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    lessons = db.query(models.Lesson).filter(
        models.Lesson.path_id == path_id,
        models.Lesson.is_active == True
    ).order_by(
        models.Lesson.sort_order
    ).offset(skip).limit(limit).all()
    
    # Add user progress information
    for lesson in lessons:
        user_progress = db.query(models.UserLessonProgress).filter(
            models.UserLessonProgress.user_id == current_user.id,
            models.UserLessonProgress.lesson_id == lesson.id
        ).first()
        # You can add progress info to lesson response if needed
    
    return lessons

@router.get("/lessons/{lesson_id}", response_model=schemas.LessonDetailResponse)
def get_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get lesson details"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.is_active == True
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Get user progress for this lesson
    user_progress = db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id,
        models.UserLessonProgress.lesson_id == lesson_id
    ).first()
    
    return lesson

@router.get("/lessons/{lesson_id}/brief", response_model=schemas.LessonBrief)
def get_lesson_brief(
    lesson_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get lesson brief for pre-lesson display"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.is_active == True
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    character = None
    if lesson.character_id:
        character = db.query(models.IslamicCharacter).filter(
            models.IslamicCharacter.id == lesson.character_id
        ).first()
    
    return schemas.LessonBrief(
        id=lesson.id,
        title=lesson.title,
        arabic_title=lesson.arabic_title,
        description=lesson.description,
        duration=lesson.duration,
        has_quiz=lesson.has_quiz,
        character_name=character.name if character else None,
        character_arabic_name=character.arabic_name if character else None
    )

@router.post("/lessons/{lesson_id}/progress", response_model=schemas.UserLessonProgressResponse)
def update_lesson_progress(
    lesson_id: int,
    progress_data: schemas.UserLessonProgressUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update user lesson progress"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.is_active == True
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Get or create user progress
    user_progress = db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id,
        models.UserLessonProgress.lesson_id == lesson_id
    ).first()
    
    if not user_progress:
        user_progress = models.UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id
        )
        db.add(user_progress)
    
    # Update progress
    update_data = progress_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user_progress, field, value)
    
    # Mark as completed if score is provided and meets passing criteria
    if progress_data.score is not None and progress_data.score >= 70.0:
        user_progress.is_completed = True
        user_progress.completed_at = func.now()
        
        # Award XP to user
        xp_earned = 10  # Base XP for lesson completion
        if progress_data.score >= 90.0:
            xp_earned = 15  # Bonus XP for high scores
        
        current_user.add_xp(db, xp_earned)
    
    db.commit()
    db.refresh(user_progress)
    
    return user_progress

@router.post("/lessons/{lesson_id}/skip-quiz", response_model=schemas.SkipQuizResponse)
def skip_quiz(
    lesson_id: int,
    skip_request: schemas.SkipQuizRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Handle quiz skip functionality"""
    lesson = db.query(models.Lesson).filter(
        models.Lesson.id == lesson_id,
        models.Lesson.is_active == True
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Check if user has attempted quiz
    user_progress = db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id,
        models.UserLessonProgress.lesson_id == lesson_id
    ).first()
    
    if not user_progress:
        user_progress = models.UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id
        )
        db.add(user_progress)
    
    # Determine if user can skip based on attempts
    max_attempts = 3
    can_skip = skip_request.quiz_attempts >= max_attempts
    
    unlocked_lessons = []
    message = ""
    
    if can_skip:
        # Unlock next 2 lessons in the path
        next_lessons = db.query(models.Lesson).filter(
            models.Lesson.path_id == lesson.path_id,
            models.Lesson.sort_order > lesson.sort_order,
            models.Lesson.is_active == True
        ).limit(2).all()
        
        unlocked_lessons = [lesson.id for lesson in next_lessons]
        message = "تم تخطي الاختبار بنجاح! تم فتح الدرسين التاليين."
    else:
        message = f"يجب عليك المحاولة {max_attempts - skip_request.quiz_attempts} مرات أخرى قبل التخطي."
    
    return schemas.SkipQuizResponse(
        can_skip=can_skip,
        unlocked_lessons=unlocked_lessons,
        message=message
    )

@router.post("/select-path/{path_id}")
def select_learning_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Select a learning path for the user"""
    path = db.query(models.LearningPath).filter(
        models.LearningPath.id == path_id,
        models.LearningPath.is_active == True
    ).first()
    
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    
    current_user.selected_path = path.name
    db.commit()
    
    return {"message": f"تم اختيار مسار التعلم: {path.arabic_name}"}

@router.get("/companion-characters", response_model=List[schemas.CompanionCharacterResponse])
def get_companion_characters(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get available companion characters"""
    return db.query(models.CompanionCharacter).filter(
        models.CompanionCharacter.is_active == True
    ).all()

@router.post("/select-companion/{companion_id}")
def select_companion_character(
    companion_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Select a companion character for the user"""
    companion = db.query(models.CompanionCharacter).filter(
        models.CompanionCharacter.id == companion_id,
        models.CompanionCharacter.is_active == True
    ).first()
    
    if not companion:
        raise HTTPException(status_code=404, detail="Companion character not found")
    
    current_user.companion_character_id = companion_id
    db.commit()
    
    return {"message": f"تم اختيار المرافق: {companion.arabic_name}"}

@router.get("/my-progress", response_model=List[schemas.UserLessonProgressResponse])
def get_my_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get current user's lesson progress"""
    return db.query(models.UserLessonProgress).filter(
        models.UserLessonProgress.user_id == current_user.id
    ).order_by(
        models.UserLessonProgress.created_at.desc()
    ).all()
