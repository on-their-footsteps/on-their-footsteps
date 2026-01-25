from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app import models, schemas
from app.security import get_current_active_user

router = APIRouter(prefix="/api/levels", tags=["levels"])

@router.get("/", response_model=List[schemas.Level])
async def get_levels(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all available levels"""
    levels = db.query(models.Level).order_by(models.Level.xp_required).offset(skip).limit(limit).all()
    return levels

@router.get("/{level_id}", response_model=schemas.Level)
async def get_level(level_id: int, db: Session = Depends(get_db)):
    """Get details of a specific level"""
    level = db.query(models.Level).filter(models.Level.id == level_id).first()
    if not level:
        raise HTTPException(status_code=404, detail="Level not found")
    return level

@router.get("/user/current", response_model=schemas.UserLevelInfo)
async def get_user_level(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's level and progress"""
    next_level = db.query(models.Level).filter(
        models.Level.xp_required > current_user.current_xp
    ).order_by(models.Level.xp_required).first()
    
    current_level = current_user.level
    xp_to_next_level = next_level.xp_required - current_user.current_xp if next_level else 0
    
    return {
        "current_level": current_level,
        "current_xp": current_user.current_xp,
        "next_level": next_level,
        "xp_to_next_level": xp_to_next_level,
        "progress_percentage": min(100, int((current_user.current_xp / next_level.xp_required) * 100)) if next_level else 100
    }

@router.post("/complete-quiz/{quiz_id}", response_model=schemas.QuizCompletionResult)
async def complete_quiz(
    quiz_id: int,
    answers: schemas.QuizAnswers,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Complete a quiz and update user's progress"""
    # Get the quiz
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz or not quiz.is_active:
        raise HTTPException(status_code=404, detail="Quiz not found or inactive")
    
    # Check if user already completed this quiz
    existing_completion = db.query(models.UserQuizAssociation).filter(
        models.UserQuizAssociation.user_id == current_user.id,
        models.UserQuizAssociation.quiz_id == quiz_id
    ).first()
    
    if existing_completion:
        raise HTTPException(status_code=400, detail="Quiz already completed")
    
    # Calculate score
    total_questions = len(quiz.questions)
    correct_answers = 0
    
    for i, question in enumerate(quiz.questions):
        if i < len(answers.answers) and question["correct_answer"] == answers.answers[i]:
            correct_answers += 1
    
    score = (correct_answers / total_questions) * 100
    passed = score >= quiz.passing_score
    
    # Record quiz completion
    completion = models.UserQuizAssociation(
        user_id=current_user.id,
        quiz_id=quiz_id,
        score=score,
        passed=passed,
        completed_at=datetime.utcnow()
    )
    
    # Award XP if passed
    xp_earned = 0
    if passed:
        xp_earned = quiz.level.xp_required // 10  # 10% of level's XP requirement
        leveled_up = current_user.add_xp(db, xp_earned)
    
    db.add(completion)
    db.commit()
    db.refresh(current_user)
    
    return {
        "quiz_id": quiz_id,
        "score": score,
        "passed": passed,
        "xp_earned": xp_earned,
        "leveled_up": leveled_up if passed else False,
        "new_level": current_user.level if passed and leveled_up else None
    }
