from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, Boolean, ForeignKey, Float, CheckConstraint, Index, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, and_
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, validator
from .database import Base

class IslamicCharacter(Base):
    __tablename__ = "islamic_characters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    arabic_name = Column(String(200), nullable=False)
    english_name = Column(String(200))
    
    # Basic Info
    title = Column(String(300))
    description = Column(Text)
    birth_year = Column(Integer)
    death_year = Column(Integer)
    era = Column(String(100), index=True)
    category = Column(String(100), index=True)  # نبي، صحابي، تابعي، عالم
    sub_category = Column(String(100))  # خليفة، قائد، فقيه
    slug = Column(String(200), unique=True, index=True)  # URL-friendly identifier
    
    # Content
    full_story = Column(Text)
    key_achievements = Column(JSON)
    lessons = Column(JSON)
    quotes = Column(JSON)
    
    # Media
    profile_image = Column(String(500))
    gallery = Column(JSON)  # List of image URLs
    audio_stories = Column(JSON)  # List of audio URLs
    animations = Column(JSON)  # List of animation data
    
    # Timeline
    timeline_events = Column(JSON)
    
    # Location
    birth_place = Column(String(200))
    death_place = Column(String(200))
    locations = Column(JSON)  # Important locations
    
    # Relationships
    related_characters = Column(JSON)  # IDs of related characters
    
    # Statistics
    views_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    
    # Metadata
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    verification_source = Column(String(500))
    verification_notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    progress_records = relationship("UserProgress", back_populates="character")

# Association table for many-to-many relationship between users and completed quizzes
user_quiz_association = Table(
    'user_quiz_association',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('quiz_id', Integer, ForeignKey('quizzes.id'), primary_key=True),
    Column('completed_at', DateTime(timezone=True), server_default=func.now()),
    Column('score', Float),
    Column('passed', Boolean)
)

class Level(Base):
    __tablename__ = "levels"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    xp_required = Column(Integer, nullable=False, default=0)
    badge_icon = Column(String(200))
    color = Column(String(20))
    sort_order = Column(Integer, default=0)
    
    # Relationships
    users = relationship("User", back_populates="level")
    quizzes = relationship("Quiz", back_populates="level")

class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    level_id = Column(Integer, ForeignKey("levels.id"), nullable=False)
    questions = Column(JSON, nullable=False)  # List of question objects
    passing_score = Column(Float, default=70.0)  # Percentage
    time_limit = Column(Integer)  # in minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    level = relationship("Level", back_populates="quizzes")
    users = relationship("User", secondary=user_quiz_association, back_populates="completed_quizzes")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    full_name = Column(String(200))
    
    # Authentication
    hashed_password = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_guest = Column(Boolean, default=False)
    
    # Preferences
    language = Column(String(10), default="ar")
    theme = Column(String(20), default="light")
    notification_settings = Column(JSON)
    
    # Learning preferences
    companion_character_id = Column(Integer, ForeignKey("companion_characters.id"))
    selected_path = Column(String(50))
    selected_character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    
    # Gamification
    achievements = Column(JSON, default=list)
    badges = Column(JSON, default=list)
    
    # Progress tracking
    total_stories_completed = Column(Integer, default=0)
    total_time_spent = Column(Integer, default=0)  # in minutes
    streak_days = Column(Integer, default=0)
    
    # Level system
    current_xp = Column(Integer, default=0)
    level_id = Column(Integer, ForeignKey("levels.id"), default=1)
    daily_streak = Column(Integer, default=0)
    last_active_date = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    progress_records = relationship("UserProgress", back_populates="user")
    level = relationship("Level", back_populates="users")
    completed_quizzes = relationship("Quiz", secondary=user_quiz_association, back_populates="users")
    companion_character = relationship("CompanionCharacter", back_populates="users")
    lesson_progress = relationship("UserLessonProgress", back_populates="user")
    
    def can_level_up(self, db) -> bool:
        if not self.level:
            return True
        next_level = db.query(Level).filter(Level.xp_required > self.current_xp).order_by(Level.xp_required).first()
        return next_level is not None and self.current_xp >= next_level.xp_required
    
    def add_xp(self, db, xp_amount: int) -> bool:
        """Add XP to user and level up if conditions are met"""
        self.current_xp += xp_amount
        
        # Check for level up
        next_level = db.query(Level).filter(
            Level.xp_required > (db.query(Level.xp_required)
                               .filter(Level.id == self.level_id)
                               .scalar_subquery())
        ).order_by(Level.xp_required).first()
        
        leveled_up = False
        if next_level and self.current_xp >= next_level.xp_required:
            self.level_id = next_level.id
            leveled_up = True
            
        return leveled_up, self.level_id

class UserProgress(Base):
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    character_id = Column(Integer, ForeignKey("islamic_characters.id"), index=True)
    
    # Progress tracking
    current_chapter = Column(Integer, default=0)
    total_chapters = Column(Integer)
    completion_percentage = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    
    # Interaction
    bookmarked = Column(Boolean, default=False)
    notes = Column(Text)
    rating = Column(Integer)  # 1-5 stars
    last_position = Column(Integer)  # For audio/video
    
    # Time tracking
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    time_spent = Column(Integer, default=0)  # in seconds
    
    # Relationships
    user = relationship("User", back_populates="progress_records")
    character = relationship("IslamicCharacter", back_populates="progress_records")

class ContentCategory(Base):
    __tablename__ = "content_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    arabic_name = Column(String(100))
    description = Column(Text)
    icon = Column(String(100))
    color = Column(String(20))
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

class DailyLesson(Base):
    __tablename__ = "daily_lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(String(10), unique=True, index=True)  # YYYY-MM-DD
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    title = Column(String(200))
    content = Column(Text)
    verse = Column(JSON)  # {surah: "البقرة", ayah: 255, text: "..."}
    hadith = Column(JSON)  # {source: "صحيح البخاري", text: "..."}
    reflection_question = Column(String(500))
    
    character = relationship("IslamicCharacter")

class CompanionCharacter(Base):
    __tablename__ = "companion_characters"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    arabic_name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    animation_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users = relationship("User", back_populates="companion_character")

class LearningPath(Base):
    __tablename__ = "learning_paths"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    arabic_name = Column(String(100), nullable=False)
    description = Column(Text)
    cover_image = Column(String(500))
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    # Relationships
    lessons = relationship("Lesson", back_populates="path", order_by="Lesson.sort_order")

class Lesson(Base):
    __tablename__ = "lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    title = Column(String(200), nullable=False)
    arabic_title = Column(String(200))
    description = Column(Text)
    content = Column(JSON, nullable=False)  # JSON structure for lesson content
    duration = Column(Integer)  # in minutes
    has_quiz = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    path = relationship("LearningPath", back_populates="lessons")
    character = relationship("IslamicCharacter")
    user_progress = relationship("UserLessonProgress", back_populates="lesson")

class UserLessonProgress(Base):
    __tablename__ = "user_lesson_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True))
    score = Column(Float)
    time_spent = Column(Integer)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="user_progress")

# Team Management Models
class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    permissions = Column(JSON)  # List of permission strings
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    team_members = relationship("TeamMember", back_populates="role")

class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    department = Column(String(100))
    bio = Column(Text)
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    role = relationship("Role", back_populates="team_members")
    assigned_tasks = relationship("Task", back_populates="assignee")
    created_projects = relationship("Project", back_populates="created_by")
    approvals = relationship("ContentApproval", back_populates="reviewer")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="planning")  # planning, active, completed, cancelled
    priority = Column(String(20), default="medium")  # low, medium, high
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    created_by_id = Column(Integer, ForeignKey("team_members.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    created_by = relationship("TeamMember", back_populates="created_projects")
    tasks = relationship("Task", back_populates="project")
    productions = relationship("ContentProduction", back_populates="project")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(50), default="todo")  # todo, in_progress, review, completed
    priority = Column(String(20), default="medium")
    due_date = Column(DateTime(timezone=True))
    project_id = Column(Integer, ForeignKey("projects.id"))
    assignee_id = Column(Integer, ForeignKey("team_members.id"))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="tasks")
    assignee = relationship("TeamMember", back_populates="assigned_tasks")
    creator = relationship("User")

class ContentApproval(Base):
    __tablename__ = "content_approvals"
    
    id = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(50), nullable=False)  # character, story, script, etc.
    content_id = Column(Integer, nullable=False)
    reviewer_id = Column(Integer, ForeignKey("team_members.id"))
    status = Column(String(50), default="pending")  # pending, approved, rejected
    review_notes = Column(Text)
    reviewed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    reviewer = relationship("TeamMember", back_populates="approvals")

# Content Pipeline Models
class ContentTemplate(Base):
    __tablename__ = "content_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    template_type = Column(String(50), nullable=False)  # character, story, script, etc.
    structure = Column(JSON)  # Template structure definition
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    productions = relationship("ContentProduction", back_populates="template")

class Script(Base):
    __tablename__ = "scripts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    writer_id = Column(Integer, ForeignKey("team_members.id"))
    status = Column(String(50), default="draft")  # draft, review, approved, final
    word_count = Column(Integer)
    estimated_duration = Column(Integer)  # in minutes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    character = relationship("IslamicCharacter")
    writer = relationship("TeamMember")
    productions = relationship("ContentProduction", back_populates="script")

class Illustration(Base):
    __tablename__ = "illustrations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_url = Column(String(500))
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    artist_id = Column(Integer, ForeignKey("team_members.id"))
    production_id = Column(Integer, ForeignKey("content_productions.id"))
    status = Column(String(50), default="draft")  # draft, review, approved, final
    style = Column(String(100))
    scene_description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    character = relationship("IslamicCharacter")
    artist = relationship("TeamMember")
    productions = relationship("ContentProduction", back_populates="illustrations")

class VoiceRecording(Base):
    __tablename__ = "voice_recordings"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    audio_url = Column(String(500))
    script_id = Column(Integer, ForeignKey("scripts.id"))
    voice_actor_id = Column(Integer, ForeignKey("team_members.id"))
    production_id = Column(Integer, ForeignKey("content_productions.id"))
    status = Column(String(50), default="draft")  # draft, review, approved, final
    duration = Column(Integer)  # in seconds
    language = Column(String(10), default="ar")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    script = relationship("Script")
    voice_actor = relationship("TeamMember")
    productions = relationship("ContentProduction", back_populates="voice_recordings")

class Animation(Base):
    __tablename__ = "animations"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    animation_url = Column(String(500))
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    animator_id = Column(Integer, ForeignKey("team_members.id"))
    production_id = Column(Integer, ForeignKey("content_productions.id"))
    status = Column(String(50), default="draft")  # draft, review, approved, final
    duration = Column(Integer)  # in seconds
    style = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    character = relationship("IslamicCharacter")
    animator = relationship("TeamMember")
    productions = relationship("ContentProduction", back_populates="animations")

class ContentProduction(Base):
    __tablename__ = "content_productions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    character_id = Column(Integer, ForeignKey("islamic_characters.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    template_id = Column(Integer, ForeignKey("content_templates.id"))
    script_id = Column(Integer, ForeignKey("scripts.id"))
    status = Column(String(50), default="idea")  # idea, scripting, illustration, voice_recording, animation, review, published
    priority = Column(String(20), default="medium")
    target_audience = Column(String(100))
    estimated_completion = Column(DateTime(timezone=True))
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    character = relationship("IslamicCharacter")
    project = relationship("Project", back_populates="productions")
    template = relationship("ContentTemplate", back_populates="productions")
    script = relationship("Script", back_populates="productions")
    illustrations = relationship("Illustration", back_populates="productions")
    voice_recordings = relationship("VoiceRecording", back_populates="productions")
    animations = relationship("Animation", back_populates="productions")
    publications = relationship("Publication", back_populates="production")
    creator = relationship("User")

class PublishingPlatform(Base):
    __tablename__ = "publishing_platforms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    platform_type = Column(String(50))  # web, mobile, social, print
    api_config = Column(JSON)  # Platform-specific configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    publications = relationship("Publication", back_populates="platform")

class Publication(Base):
    __tablename__ = "publications"
    
    id = Column(Integer, primary_key=True, index=True)
    production_id = Column(Integer, ForeignKey("content_productions.id"))
    platform_id = Column(Integer, ForeignKey("publishing_platforms.id"))
    published_url = Column(String(500))
    published_at = Column(DateTime(timezone=True))
    status = Column(String(50), default="scheduled")  # scheduled, published, archived
    platform_data = Column(JSON)  # Platform-specific metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    production = relationship("ContentProduction", back_populates="publications")
    platform = relationship("PublishingPlatform", back_populates="publications")