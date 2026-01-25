#!/usr/bin/env python3
"""
Database Management Tools for On Their Footsteps Project

This script provides utilities for managing the SQLite database
including migrations, data seeding, and maintenance tasks.
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime
import argparse
import logging

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.app.config import settings
from backend.app.database import Base, engine, get_db
from backend.app.models import IslamicCharacter, User, UserProgress, ContentCategory, DailyLesson
from sqlalchemy.orm import Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        """Initialize database manager"""
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.db_path = self.backend_dir / 'on_their_footsteps.db'
        
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(str(self.db_path))
    
    def initialize_database(self):
        """Initialize database with all tables"""
        logger.info("Initializing database...")
        
        try:
            # Create all tables
            Base.metadata.create_all(bind=engine)
            logger.info("Database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            return False
    
    def drop_all_tables(self):
        """Drop all tables (for testing/reset purposes)"""
        logger.warning("Dropping all database tables...")
        
        try:
            Base.metadata.drop_all(bind=engine)
            logger.info("All tables dropped successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to drop tables: {str(e)}")
            return False
    
    def reset_database(self):
        """Reset database (drop and recreate)"""
        logger.warning("Resetting database...")
        
        if self.drop_all_tables():
            return self.initialize_database()
        return False
    
    def get_database_info(self):
        """Get database information and statistics"""
        info = {
            'file_size': 0,
            'table_info': {},
            'last_modified': None
        }
        
        try:
            if self.db_path.exists():
                stat = self.db_path.stat()
                info['file_size'] = stat.st_size
                info['last_modified'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Get table information
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            for table_name, in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                
                # Get table schema
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                
                info['table_info'][table_name] = {
                    'row_count': count,
                    'column_count': len(columns),
                    'columns': [col[1] for col in columns]
                }
            
            conn.close()
            
        except Exception as e:
            logger.error(f"Failed to get database info: {str(e)}")
        
        return info
    
    def vacuum_database(self):
        """Vacuum database to reclaim space"""
        logger.info("Vacuuming database...")
        
        try:
            conn = self.get_connection()
            conn.execute("VACUUM")
            conn.close()
            logger.info("Database vacuumed successfully")
            return True
        except Exception as e:
            logger.error(f"Database vacuum failed: {str(e)}")
            return False
    
    def analyze_database(self):
        """Analyze database for query optimization"""
        logger.info("Analyzing database...")
        
        try:
            conn = self.get_connection()
            conn.execute("ANALYZE")
            conn.close()
            logger.info("Database analyzed successfully")
            return True
        except Exception as e:
            logger.error(f"Database analysis failed: {str(e)}")
            return False
    
    def backup_table(self, table_name, backup_path=None):
        """Backup a specific table to JSON"""
        if not backup_path:
            backup_path = self.project_root / 'admin' / 'backups' / f"{table_name}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        backup_path = Path(backup_path)
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute(f"SELECT * FROM {table_name}")
            columns = [description[0] for description in cursor.description]
            rows = cursor.fetchall()
            
            data = {
                'table': table_name,
                'timestamp': datetime.now().isoformat(),
                'columns': columns,
                'rows': rows
            }
            
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            conn.close()
            logger.info(f"Table {table_name} backed up to {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Table backup failed: {str(e)}")
            return False
    
    def restore_table(self, backup_path, table_name=None):
        """Restore table from JSON backup"""
        backup_path = Path(backup_path)
        
        if not backup_path.exists():
            logger.error(f"Backup file not found: {backup_path}")
            return False
        
        try:
            with open(backup_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if table_name is None:
                table_name = data['table']
            
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Clear existing data
            cursor.execute(f"DELETE FROM {table_name}")
            
            # Insert restored data
            columns = data['columns']
            placeholders = ', '.join(['?' for _ in columns])
            
            for row in data['rows']:
                cursor.execute(f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})", row)
            
            conn.commit()
            conn.close()
            
            logger.info(f"Table {table_name} restored from {backup_path}")
            return True
            
        except Exception as e:
            logger.error(f"Table restore failed: {str(e)}")
            return False
    
    def run_query(self, query, params=None):
        """Execute a custom SQL query"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            # Check if it's a SELECT query
            if query.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                conn.close()
                return {'columns': columns, 'rows': results}
            else:
                conn.commit()
                affected_rows = cursor.rowcount
                conn.close()
                return {'affected_rows': affected_rows}
                
        except Exception as e:
            logger.error(f"Query execution failed: {str(e)}")
            return None
    
    def cleanup_orphaned_records(self):
        """Clean up orphaned records"""
        logger.info("Cleaning up orphaned records...")
        
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Clean up user progress for non-existent users
            cursor.execute("""
                DELETE FROM user_progress 
                WHERE user_id NOT IN (SELECT id FROM users)
            """)
            user_progress_cleanup = cursor.rowcount
            
            # Clean up user progress for non-existent characters
            cursor.execute("""
                DELETE FROM user_progress 
                WHERE character_id NOT IN (SELECT id FROM islamic_characters)
            """)
            character_progress_cleanup = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            logger.info(f"Cleaned up {user_progress_cleanup} orphaned user progress records")
            logger.info(f"Cleaned up {character_progress_cleanup} orphaned character progress records")
            return True
            
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
            return False

def main():
    parser = argparse.ArgumentParser(description='Database management utility')
    parser.add_argument('action', choices=[
        'init', 'reset', 'info', 'vacuum', 'analyze', 
        'backup', 'restore', 'query', 'cleanup'
    ], help='Action to perform')
    parser.add_argument('--table', help='Table name for backup/restore operations')
    parser.add_argument('--file', help='File path for backup/restore operations')
    parser.add_argument('--query', help='SQL query to execute')
    parser.add_argument('--params', help='Query parameters (JSON format)')
    
    args = parser.parse_args()
    
    db_manager = DatabaseManager()
    
    if args.action == 'init':
        if db_manager.initialize_database():
            print("✅ Database initialized successfully")
        else:
            print("❌ Database initialization failed")
            sys.exit(1)
    
    elif args.action == 'reset':
        if db_manager.reset_database():
            print("✅ Database reset successfully")
        else:
            print("❌ Database reset failed")
            sys.exit(1)
    
    elif args.action == 'info':
        info = db_manager.get_database_info()
        print(f"\n{'='*50}")
        print(f"DATABASE INFORMATION")
        print(f"{'='*50}")
        print(f"File Size: {info['file_size'] / (1024*1024):.2f} MB")
        print(f"Last Modified: {info['last_modified']}")
        print(f"\nTables:")
        for table, data in info['table_info'].items():
            print(f"  {table}: {data['row_count']} rows, {data['column_count']} columns")
        print(f"{'='*50}")
    
    elif args.action == 'vacuum':
        if db_manager.vacuum_database():
            print("✅ Database vacuumed successfully")
        else:
            print("❌ Database vacuum failed")
            sys.exit(1)
    
    elif args.action == 'analyze':
        if db_manager.analyze_database():
            print("✅ Database analyzed successfully")
        else:
            print("❌ Database analysis failed")
            sys.exit(1)
    
    elif args.action == 'backup':
        if not args.table:
            print("❌ Please specify table name with --table")
            sys.exit(1)
        
        if db_manager.backup_table(args.table, args.file):
            print(f"✅ Table {args.table} backed up successfully")
        else:
            print(f"❌ Table {args.table} backup failed")
            sys.exit(1)
    
    elif args.action == 'restore':
        if not args.file:
            print("❌ Please specify backup file with --file")
            sys.exit(1)
        
        if db_manager.restore_table(args.file, args.table):
            print(f"✅ Table restored successfully")
        else:
            print("❌ Table restore failed")
            sys.exit(1)
    
    elif args.action == 'query':
        if not args.query:
            print("❌ Please specify query with --query")
            sys.exit(1)
        
        params = None
        if args.params:
            params = json.loads(args.params)
        
        result = db_manager.run_query(args.query, params)
        if result:
            if 'columns' in result:
                print(f"\n{' | '.join(result['columns'])}")
                print(f"{'-' * (len(' | '.join(result['columns'])))}")
                for row in result['rows']:
                    print(f"{' | '.join(str(cell) for cell in row)}")
            else:
                print(f"✅ Query executed successfully")
                print(f"Affected rows: {result['affected_rows']}")
        else:
            print("❌ Query execution failed")
            sys.exit(1)
    
    elif args.action == 'cleanup':
        if db_manager.cleanup_orphaned_records():
            print("✅ Database cleanup completed successfully")
        else:
            print("❌ Database cleanup failed")
            sys.exit(1)

if __name__ == "__main__":
    main()
