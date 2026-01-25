#!/usr/bin/env python3
"""
Health Check Script for On Their Footsteps Project

This script monitors the health of all system components including
backend services, database, frontend, and external dependencies.
"""

import os
import sys
import requests
import sqlite3
import subprocess
import psutil
from pathlib import Path
from datetime import datetime
import json
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class HealthChecker:
    def __init__(self):
        """Initialize health checker"""
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'frontend'
        
        # Health check endpoints
        self.endpoints = {
            'backend': 'http://localhost:8000/api/health',
            'frontend': 'http://localhost:3000',
            'database': str(self.backend_dir / 'on_their_footsteps.db')
        }
        
        self.results = {}
    
    def check_backend_health(self) -> Dict[str, Any]:
        """Check backend service health"""
        result = {
            'service': 'Backend API',
            'status': 'unknown',
            'response_time': None,
            'details': {}
        }
        
        try:
            start_time = datetime.now()
            response = requests.get(self.endpoints['backend'], timeout=10)
            end_time = datetime.now()
            
            result['response_time'] = (end_time - start_time).total_seconds()
            result['status'] = 'healthy' if response.status_code == 200 else 'unhealthy'
            result['details'] = {
                'status_code': response.status_code,
                'response': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
            }
            
        except requests.exceptions.ConnectionError:
            result['status'] = 'down'
            result['details']['error'] = 'Connection refused'
        except requests.exceptions.Timeout:
            result['status'] = 'timeout'
            result['details']['error'] = 'Request timeout'
        except Exception as e:
            result['status'] = 'error'
            result['details']['error'] = str(e)
        
        return result
    
    def check_frontend_health(self) -> Dict[str, Any]:
        """Check frontend service health"""
        result = {
            'service': 'Frontend',
            'status': 'unknown',
            'response_time': None,
            'details': {}
        }
        
        try:
            start_time = datetime.now()
            response = requests.get(self.endpoints['frontend'], timeout=10)
            end_time = datetime.now()
            
            result['response_time'] = (end_time - start_time).total_seconds()
            result['status'] = 'healthy' if response.status_code == 200 else 'unhealthy'
            result['details'] = {
                'status_code': response.status_code,
                'content_length': len(response.content)
            }
            
        except requests.exceptions.ConnectionError:
            result['status'] = 'down'
            result['details']['error'] = 'Connection refused'
        except requests.exceptions.Timeout:
            result['status'] = 'timeout'
            result['details']['error'] = 'Request timeout'
        except Exception as e:
            result['status'] = 'error'
            result['details']['error'] = str(e)
        
        return result
    
    def check_database_health(self) -> Dict[str, Any]:
        """Check database health"""
        result = {
            'service': 'Database',
            'status': 'unknown',
            'details': {}
        }
        
        try:
            db_path = Path(self.endpoints['database'])
            
            if not db_path.exists():
                result['status'] = 'missing'
                result['details']['error'] = 'Database file not found'
                return result
            
            # Check file size and modification time
            stat = db_path.stat()
            result['details']['file_size'] = stat.st_size
            result['details']['last_modified'] = datetime.fromtimestamp(stat.st_mtime).isoformat()
            
            # Test database connection
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            
            # Check if we can query
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            # Check specific tables
            cursor.execute("SELECT COUNT(*) FROM islamic_characters")
            character_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            
            conn.close()
            
            result['status'] = 'healthy'
            result['details'] = {
                'table_count': len(tables),
                'character_count': character_count,
                'user_count': user_count,
                'file_size_mb': round(stat.st_size / (1024 * 1024), 2)
            }
            
        except sqlite3.Error as e:
            result['status'] = 'error'
            result['details']['error'] = f"Database error: {str(e)}"
        except Exception as e:
            result['status'] = 'error'
            result['details']['error'] = str(e)
        
        return result
    
    def check_system_resources(self) -> Dict[str, Any]:
        """Check system resource usage"""
        result = {
            'service': 'System Resources',
            'status': 'healthy',
            'details': {}
        }
        
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            result['details'] = {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'memory_available_gb': round(memory.available / (1024**3), 2),
                'memory_total_gb': round(memory.total / (1024**3), 2),
                'disk_percent': disk.percent,
                'disk_free_gb': round(disk.free / (1024**3), 2),
                'disk_total_gb': round(disk.total / (1024**3), 2)
            }
            
            # Check thresholds
            if cpu_percent > 90:
                result['status'] = 'warning'
            if memory.percent > 90:
                result['status'] = 'warning'
            if disk.percent > 90:
                result['status'] = 'critical'
            
        except Exception as e:
            result['status'] = 'error'
            result['details']['error'] = str(e)
        
        return result
    
    def check_docker_services(self) -> Dict[str, Any]:
        """Check Docker services status"""
        result = {
            'service': 'Docker Services',
            'status': 'unknown',
            'details': {}
        }
        
        try:
            # Check if Docker is running
            subprocess.run(['docker', 'version'], capture_output=True, check=True)
            
            # Get running containers
            result_output = subprocess.run(
                ['docker', 'ps', '--format', 'json'],
                capture_output=True, text=True, check=True
            )
            
            import json
            containers = json.loads(result_output.stdout)
            
            # Filter for our application containers
            app_containers = [c for c in containers if 'on-their-footsteps' in c.get('Names', [''])[0]]
            
            result['status'] = 'healthy' if app_containers else 'no_containers'
            result['details'] = {
                'total_containers': len(containers),
                'app_containers': len(app_containers),
                'containers': [
                    {
                        'name': c['Names'][0],
                        'status': c['Status'],
                        'image': c['Image']
                    }
                    for c in app_containers
                ]
            }
            
        except subprocess.CalledProcessError:
            result['status'] = 'down'
            result['details']['error'] = 'Docker not running or not accessible'
        except Exception as e:
            result['status'] = 'error'
            result['details']['error'] = str(e)
        
        return result
    
    def check_external_dependencies(self) -> Dict[str, Any]:
        """Check external dependencies"""
        result = {
            'service': 'External Dependencies',
            'status': 'healthy',
            'details': {}
        }
        
        dependencies = {
            'Google Fonts': 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700',
            'Font Awesome': 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
        }
        
        for name, url in dependencies.items():
            try:
                response = requests.get(url, timeout=5)
                result['details'][name] = {
                    'status': 'available' if response.status_code == 200 else 'unavailable',
                    'response_time': response.elapsed.total_seconds()
                }
            except Exception as e:
                result['details'][name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return result
    
    def run_all_checks(self) -> Dict[str, Any]:
        """Run all health checks"""
        logger.info("Starting comprehensive health check...")
        
        checks = {
            'backend': self.check_backend_health(),
            'frontend': self.check_frontend_health(),
            'database': self.check_database_health(),
            'system': self.check_system_resources(),
            'docker': self.check_docker_services(),
            'external': self.check_external_dependencies()
        }
        
        # Calculate overall status
        statuses = [check['status'] for check in checks.values()]
        
        if 'critical' in statuses or 'down' in statuses:
            overall_status = 'critical'
        elif 'error' in statuses or 'timeout' in statuses:
            overall_status = 'unhealthy'
        elif 'warning' in statuses:
            overall_status = 'warning'
        else:
            overall_status = 'healthy'
        
        return {
            'timestamp': datetime.now().isoformat(),
            'overall_status': overall_status,
            'checks': checks
        }
    
    def print_results(self, results: Dict[str, Any]):
        """Print health check results"""
        print(f"\n{'='*60}")
        print(f"HEALTH CHECK REPORT - {results['timestamp']}")
        print(f"{'='*60}")
        print(f"Overall Status: {results['overall_status'].upper()}")
        print(f"{'='*60}")
        
        for service, check in results['checks'].items():
            status_icon = {
                'healthy': '✅',
                'warning': '⚠️',
                'unhealthy': '❌',
                'critical': '🔴',
                'down': '💀',
                'timeout': '⏰',
                'error': '🚫',
                'unknown': '❓'
            }.get(check['status'], '❓')
            
            print(f"\n{status_icon} {check['service']}: {check['status'].upper()}")
            
            if check.get('response_time'):
                print(f"   Response Time: {check['response_time']:.2f}s")
            
            if check.get('details'):
                for key, value in check['details'].items():
                    if key != 'error':
                        print(f"   {key}: {value}")
            
            if 'error' in check.get('details', {}):
                print(f"   Error: {check['details']['error']}")
        
        print(f"\n{'='*60}")
    
    def save_results(self, results: Dict[str, Any]):
        """Save health check results to file"""
        logs_dir = self.project_root / 'admin' / 'logs'
        logs_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_file = logs_dir / f"health_check_{timestamp}.json"
        
        with open(log_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Health check results saved to: {log_file}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Health check utility')
    parser.add_argument('--save', action='store_true', help='Save results to file')
    parser.add_argument('--service', choices=['backend', 'frontend', 'database', 'system', 'docker', 'external'], 
                       help='Check specific service only')
    
    args = parser.parse_args()
    
    checker = HealthChecker()
    
    if args.service:
        # Check specific service
        check_method = getattr(checker, f'check_{args.service}_health')
        results = {args.service: check_method()}
        results['timestamp'] = datetime.now().isoformat()
        results['overall_status'] = results[args.service]['status']
    else:
        # Run all checks
        results = checker.run_all_checks()
    
    # Print results
    checker.print_results(results)
    
    # Save results if requested
    if args.save:
        checker.save_results(results)
    
    # Exit with appropriate code
    if results['overall_status'] in ['critical', 'unhealthy', 'down']:
        sys.exit(1)
    elif results['overall_status'] == 'warning':
        sys.exit(2)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
