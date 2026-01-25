#!/usr/bin/env python3
"""
Database Backup Script for On Their Footsteps Project

This script creates automated backups of the SQLite database and
stores them with timestamps in the admin/backups directory.
"""

import os
import sys
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path
import argparse
import logging

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseBackup:
    def __init__(self, backup_dir=None):
        """Initialize backup manager"""
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.backup_dir = backup_dir or self.project_root / 'admin' / 'backups'
        self.backup_dir.mkdir(exist_ok=True)
        
        # Database path
        self.db_path = self.backend_dir / 'on_their_footsteps.db'
        
    def create_backup(self, compression=True):
        """Create a database backup"""
        if not self.db_path.exists():
            logger.error(f"Database file not found: {self.db_path}")
            return False
            
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"backup_{timestamp}.db"
        backup_path = self.backup_dir / backup_filename
        
        try:
            logger.info(f"Creating backup: {backup_filename}")
            
            # Create backup
            shutil.copy2(self.db_path, backup_path)
            
            # Verify backup
            if self._verify_backup(backup_path):
                logger.info(f"Backup created successfully: {backup_path}")
                
                # Compress if requested
                if compression:
                    compressed_path = self._compress_backup(backup_path)
                    if compressed_path:
                        # Remove uncompressed backup
                        backup_path.unlink()
                        backup_path = compressed_path
                        logger.info(f"Backup compressed: {backup_path}")
                
                # Clean up old backups
                self._cleanup_old_backups()
                
                return backup_path
            else:
                logger.error("Backup verification failed")
                backup_path.unlink()
                return False
                
        except Exception as e:
            logger.error(f"Backup failed: {str(e)}")
            if backup_path.exists():
                backup_path.unlink()
            return False
    
    def _verify_backup(self, backup_path):
        """Verify backup integrity"""
        try:
            conn = sqlite3.connect(str(backup_path))
            cursor = conn.cursor()
            
            # Check if database is readable
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            conn.close()
            
            # Should have at least some tables
            return len(tables) > 0
            
        except Exception as e:
            logger.error(f"Backup verification failed: {str(e)}")
            return False
    
    def _compress_backup(self, backup_path):
        """Compress backup file using gzip"""
        try:
            import gzip
            
            compressed_path = backup_path.with_suffix(backup_path.suffix + '.gz')
            
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            return compressed_path
            
        except ImportError:
            logger.warning("gzip not available, skipping compression")
            return None
        except Exception as e:
            logger.error(f"Compression failed: {str(e)}")
            return None
    
    def _cleanup_old_backups(self, keep_count=10):
        """Remove old backups, keeping only the most recent ones"""
        try:
            # Get all backup files
            backup_files = list(self.backup_dir.glob("backup_*.db*"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # Remove old backups
            for backup_file in backup_files[keep_count:]:
                backup_file.unlink()
                logger.info(f"Removed old backup: {backup_file.name}")
                
        except Exception as e:
            logger.error(f"Cleanup failed: {str(e)}")
    
    def list_backups(self):
        """List all available backups"""
        backup_files = list(self.backup_dir.glob("backup_*.db*"))
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
        
        logger.info(f"Found {len(backup_files)} backup(s):")
        for backup_file in backup_files:
            size = backup_file.stat().st_size / (1024 * 1024)  # MB
            mtime = datetime.fromtimestamp(backup_file.stat().st_mtime)
            logger.info(f"  {backup_file.name} - {size:.1f}MB - {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    
    def restore_backup(self, backup_path):
        """Restore database from backup"""
        backup_path = Path(backup_path)
        
        if not backup_path.exists():
            logger.error(f"Backup file not found: {backup_path}")
            return False
        
        if not self.db_path.exists():
            logger.error(f"Target database not found: {self.db_path}")
            return False
        
        try:
            # Create a backup of current database before restoring
            current_backup = self.db_path.with_suffix('.db.before_restore')
            shutil.copy2(self.db_path, current_backup)
            
            # Restore from backup
            shutil.copy2(backup_path, self.db_path)
            
            # Verify restored database
            if self._verify_backup(self.db_path):
                logger.info(f"Database restored successfully from: {backup_path}")
                return True
            else:
                # Restore failed, revert to backup
                shutil.copy2(current_backup, self.db_path)
                logger.error("Restore verification failed, reverted to previous state")
                return False
                
        except Exception as e:
            logger.error(f"Restore failed: {str(e)}")
            return False

def main():
    parser = argparse.ArgumentParser(description='Database backup utility')
    parser.add_argument('action', choices=['create', 'list', 'restore'], 
                       help='Action to perform')
    parser.add_argument('--backup', help='Backup file to restore (for restore action)')
    parser.add_argument('--no-compress', action='store_true', 
                       help='Disable compression')
    parser.add_argument('--keep', type=int, default=10, 
                       help='Number of backups to keep (default: 10)')
    
    args = parser.parse_args()
    
    backup_manager = DatabaseBackup()
    
    if args.action == 'create':
        backup_path = backup_manager.create_backup(compression=not args.no_compress)
        if backup_path:
            print(f"✅ Backup created: {backup_path}")
        else:
            print("❌ Backup failed")
            sys.exit(1)
    
    elif args.action == 'list':
        backup_manager.list_backups()
    
    elif args.action == 'restore':
        if not args.backup:
            print("❌ Please specify backup file with --backup")
            sys.exit(1)
        
        if backup_manager.restore_backup(args.backup):
            print("✅ Database restored successfully")
        else:
            print("❌ Restore failed")
            sys.exit(1)

if __name__ == "__main__":
    main()
