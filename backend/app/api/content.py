from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from ..models import IslamicCharacter
from ..schemas import CharacterResponse

router = APIRouter()

@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)) -> List[str]:
    """Get all character categories"""
    categories = db.query(IslamicCharacter.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

@router.get("/eras")
async def get_eras(db: Session = Depends(get_db)) -> List[str]:
    """Get all historical eras"""
    eras = db.query(IslamicCharacter.era).distinct().all()
    return [era[0] for era in eras if era[0]]

@router.get("/subcategories/{category}")
async def get_subcategories(category: str, db: Session = Depends(get_db)) -> List[str]:
    """Get subcategories for a specific category"""
    subcategories = db.query(IslamicCharacter.sub_category).filter(
        IslamicCharacter.category == category
    ).distinct().all()
    return [sub[0] for sub in subcategories if sub[0]]

@router.get("/search")
async def search_content(
    q: str = Query(..., description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    era: Optional[str] = Query(None, description="Filter by era"),
    limit: int = Query(20, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Advanced search across characters"""
    query = db.query(IslamicCharacter)
    
    if q:
        query = query.filter(
            IslamicCharacter.name.contains(q) |
            IslamicCharacter.arabic_name.contains(q) |
            IslamicCharacter.description.contains(q) |
            IslamicCharacter.full_story.contains(q)
        )
    
    if category:
        query = query.filter(IslamicCharacter.category == category)
    
    if era:
        query = query.filter(IslamicCharacter.era == era)
    
    total = query.count()
    results = query.offset(offset).limit(limit).all()
    
    return {
        "results": results,
        "total": total,
        "offset": offset,
        "limit": limit
    }

@router.get("/featured/{category}", response_model=List[CharacterResponse])
async def get_featured_by_category(
    category: str,
    limit: int = Query(5, le=10),
    db: Session = Depends(get_db)
):
    """Get featured characters by category"""
    characters = db.query(IslamicCharacter).filter(
        IslamicCharacter.category == category,
        IslamicCharacter.is_featured == True
    ).order_by(IslamicCharacter.name).limit(limit).all()
    
    # Convert to response models
    response_characters = []
    for char in characters:
        response_characters.append(CharacterResponse(
            id=char.id,
            name=char.name,
            arabic_name=char.arabic_name,
            english_name=getattr(char, 'english_name', None),
            title=char.title,
            description=char.description,
            category=char.category,
            era=char.era,
            sub_category=getattr(char, 'sub_category', None),
            slug=getattr(char, 'slug', f"character-{char.id}"),
            profile_image=char.profile_image,
            views_count=char.views_count,
            likes_count=char.likes_count,
            shares_count=getattr(char, 'shares_count', 0),
            is_featured=getattr(char, 'is_featured', False),
            is_verified=getattr(char, 'is_verified', False),
            verification_source=getattr(char, 'verification_source', None),
            verification_notes=getattr(char, 'verification_notes', None),
            created_at=getattr(char, 'created_at', datetime.now())
        ))
    return response_characters

@router.get("/featured/raw")
async def get_featured_raw(db: Session = Depends(get_db)):
    """Get featured characters as raw data (no response model validation)"""
    characters = db.query(IslamicCharacter).filter(
        IslamicCharacter.is_featured == True
    ).order_by(IslamicCharacter.name).limit(6).all()
    
    raw_data = []
    for char in characters:
        raw_data.append({
            "id": char.id,
            "name": char.name,
            "arabic_name": char.arabic_name,
            "title": char.title,
            "description": char.description,
            "category": char.category,
            "era": char.era,
            "profile_image": char.profile_image,
            "views_count": char.views_count,
            "likes_count": char.likes_count,
            "is_featured": char.is_featured,
            "is_verified": char.is_verified
        })
    
    return raw_data

@router.get("/debug/featured")
async def debug_featured(db: Session = Depends(get_db)):
    """Debug endpoint to check featured characters"""
    all_chars = db.query(IslamicCharacter).all()
    featured_chars = db.query(IslamicCharacter).filter(IslamicCharacter.is_featured == True).all()
    
    return {
        "total_characters": len(all_chars),
        "featured_characters": len(featured_chars),
        "featured_details": [
            {
                "id": char.id,
                "name": char.name,
                "is_featured": char.is_featured
            } for char in featured_chars
        ]
    }

@router.get("/featured/general", response_model=List[CharacterResponse])
async def get_featured_general(
    limit: int = Query(6, le=10),
    db: Session = Depends(get_db)
):
    """Get featured characters across all categories"""
    characters = db.query(IslamicCharacter).filter(
        IslamicCharacter.is_featured == True
    ).order_by(IslamicCharacter.name).limit(limit).all()
    
    # Debug logging
    print(f"Found {len(characters)} featured characters")
    for char in characters:
        print(f"Character: {char.name}, featured: {char.is_featured}")
    
    # Convert to response models
    response_characters = []
    for char in characters:
        response_characters.append(CharacterResponse(
            id=char.id,
            name=char.name,
            arabic_name=char.arabic_name,
            english_name=getattr(char, 'english_name', None),
            title=char.title,
            description=char.description,
            category=char.category,
            era=char.era,
            sub_category=getattr(char, 'sub_category', None),
            slug=getattr(char, 'slug', f"character-{char.id}"),
            profile_image=char.profile_image,
            views_count=char.views_count,
            likes_count=char.likes_count,
            shares_count=getattr(char, 'shares_count', 0),
            is_featured=getattr(char, 'is_featured', False),
            is_verified=getattr(char, 'is_verified', False),
            verification_source=getattr(char, 'verification_source', None),
            verification_notes=getattr(char, 'verification_notes', None),
            created_at=getattr(char, 'created_at', datetime.now())
        ))
    
    print(f"Returning {len(response_characters)} response characters")
    return response_characters

@router.get("/timeline/all")
async def get_global_timeline(
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get timeline events from all characters"""
    characters = db.query(IslamicCharacter).all()
    timeline_events = []
    
    for character in characters:
        if character.timeline_events:
            for event in character.timeline_events:
                event['character_name'] = character.name
                event['character_id'] = character.id
                timeline_events.append(event)
    
    # Sort by year
    timeline_events.sort(key=lambda x: x.get('year', 0))
    return timeline_events[:limit]

@router.get("/quotes/random")
async def get_random_quotes(
    category: Optional[str] = Query(None),
    limit: int = Query(5, le=20),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get random quotes from characters"""
    query = db.query(IslamicCharacter).filter(IslamicCharacter.quotes.isnot(None))
    
    if category:
        query = query.filter(IslamicCharacter.category == category)
    
    characters = query.all()
    quotes = []
    
    for character in characters:
        if character.quotes:
            for quote in character.quotes[:2]:  # Max 2 quotes per character
                quotes.append({
                    "quote": quote,
                    "character_name": character.name,
                    "character_id": character.id,
                    "character_title": character.title
                })
                if len(quotes) >= limit:
                    break
        if len(quotes) >= limit:
            break
    
    return quotes

@router.get("/locations")
async def get_important_locations(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all important historical locations"""
    characters = db.query(IslamicCharacter).all()
    locations = {}
    
    for character in characters:
        if character.birth_place:
            if character.birth_place not in locations:
                locations[character.birth_place] = {
                    "type": "birth_place",
                    "characters": []
                }
            locations[character.birth_place]["characters"].append(character.name)
        if character.death_place:
            if character.death_place not in locations:
                locations[character.death_place] = {
                    "type": "death_place", 
                    "characters": []
                }
            locations[character.death_place]["characters"].append(character.name)
        if character.locations:
            for location in character.locations:
                if location not in locations:
                    locations[location] = {
                        "type": "historical_site",
                        "characters": []
                    }
                locations[location]["characters"].append(character.name)
    
    return [{"name": k, **v} for k, v in locations.items()]
