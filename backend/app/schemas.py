from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class CategoryEnum(str, Enum):
    PROPHETS = "الأنبياء"
    COMPANIONS = "الصحابة"
    FOLLOWERS = "التابعون"
    SCHOLARS = "العلماء"
    WOMEN = "النساء الصالحات"
    LEADERS = "القادة"

class EraEnum(str, Enum):
    PRE_ISLAM = "ما قبل الإسلام"
    PROPHET_ERA = "عصر النبوة"
    RIGHTLY_GUIDED = "الخلافة الراشدة"
    UMAYYAD = "الدولة الأموية"
    ABBASID = "الدولة العباسية"
    OTTOMAN = "الدولة العثمانية"

# Character Schemas
class CharacterBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    arabic_name: str = Field(..., min_length=2, max_length=200)
    title: Optional[str] = None
    description: Optional[str] = None
    category: CategoryEnum
    era: EraEnum

class CharacterCreate(CharacterBase):
    full_story: str
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    key_achievements: List[str] = []
    lessons: List[str] = []
    quotes: List[str] = []
    timeline_events: List[Dict[str, Any]] = []

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    arabic_name: Optional[str] = None
    description: Optional[str] = None
    is_featured: Optional[bool] = None

class CharacterResponse(BaseModel):
    id: int
    name: str
    arabic_name: str
    english_name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    era: str
    category: str
    sub_category: Optional[str] = None
    slug: str
    profile_image: Optional[str] = None
    views_count: int
    likes_count: int
    shares_count: int
    is_featured: bool
    is_verified: bool
    verification_source: Optional[str] = None
    verification_notes: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class CharacterDetailResponse(CharacterResponse):
    full_story: str
    key_achievements: List[str]
    lessons: List[str]
    quotes: List[str]
    timeline_events: List[Dict[str, Any]]
    birth_year: Optional[int] = None
    death_year: Optional[int] = None
    birth_place: Optional[str] = None
    death_place: Optional[str] = None
    related_characters: List[int] = []
    gallery: List[str] = []
    audio_stories: List[str] = []
    animations: List[Dict[str, Any]] = []
    is_verified: bool
    verification_source: Optional[str] = None

# User Progress Schemas
class ProgressBase(BaseModel):
    character_id: int
    current_chapter: int = 0
    completion_percentage: float = Field(0.0, ge=0.0, le=100.0)

class ProgressCreate(ProgressBase):
    pass

class ProgressUpdate(BaseModel):
    current_chapter: Optional[int] = None
    completion_percentage: Optional[float] = None
    bookmarked: Optional[bool] = None
    notes: Optional[str] = None
    rating: Optional[int] = Field(None, ge=1, le=5)

class ProgressResponse(ProgressBase):
    id: int
    user_id: int
    is_completed: bool
    bookmarked: bool
    started_at: datetime
    time_spent: int
    
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    total_stories_completed: int
    streak_days: int
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# Level and Quiz Schemas
class LevelBase(BaseModel):
    name: str
    description: Optional[str] = None
    xp_required: int = Field(..., gt=0)
    badge_icon: Optional[str] = None
    color: Optional[str] = None
    sort_order: int = 0

class LevelCreate(LevelBase):
    pass

class LevelResponse(LevelBase):
    id: int
    
    class Config:
        from_attributes = True

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int  # index of the correct answer in options
    explanation: Optional[str] = None

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    level_id: int
    questions: List[QuizQuestion]
    passing_score: float = 70.0
    time_limit: Optional[int] = None  # in minutes
    is_active: bool = True

class QuizCreate(QuizBase):
    pass

class QuizResponse(QuizBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class QuizAnswers(BaseModel):
    answers: List[int]  # List of answer indices

class QuizCompletionResult(BaseModel):
    quiz_id: int
    score: float
    passed: bool
    xp_earned: int
    leveled_up: bool
    new_level: Optional[LevelResponse] = None

class UserLevelInfo(BaseModel):
    current_level: LevelResponse
    current_xp: int
    next_level: Optional[LevelResponse] = None
    xp_to_next_level: int
    progress_percentage: int

# Statistics Schemas
class StatsResponse(BaseModel):
    total_characters: int
    total_users: int
    total_stories_completed: int
    most_viewed_characters: List[Dict[str, Any]]
    daily_active_users: int
    weekly_lessons_completed: int

# Companion Character Schemas
class CompanionCharacterBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    arabic_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    animation_url: Optional[str] = None
    is_active: bool = True

class CompanionCharacterCreate(CompanionCharacterBase):
    pass

class CompanionCharacterResponse(CompanionCharacterBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Learning Path Schemas
class LearningPathBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    arabic_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    cover_image: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class LearningPathCreate(LearningPathBase):
    pass

class LearningPathResponse(LearningPathBase):
    id: int
    
    class Config:
        from_attributes = True

# Lesson Schemas
class LessonBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    arabic_title: Optional[str] = None
    description: Optional[str] = None
    content: Dict[str, Any]  # JSON structure for lesson content
    duration: Optional[int] = None  # in minutes
    has_quiz: bool = False
    sort_order: int = 0
    is_active: bool = True

class LessonCreate(LessonBase):
    path_id: int
    character_id: Optional[int] = None

class LessonResponse(LessonBase):
    id: int
    path_id: int
    character_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class LessonDetailResponse(LessonResponse):
    path: Optional[LearningPathResponse] = None
    character: Optional[CharacterResponse] = None

# User Lesson Progress Schemas
class UserLessonProgressBase(BaseModel):
    lesson_id: int
    is_completed: bool = False
    score: Optional[float] = None
    time_spent: int = 0  # in seconds

class UserLessonProgressCreate(UserLessonProgressBase):
    pass

class UserLessonProgressUpdate(BaseModel):
    is_completed: Optional[bool] = None
    score: Optional[float] = None
    time_spent: Optional[int] = None

class UserLessonProgressResponse(UserLessonProgressBase):
    id: int
    user_id: int
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Updated User Schemas with new fields
class UserResponseExtended(UserResponse):
    is_guest: bool
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None
    selected_character_id: Optional[int] = None
    achievements: List[Dict[str, Any]] = []
    badges: List[Dict[str, Any]] = []
    current_xp: int
    level_id: int
    companion_character: Optional[CompanionCharacterResponse] = None

class UserUpdateExtended(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None
    selected_character_id: Optional[int] = None

# User Registration with additional fields
class UserRegisterExtended(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    gender: Optional[str] = None  # "male" or "female"
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None

# Lesson Brief Schema (for pre-lesson display)
class LessonBrief(BaseModel):
    id: int
    title: str
    arabic_title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[int] = None  # in minutes
    has_quiz: bool = False
    character_name: Optional[str] = None
    character_arabic_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# Skip Quiz Request
class SkipQuizRequest(BaseModel):
    lesson_id: int
    quiz_attempts: int = 0

# Skip Quiz Response
class SkipQuizResponse(BaseModel):
    can_skip: bool
    unlocked_lessons: List[int] = []
    message: str