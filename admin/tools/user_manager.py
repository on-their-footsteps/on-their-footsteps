#!/usr/bin/env python3
"""
User Management Tools for On Their Footsteps Project

This script provides utilities for managing user accounts including
creation, deletion, role management, and statistics.
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime
import argparse
import logging
import hashlib

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models import User, UserProgress
from backend.app.security import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class UserManager:
    def __init__(self):
        """Initialize user manager"""
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.db_path = self.backend_dir / 'on_their_footsteps.db'
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(str(self.db_path))
    
    def create_user(self, email, password, full_name=None, is_superuser=False):
        """Create a new user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                logger.error(f"User with email {email} already exists")
                return False
            
            # Hash password
            hashed_password = get_password_hash(password)
            
            # Insert user
            cursor.execute("""
                INSERT INTO users (email, hashed_password, full_name, is_superuser, is_active, language, theme)
                VALUES (?, ?, ?, ?, 1, 'ar', 'light')
            """, (email, hashed_password, full_name, is_superuser))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            logger.info(f"User created successfully: {email} (ID: {user_id})")
            return user_id
            
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            return False
    
    def delete_user(self, user_id_or_email):
        """Delete a user and all associated data"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Find user
            if user_id_or_email.isdigit():
                cursor.execute("SELECT id, email FROM users WHERE id = ?", (int(user_id_or_email),))
            else:
                cursor.execute("SELECT id, email FROM users WHERE email = ?", (user_id_or_email,))
            
            user = cursor.fetchone()
            if not user:
                logger.error(f"User not found: {user_id_or_email}")
                return False
            
            user_id, email = user
            
            # Delete user progress
            cursor.execute("DELETE FROM user_progress WHERE user_id = ?", (user_id,))
            
            # Delete user
            cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
            
            conn.commit()
            conn.close()
            
            logger.info(f"User deleted successfully: {email} (ID: {user_id})")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete user: {str(e)}")
            return False
    
    def list_users(self, include_stats=False):
        """List all users with optional statistics"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if include_stats:
                cursor.execute("""
                    SELECT u.id, u.email, u.full_name, u.is_active, u.is_superuser, 
                           u.created_at, u.last_active,
                           COUNT(up.id) as progress_count,
                           u.total_stories_completed,
                           u.total_time_spent,
                           u.streak_days
                    FROM users u
                    LEFT JOIN user_progress up ON u.id = up.user_id
                    GROUP BY u.id
                    ORDER BY u.created_at DESC
                """)
            else:
                cursor.execute("""
                    SELECT id, email, full_name, is_active, is_superuser, created_at, last_active
                    FROM users
                    ORDER BY created_at DESC
                """)
            
            users = cursor.fetchall()
            conn.close()
            
            return users
            
        except Exception as e:
            logger.error(f"Failed to list users: {str(e)}")
            return []
    
    def update_user(self, user_id_or_email, **kwargs):
        """Update user information"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Find user
            if user_id_or_email.isdigit():
                cursor.execute("SELECT id FROM users WHERE id = ?", (int(user_id_or_email),))
            else:
                cursor.execute("SELECT id FROM users WHERE email = ?", (user_id_or_email,))
            
            user = cursor.fetchone()
            if not user:
                logger.error(f"User not found: {user_id_or_email}")
                return False
            
            user_id = user[0]
            
            # Build update query
            update_fields = []
            update_values = []
            
            for field, value in kwargs.items():
                if field in ['full_name', 'language', 'theme', 'is_active', 'is_superuser']:
                    update_fields.append(f"{field} = ?")
                    update_values.append(value)
                elif field == 'password':
                    update_fields.append("hashed_password = ?")
                    update_values.append(get_password_hash(value))
            
            if not update_fields:
                logger.error("No valid fields to update")
                return False
            
            update_values.append(user_id)
            
            cursor.execute(f"UPDATE users SET {', '.join(update_fields)} WHERE id = ?", update_values)
            conn.commit()
            conn.close()
            
            logger.info(f"User updated successfully: {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update user: {str(e)}")
            return False
    
    def get_user_stats(self, user_id_or_email):
        """Get detailed statistics for a user"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Find user
            if user_id_or_email.isdigit():
                cursor.execute("SELECT id, email, full_name FROM users WHERE id = ?", (int(user_id_or_email),))
            else:
                cursor.execute("SELECT id, email, full_name FROM users WHERE email = ?", (user_id_or_email,))
            
            user = cursor.fetchone()
            if not user:
                logger.error(f"User not found: {user_id_or_email}")
                return None
            
            user_id, email, full_name = user
            
            # Get user progress statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_progress,
                    COUNT(CASE WHEN is_completed THEN 1 END) as completed_stories,
                    SUM(time_spent) as total_time,
                    COUNT(CASE WHEN bookmarked THEN 1 END) as bookmarked_count,
                    AVG(completion_percentage) as avg_completion
                FROM user_progress
                WHERE user_id = ?
            """, (user_id,))
            
            progress_stats = cursor.fetchone()
            
            # Get recent activity
            cursor.execute("""
                SELECT up.character_id, ic.name, up.last_position, up.completion_percentage
                FROM user_progress up
                JOIN islamic_characters ic ON up.character_id = ic.id
                WHERE up.user_id = ?
                ORDER BY up.last_position DESC
                LIMIT 5
            """, (user_id,))
            
            recent_activity = cursor.fetchall()
            
            conn.close()
            
            return {
                'user_id': user_id,
                'email': email,
                'full_name': full_name,
                'total_progress': progress_stats[0] or 0,
                'completed_stories': progress_stats[1] or 0,
                'total_time_seconds': progress_stats[2] or 0,
                'bookmarked_count': progress_stats[3] or 0,
                'avg_completion': round(progress_stats[4] or 0, 2),
                'recent_activity': recent_activity
            }
            
        except Exception as e:
            logger.error(f"Failed to get user stats: {str(e)}")
            return None
    
    def export_users(self, output_file=None):
        """Export all users to JSON file"""
        if not output_file:
            output_file = self.project_root / 'admin' / 'exports' / f"users_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        output_file = Path(output_file)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            users = self.list_users(include_stats=True)
            
            export_data = {
                'timestamp': datetime.now().isoformat(),
                'total_users': len(users),
                'users': []
            }
            
            for user in users:
                user_data = {
                    'id': user[0],
                    'email': user[1],
                    'full_name': user[2],
                    'is_active': bool(user[3]),
                    'is_superuser': bool(user[4]),
                    'created_at': user[5],
                    'last_active': user[6]
                }
                
                if len(user) > 7:  # Include stats
                    user_data.update({
                        'progress_count': user[7],
                        'completed_stories': user[8],
                        'total_time_spent': user[9],
                        'streak_days': user[10]
                    })
                
                export_data['users'].append(user_data)
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Users exported to: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to export users: {str(e)}")
            return False
    
    def import_users(self, input_file):
        """Import users from JSON file"""
        input_file = Path(input_file)
        
        if not input_file.exists():
            logger.error(f"Import file not found: {input_file}")
            return False
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            imported_count = 0
            failed_count = 0
            
            for user_data in data.get('users', []):
                # Generate random password for imported users
                password = f"temp_{datetime.now().strftime('%Y%m%d')}_{user_data['email']}"
                
                if self.create_user(
                    email=user_data['email'],
                    password=password,
                    full_name=user_data.get('full_name'),
                    is_superuser=user_data.get('is_superuser', False)
                ):
                    imported_count += 1
                else:
                    failed_count += 1
            
            logger.info(f"Import completed: {imported_count} imported, {failed_count} failed")
            return True
            
        except Exception as e:
            logger.error(f"Failed to import users: {str(e)}")
            return False
    
    def reset_password(self, user_id_or_email, new_password):
        """Reset user password"""
        return self.update_user(user_id_or_email, password=new_password)
    
    def toggle_user_status(self, user_id_or_email):
        """Toggle user active status"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Find user
            if user_id_or_email.isdigit():
                cursor.execute("SELECT is_active FROM users WHERE id = ?", (int(user_id_or_email),))
            else:
                cursor.execute("SELECT is_active FROM users WHERE email = ?", (user_id_or_email,))
            
            result = cursor.fetchone()
            if not result:
                logger.error(f"User not found: {user_id_or_email}")
                return False
            
            current_status = result[0]
            new_status = not current_status
            
            cursor.execute("UPDATE users SET is_active = ? WHERE id = ?", (new_status, user_id_or_email if user_id_or_email.isdigit() else None))
            conn.commit()
            conn.close()
            
            logger.info(f"User status toggled: {user_id_or_email} -> {'active' if new_status else 'inactive'}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to toggle user status: {str(e)}")
            return False

def main():
    parser = argparse.ArgumentParser(description='User management utility')
    parser.add_argument('action', choices=[
        'create', 'delete', 'list', 'update', 'stats', 'export', 'import', 'reset-password', 'toggle'
    ], help='Action to perform')
    parser.add_argument('--email', help='User email')
    parser.add_argument('--id', help='User ID')
    parser.add_argument('--password', help='User password')
    parser.add_argument('--name', help='User full name')
    parser.add_argument('--superuser', action='store_true', help='Make user superuser')
    parser.add_argument('--file', help='File path for import/export operations')
    parser.add_argument('--stats', action='store_true', help='Include statistics in list')
    
    args = parser.parse_args()
    
    user_manager = UserManager()
    
    if args.action == 'create':
        if not args.email or not args.password:
            print("❌ Email and password are required for user creation")
            sys.exit(1)
        
        user_id = user_manager.create_user(
            email=args.email,
            password=args.password,
            full_name=args.name,
            is_superuser=args.superuser
        )
        
        if user_id:
            print(f"✅ User created successfully (ID: {user_id})")
        else:
            print("❌ User creation failed")
            sys.exit(1)
    
    elif args.action == 'delete':
        identifier = args.id or args.email
        if not identifier:
            print("❌ Please specify user ID or email with --id or --email")
            sys.exit(1)
        
        if user_manager.delete_user(identifier):
            print("✅ User deleted successfully")
        else:
            print("❌ User deletion failed")
            sys.exit(1)
    
    elif args.action == 'list':
        users = user_manager.list_users(include_stats=args.stats)
        
        print(f"\n{'='*80}")
        print(f"USERS LIST ({len(users)} total)")
        print(f"{'='*80}")
        
        if args.stats:
            print(f"{'ID':<6} {'Email':<30} {'Name':<20} {'Active':<8} {'Progress':<10} {'Completed':<10}")
            print(f"{'-'*80}")
            for user in users:
                print(f"{user[0]:<6} {user[1]:<30} {user[2] or 'N/A':<20} {'Yes' if user[3] else 'No':<8} {user[7] or 0:<10} {user[8] or 0:<10}")
        else:
            print(f"{'ID':<6} {'Email':<30} {'Name':<20} {'Active':<8}")
            print(f"{'-'*80}")
            for user in users:
                print(f"{user[0]:<6} {user[1]:<30} {user[2] or 'N/A':<20} {'Yes' if user[3] else 'No':<8}")
        
        print(f"{'='*80}")
    
    elif args.action == 'stats':
        identifier = args.id or args.email
        if not identifier:
            print("❌ Please specify user ID or email with --id or --email")
            sys.exit(1)
        
        stats = user_manager.get_user_stats(identifier)
        if stats:
            print(f"\n{'='*60}")
            print(f"USER STATISTICS")
            print(f"{'='*60}")
            print(f"ID: {stats['user_id']}")
            print(f"Email: {stats['email']}")
            print(f"Name: {stats['full_name'] or 'N/A'}")
            print(f"Total Progress: {stats['total_progress']}")
            print(f"Completed Stories: {stats['completed_stories']}")
            print(f"Total Time: {stats['total_time_seconds'] // 60} minutes")
            print(f"Bookmarked: {stats['bookmarked_count']}")
            print(f"Avg Completion: {stats['avg_completion']}%")
            print(f"{'='*60}")
        else:
            print("❌ Failed to get user statistics")
            sys.exit(1)
    
    elif args.action == 'export':
        if user_manager.export_users(args.file):
            print("✅ Users exported successfully")
        else:
            print("❌ Users export failed")
            sys.exit(1)
    
    elif args.action == 'import':
        if not args.file:
            print("❌ Please specify import file with --file")
            sys.exit(1)
        
        if user_manager.import_users(args.file):
            print("✅ Users imported successfully")
        else:
            print("❌ Users import failed")
            sys.exit(1)
    
    elif args.action == 'reset-password':
        identifier = args.id or args.email
        if not identifier or not args.password:
            print("❌ Please specify user (ID/email) and new password")
            sys.exit(1)
        
        if user_manager.reset_password(identifier, args.password):
            print("✅ Password reset successfully")
        else:
            print("❌ Password reset failed")
            sys.exit(1)
    
    elif args.action == 'toggle':
        identifier = args.id or args.email
        if not identifier:
            print("❌ Please specify user ID or email with --id or --email")
            sys.exit(1)
        
        if user_manager.toggle_user_status(identifier):
            print("✅ User status toggled successfully")
        else:
            print("❌ User status toggle failed")
            sys.exit(1)

if __name__ == "__main__":
    main()
