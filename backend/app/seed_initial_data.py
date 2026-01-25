from sqlalchemy.orm import Session
from .database import SessionLocal
from .models import CompanionCharacter, LearningPath, Lesson, IslamicCharacter

def seed_companion_characters(db: Session):
    """Seed companion characters"""
    companions = [
        {
            "name": "Noora the Owl",
            "arabic_name": "نورة البومة",
            "description": "بومة حكيمة تحب مشاركة المعرفة عن التاريخ الإسلامي",
            "image_url": "/images/companions/noora.png",
            "animation_url": "/animations/noora.json"
        },
        {
            "name": "Zayd the Falcon",
            "arabic_name": "زيد الصقر",
            "description": "صقر شجاع يرشدك في رحلة تعلم الصحابة",
            "image_url": "/images/companions/zayd.png",
            "animation_url": "/animations/zayd.json"
        },
        {
            "name": "Layla the Gazelle",
            "arabic_name": "ليلى الغزالة",
            "description": "غزالة لطيفة تحكي قصص الأنبياء",
            "image_url": "/images/companions/layla.png",
            "animation_url": "/animations/layla.json"
        }
    ]
    
    for comp in companions:
        if not db.query(CompanionCharacter).filter(CompanionCharacter.name == comp["name"]).first():
            db_comp = CompanionCharacter(**comp)
            db.add(db_comp)
    
    db.commit()
    print("Companion characters seeded successfully!")

def seed_learning_paths(db: Session):
    """Seed learning paths"""
    # Chronological Islamic History Path
    history_path = {
        "name": "Chronological Islamic History",
        "arabic_name": "التاريخ الإسلامي الزمني",
        "description": "تعلم التاريخ الإسلامي بالترتيب الزمني من سيدنا آدم إلى يومنا هذا",
        "cover_image": "/images/paths/history.jpg",
        "sort_order": 1
    }
    
    db_path = db.query(LearningPath).filter(LearningPath.name == history_path["name"]).first()
    if not db_path:
        db_path = LearningPath(**history_path)
        db.add(db_path)
        db.commit()
        db.refresh(db_path)
    
    # Character-based Learning Path
    characters_path = {
        "name": "Character-based Learning",
        "arabic_name": "التعلم من خلال الشخصيات",
        "description": "تعلم من خلال حياة الشخصيات الإسلامية المهمة",
        "cover_image": "/images/paths/characters.jpg",
        "sort_order": 2
    }
    
    db_chars_path = db.query(LearningPath).filter(LearningPath.name == characters_path["name"]).first()
    if not db_chars_path:
        db_chars_path = LearningPath(**characters_path)
        db.add(db_chars_path)
        db.commit()
        db.refresh(db_chars_path)
    
    print("Learning paths seeded successfully!")
    return db_path, db_chars_path

def seed_sample_lessons(db: Session, history_path, chars_path):
    """Seed sample lessons"""
    # Get some characters for lessons
    adam = db.query(IslamicCharacter).filter(IslamicCharacter.arabic_name == "آدم").first()
    noah = db.query(IslamicCharacter).filter(IslamicCharacter.arabic_name == "نوح").first()
    abraham = db.query(IslamicCharacter).filter(IslamicCharacter.arabic_name == "إبراهيم").first()
    
    # Sample lessons for chronological path
    chronological_lessons = [
        {
            "path_id": history_path.id,
            "character_id": adam.id if adam else None,
            "title": "The Story of Prophet Adam",
            "arabic_title": "قصة سيدنا آدم",
            "description": "Learn about the first human and prophet",
            "content": {
                "introduction": "Adam was the first human and prophet...",
                "main_content": "Adam lived in Paradise...",
                "moral": "The story teaches us about repentance...",
                "interactive_elements": ["drag_drop", "timeline"]
            },
            "duration": 15,
            "has_quiz": True,
            "sort_order": 1
        },
        {
            "path_id": history_path.id,
            "character_id": noah.id if noah else None,
            "title": "The Story of Prophet Noah",
            "arabic_title": "قصة سيدنا نوح",
            "description": "Learn about Noah's patience and the great flood",
            "content": {
                "introduction": "Noah was known for his patience...",
                "main_content": "Noah preached for 950 years...",
                "moral": "The story teaches us about patience and faith...",
                "interactive_elements": ["story_sequence", "quiz"]
            },
            "duration": 20,
            "has_quiz": True,
            "sort_order": 2
        },
        {
            "path_id": history_path.id,
            "character_id": abraham.id if abraham else None,
            "title": "The Story of Prophet Abraham",
            "arabic_title": "قصة سيدنا إبراهيم",
            "description": "Learn about the father of prophets",
            "content": {
                "introduction": "Abraham is known as the father of prophets...",
                "main_content": "Abraham broke the idols...",
                "moral": "The story teaches us about monotheism...",
                "interactive_elements": ["video", "reflection"]
            },
            "duration": 25,
            "has_quiz": True,
            "sort_order": 3
        }
    ]
    
    for lesson_data in chronological_lessons:
        if not db.query(Lesson).filter(
            Lesson.title == lesson_data["title"],
            Lesson.path_id == lesson_data["path_id"]
        ).first():
            lesson = Lesson(**lesson_data)
            db.add(lesson)
    
    db.commit()
    print("Sample lessons seeded successfully!")

def main():
    """Main seeding function"""
    db = SessionLocal()
    try:
        print("Starting to seed initial data...")
        
        # Seed companion characters
        seed_companion_characters(db)
        
        # Seed learning paths
        history_path, chars_path = seed_learning_paths(db)
        
        # Seed sample lessons
        seed_sample_lessons(db, history_path, chars_path)
        
        print("Successfully seeded all initial data!")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
