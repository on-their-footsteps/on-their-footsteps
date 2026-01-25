#!/usr/bin/env python3
"""
Performance Monitoring for On Their Footsteps Project

This script monitors application performance including response times,
resource usage, and system metrics.
"""

import os
import sys
import time
import requests
import psutil
import json
from pathlib import Path
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any
import sqlite3

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PerformanceMonitor:
    def __init__(self):
        """Initialize performance monitor"""
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_dir = self.project_root / 'backend'
        self.db_path = self.backend_dir / 'on_their_footsteps.db'
        
        # Monitoring endpoints
        self.endpoints = {
            'backend': 'http://localhost:8000/api/health',
            'characters': 'http://localhost:8000/api/characters',
            'users': 'http://localhost:8000/api/users'
        }
        
        self.metrics = []
    
    def measure_response_time(self, url: str, timeout: int = 10) -> Dict[str, Any]:
        """Measure response time for an endpoint"""
        result = {
            'url': url,
            'timestamp': datetime.now().isoformat(),
            'response_time': None,
            'status_code': None,
            'error': None
        }
        
        try:
            start_time = time.time()
            response = requests.get(url, timeout=timeout)
            end_time = time.time()
            
            result['response_time'] = (end_time - start_time) * 1000  # Convert to milliseconds
            result['status_code'] = response.status_code
            
        except requests.exceptions.RequestException as e:
            result['error'] = str(e)
        
        return result
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get system resource metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            
            # Network metrics
            network = psutil.net_io_counters()
            
            # Process metrics
            process = psutil.Process()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': disk.percent
                },
                'network': {
                    'bytes_sent': network.bytes_sent if network else 0,
                    'bytes_recv': network.bytes_recv if network else 0
                },
                'process': {
                    'pid': process.pid,
                    'memory_percent': process.memory_percent(),
                    'cpu_percent': process.cpu_percent(),
                    'num_threads': process.num_threads(),
                    'create_time': process.create_time()
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to get system metrics: {str(e)}")
            return {'error': str(e)}
    
    def get_database_metrics(self) -> Dict[str, Any]:
        """Get database performance metrics"""
        try:
            if not self.db_path.exists():
                return {'error': 'Database file not found'}
            
            # File size and modification
            stat = self.db_path.stat()
            
            # Database connection metrics
            start_time = time.time()
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()
            
            # Get table counts
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            
            # Get row counts for major tables
            cursor.execute("SELECT COUNT(*) FROM islamic_characters")
            character_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM user_progress")
            progress_count = cursor.fetchone()[0]
            
            # Database size
            cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            db_size = cursor.fetchone()
            
            conn.close()
            end_time = time.time()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'file_size': stat.st_size,
                'last_modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'connection_time': (end_time - start_time) * 1000,
                'table_count': len(tables),
                'character_count': character_count,
                'user_count': user_count,
                'progress_count': progress_count,
                'database_size': db_size[0] if db_size else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get database metrics: {str(e)}")
            return {'error': str(e)}
    
    def run_performance_test(self, duration_minutes: int = 5, interval_seconds: int = 30) -> List[Dict[str, Any]]:
        """Run continuous performance monitoring"""
        logger.info(f"Starting performance test for {duration_minutes} minutes...")
        
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        test_results = []
        
        while datetime.now() < end_time:
            timestamp = datetime.now()
            
            # Test all endpoints
            endpoint_results = {}
            for name, url in self.endpoints.items():
                endpoint_results[name] = self.measure_response_time(url)
            
            # Get system metrics
            system_metrics = self.get_system_metrics()
            
            # Get database metrics
            db_metrics = self.get_database_metrics()
            
            # Combine results
            test_result = {
                'timestamp': timestamp.isoformat(),
                'endpoints': endpoint_results,
                'system': system_metrics,
                'database': db_metrics
            }
            
            test_results.append(test_result)
            self.metrics = test_results
            
            # Log summary
            avg_response_time = sum(
                r['response_time'] for r in endpoint_results.values() 
                if r['response_time'] is not None
            ) / len([r for r in endpoint_results.values() if r['response_time'] is not None])
            
            logger.info(f"Test at {timestamp.strftime('%H:%M:%S')} - "
                       f"Avg Response: {avg_response_time:.2f}ms - "
                       f"CPU: {system_metrics.get('cpu', {}).get('percent', 0):.1f}% - "
                       f"Memory: {system_metrics.get('memory', {}).get('percent', 0):.1f}%")
            
            # Wait for next interval
            if datetime.now() < end_time:
                time.sleep(interval_seconds)
        
        logger.info(f"Performance test completed. Collected {len(test_results)} samples.")
        return test_results
    
    def analyze_results(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze performance test results"""
        if not results:
            return {'error': 'No results to analyze'}
        
        analysis = {
            'test_duration': {
                'start': results[0]['timestamp'],
                'end': results[-1]['timestamp'],
                'samples': len(results)
            },
            'endpoints': {},
            'system': {
                'cpu': {'avg': 0, 'max': 0, 'min': 100},
                'memory': {'avg': 0, 'max': 0, 'min': 100},
                'disk': {'avg': 0, 'max': 0, 'min': 100}
            },
            'database': {}
        }
        
        # Analyze endpoints
        for endpoint_name in self.endpoints.keys():
            response_times = [
                r['endpoints'][endpoint_name]['response_time'] 
                for r in results 
                if r['endpoints'][endpoint_name]['response_time'] is not None
            ]
            
            if response_times:
                analysis['endpoints'][endpoint_name] = {
                    'avg': sum(response_times) / len(response_times),
                    'min': min(response_times),
                    'max': max(response_times),
                    'samples': len(response_times),
                    'success_rate': len(response_times) / len(results) * 100
                }
        
        # Analyze system metrics
        cpu_values = [r['system']['cpu']['percent'] for r in results if 'cpu' in r.get('system', {})]
        memory_values = [r['system']['memory']['percent'] for r in results if 'memory' in r.get('system', {})]
        disk_values = [r['system']['disk']['percent'] for r in results if 'disk' in r.get('system', {})]
        
        for metric_name, values in [('cpu', cpu_values), ('memory', memory_values), ('disk', disk_values)]:
            if values:
                analysis['system'][metric_name] = {
                    'avg': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values)
                }
        
        # Analyze database metrics
        db_sizes = [r['database'].get('database_size', 0) for r in results if 'database_size' in r.get('database', {})]
        if db_sizes:
            analysis['database'] = {
                'size_avg': sum(db_sizes) / len(db_sizes),
                'size_max': max(db_sizes),
                'size_min': min(db_sizes)
            }
        
        return analysis
    
    def save_results(self, results: List[Dict[str, Any]], filename: str = None):
        """Save performance test results"""
        if not filename:
            filename = f"performance_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        output_dir = self.project_root / 'admin' / 'logs' / 'performance'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = output_dir / filename
        
        try:
            with open(output_file, 'w') as f:
                json.dump({
                    'metadata': {
                        'timestamp': datetime.now().isoformat(),
                        'samples': len(results),
                        'endpoints': list(self.endpoints.keys())
                    },
                    'results': results,
                    'analysis': self.analyze_results(results)
                }, f, indent=2)
            
            logger.info(f"Results saved to: {output_file}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")
            return False
    
    def generate_report(self, results: List[Dict[str, Any]]) -> str:
        """Generate a text report of performance test results"""
        analysis = self.analyze_results(results)
        
        report = []
        report.append("=" * 80)
        report.append("PERFORMANCE MONITORING REPORT")
        report.append("=" * 80)
        report.append(f"Test Duration: {analysis['test_duration']['start']} to {analysis['test_duration']['end']}")
        report.append(f"Total Samples: {analysis['test_duration']['samples']}")
        report.append("")
        
        # Endpoint Performance
        report.append("ENDPOINT PERFORMANCE")
        report.append("-" * 40)
        for endpoint, metrics in analysis['endpoints'].items():
            report.append(f"{endpoint.upper()}:")
            report.append(f"  Average Response: {metrics['avg']:.2f}ms")
            report.append(f"  Min Response: {metrics['min']:.2f}ms")
            report.append(f"  Max Response: {metrics['max']:.2f}ms")
            report.append(f"  Success Rate: {metrics['success_rate']:.1f}%")
            report.append("")
        
        # System Resources
        report.append("SYSTEM RESOURCES")
        report.append("-" * 40)
        for resource, metrics in analysis['system'].items():
            if 'avg' in metrics:
                report.append(f"{resource.upper()}:")
                report.append(f"  Average: {metrics['avg']:.1f}%")
                report.append(f"  Minimum: {metrics['min']:.1f}%")
                report.append(f"  Maximum: {metrics['max']:.1f}%")
                report.append("")
        
        # Database
        if analysis.get('database'):
            report.append("DATABASE METRICS")
            report.append("-" * 40)
            db = analysis['database']
            report.append(f"Average Size: {db['size_avg'] / 1024:.2f} KB")
            report.append(f"Maximum Size: {db['size_max'] / 1024:.2f} KB")
            report.append(f"Minimum Size: {db['size_min'] / 1024:.2f} KB")
            report.append("")
        
        # Recommendations
        report.append("RECOMMENDATIONS")
        report.append("-" * 40)
        
        for endpoint, metrics in analysis['endpoints'].items():
            if metrics['avg'] > 1000:  # > 1 second
                report.append(f"⚠️  {endpoint.upper()} response time is high ({metrics['avg']:.2f}ms)")
        
        if analysis['system']['cpu']['avg'] > 80:
            report.append("⚠️  High CPU usage detected")
        
        if analysis['system']['memory']['avg'] > 80:
            report.append("⚠️  High memory usage detected")
        
        if analysis['system']['disk']['avg'] > 90:
            report.append("🔴 High disk usage detected")
        
        report.append("=" * 80)
        
        return "\n".join(report)

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Performance monitoring utility')
    parser.add_argument('--duration', type=int, default=5, help='Test duration in minutes')
    parser.add_argument('--interval', type=int, default=30, help='Test interval in seconds')
    parser.add_argument('--save', action='store_true', help='Save results to file')
    parser.add_argument('--report', action='store_true', help='Generate text report')
    parser.add_argument('--analyze', help='Analyze existing results file')
    
    args = parser.parse_args()
    
    monitor = PerformanceMonitor()
    
    if args.analyze:
        # Analyze existing results
        try:
            with open(args.analyze, 'r') as f:
                results = json.load(f)['results']
            
            analysis = monitor.analyze_results(results)
            report = monitor.generate_report(results)
            
            print(report)
            
            if args.save:
                monitor.save_results(results, f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        except Exception as e:
            logger.error(f"Failed to analyze results: {str(e)}")
            sys.exit(1)
    
    else:
        # Run performance test
        results = monitor.run_performance_test(args.duration, args.interval)
        
        if args.save:
            monitor.save_results(results)
        
        if args.report:
            report = monitor.generate_report(results)
            print(report)
        
        # Print summary
        analysis = monitor.analyze_results(results)
        print(f"\n{'='*60}")
        print(f"PERFORMANCE TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Duration: {args.duration} minutes")
        print(f"Samples: {len(results)}")
        
        for endpoint, metrics in analysis['endpoints'].items():
            print(f"{endpoint}: {metrics['avg']:.2f}ms avg, {metrics['success_rate']:.1f}% success")
        
        print(f"CPU: {analysis['system']['cpu']['avg']:.1f}% avg")
        print(f"Memory: {analysis['system']['memory']['avg']:.1f}% avg")
        print(f"{'='*60}")

if __name__ == "__main__":
    main()
