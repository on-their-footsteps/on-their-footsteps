#!/usr/bin/env python3
"""
Deployment Script for On Their Footsteps Project

This script handles deployment to different environments with proper
validation, rollback capabilities, and health checks.
"""

import os
import sys
import subprocess
import argparse
import logging
from pathlib import Path
from datetime import datetime
import json
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DeploymentManager:
    def __init__(self, environment='development'):
        """Initialize deployment manager"""
        self.project_root = Path(__file__).parent.parent.parent
        self.environment = environment
        self.deployments_dir = self.project_root / 'admin' / 'deployments'
        self.deployments_dir.mkdir(exist_ok=True)
        
        # Environment configurations
        self.configs = {
            'development': {
                'docker_compose': 'docker-compose.yml',
                'health_check_url': 'http://localhost:8000/api/health',
                'frontend_url': 'http://localhost:3000'
            },
            'staging': {
                'docker_compose': 'admin/config/docker.staging.yml',
                'health_check_url': 'https://staging.on-their-footsteps.com/api/health',
                'frontend_url': 'https://staging.on-their-footsteps.com'
            },
            'production': {
                'docker_compose': 'admin/config/docker.prod.yml',
                'health_check_url': 'https://on-their-footsteps.com/api/health',
                'frontend_url': 'https://on-their-footsteps.com'
            }
        }
        
        self.config = self.configs.get(environment, self.configs['development'])
    
    def pre_deployment_checks(self):
        """Run pre-deployment validation checks"""
        logger.info("Running pre-deployment checks...")
        
        checks = []
        
        # Check if required files exist
        required_files = [
            'docker-compose.yml',
            'Dockerfile.backend',
            'Dockerfile.frontend',
            'backend/requirements.txt',
            'frontend/package.json'
        ]
        
        for file_path in required_files:
            if not (self.project_root / file_path).exists():
                checks.append(f"❌ Missing required file: {file_path}")
            else:
                checks.append(f"✅ Found: {file_path}")
        
        # Check Docker availability
        try:
            result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
            checks.append(f"✅ Docker: {result.stdout.strip()}")
        except FileNotFoundError:
            checks.append("❌ Docker not found")
        
        # Check Docker Compose availability
        try:
            result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True)
            checks.append(f"✅ Docker Compose: {result.stdout.strip()}")
        except FileNotFoundError:
            checks.append("❌ Docker Compose not found")
        
        # Check environment variables
        env_file = self.project_root / '.env'
        if env_file.exists():
            checks.append("✅ Environment file found")
        else:
            checks.append("⚠️  No .env file found (using defaults)")
        
        # Print results
        for check in checks:
            logger.info(check)
        
        # Fail if critical checks fail
        failed_checks = [c for c in checks if c.startswith('❌')]
        if failed_checks:
            logger.error("Pre-deployment checks failed")
            return False
        
        logger.info("Pre-deployment checks passed")
        return True
    
    def build_images(self):
        """Build Docker images"""
        logger.info("Building Docker images...")
        
        try:
            # Build backend image
            logger.info("Building backend image...")
            result = subprocess.run([
                'docker', 'build', 
                '-f', 'Dockerfile.backend',
                '-t', 'on-their-footsteps-backend:latest',
                '.'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Backend build failed: {result.stderr}")
                return False
            
            # Build frontend image
            logger.info("Building frontend image...")
            result = subprocess.run([
                'docker', 'build',
                '-f', 'Dockerfile.frontend', 
                '-t', 'on-their-footsteps-frontend:latest',
                '.'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Frontend build failed: {result.stderr}")
                return False
            
            logger.info("Images built successfully")
            return True
            
        except Exception as e:
            logger.error(f"Build failed: {str(e)}")
            return False
    
    def deploy_services(self):
        """Deploy services using Docker Compose"""
        logger.info(f"Deploying services to {self.environment}...")
        
        try:
            # Stop existing services
            logger.info("Stopping existing services...")
            subprocess.run([
                'docker-compose', '-f', self.config['docker_compose'],
                'down'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            # Start services
            logger.info("Starting services...")
            result = subprocess.run([
                'docker-compose', '-f', self.config['docker_compose'],
                'up', '-d', '--build'
            ], cwd=self.project_root, capture_output=True, text=True)
            
            if result.returncode != 0:
                logger.error(f"Deployment failed: {result.stderr}")
                return False
            
            logger.info("Services deployed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Deployment failed: {str(e)}")
            return False
    
    def post_deployment_checks(self):
        """Run post-deployment health checks"""
        logger.info("Running post-deployment checks...")
        
        import requests
        import time
        
        # Wait for services to start
        logger.info("Waiting for services to start...")
        time.sleep(30)
        
        try:
            # Check backend health
            response = requests.get(self.config['health_check_url'], timeout=10)
            if response.status_code == 200:
                logger.info("✅ Backend health check passed")
            else:
                logger.error(f"❌ Backend health check failed: {response.status_code}")
                return False
            
            # Check frontend
            response = requests.get(self.config['frontend_url'], timeout=10)
            if response.status_code == 200:
                logger.info("✅ Frontend health check passed")
            else:
                logger.error(f"❌ Frontend health check failed: {response.status_code}")
                return False
            
            logger.info("Post-deployment checks passed")
            return True
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Health check failed: {str(e)}")
            return False
    
    def create_deployment_record(self, success=True):
        """Create a deployment record"""
        deployment_record = {
            'timestamp': datetime.now().isoformat(),
            'environment': self.environment,
            'success': success,
            'git_commit': self._get_git_commit(),
            'docker_images': self._get_docker_images()
        }
        
        deployment_file = self.deployments_dir / f"deployment_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        with open(deployment_file, 'w') as f:
            json.dump(deployment_record, f, indent=2)
        
        logger.info(f"Deployment record created: {deployment_file}")
        return deployment_file
    
    def _get_git_commit(self):
        """Get current git commit hash"""
        try:
            result = subprocess.run(['git', 'rev-parse', 'HEAD'], 
                                  capture_output=True, text=True, cwd=self.project_root)
            return result.stdout.strip() if result.returncode == 0 else None
        except:
            return None
    
    def _get_docker_images(self):
        """Get deployed Docker image information"""
        try:
            result = subprocess.run(['docker', 'images', '--format', 'json'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                import json
                images = json.loads(result.stdout)
                return [img for img in images if 'on-their-footsteps' in img.get('Repository', '')]
        except:
            pass
        return []
    
    def rollback(self, deployment_file=None):
        """Rollback to previous deployment"""
        logger.info("Initiating rollback...")
        
        if not deployment_file:
            # Get latest successful deployment
            deployment_files = list(self.deployments_dir.glob("deployment_*.json"))
            deployment_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            for dep_file in deployment_files:
                with open(dep_file) as f:
                    record = json.load(f)
                    if record.get('success') and record.get('environment') == self.environment:
                        deployment_file = dep_file
                        break
            
            if not deployment_file:
                logger.error("No previous successful deployment found")
                return False
        
        logger.info(f"Rolling back to: {deployment_file}")
        
        # Implement rollback logic here
        # This would typically involve:
        # 1. Stopping current services
        # 2. Pulling previous images
        # 3. Restarting services with previous images
        # 4. Running health checks
        
        logger.warning("Rollback functionality not fully implemented")
        return False
    
    def deploy(self):
        """Execute full deployment process"""
        logger.info(f"Starting deployment to {self.environment}")
        
        # Run pre-deployment checks
        if not self.pre_deployment_checks():
            self.create_deployment_record(success=False)
            return False
        
        # Build images
        if not self.build_images():
            self.create_deployment_record(success=False)
            return False
        
        # Deploy services
        if not self.deploy_services():
            self.create_deployment_record(success=False)
            return False
        
        # Run post-deployment checks
        if not self.post_deployment_checks():
            self.create_deployment_record(success=False)
            return False
        
        # Create deployment record
        self.create_deployment_record(success=True)
        
        logger.info(f"✅ Deployment to {self.environment} completed successfully")
        return True

def main():
    parser = argparse.ArgumentParser(description='Deployment utility')
    parser.add_argument('action', choices=['deploy', 'rollback', 'status'],
                       help='Action to perform')
    parser.add_argument('--env', default='development',
                       choices=['development', 'staging', 'production'],
                       help='Target environment')
    parser.add_argument('--deployment', help='Deployment file to rollback to')
    
    args = parser.parse_args()
    
    deployer = DeploymentManager(args.env)
    
    if args.action == 'deploy':
        if deployer.deploy():
            print("✅ Deployment successful")
        else:
            print("❌ Deployment failed")
            sys.exit(1)
    
    elif args.action == 'rollback':
        if deployer.rollback(args.deployment):
            print("✅ Rollback successful")
        else:
            print("❌ Rollback failed")
            sys.exit(1)
    
    elif args.action == 'status':
        # Show deployment status
        print(f"Environment: {args.env}")
        print(f"Config: {deployer.config}")
        print("Use 'deploy' action to deploy or 'rollback' to rollback")

if __name__ == "__main__":
    main()
