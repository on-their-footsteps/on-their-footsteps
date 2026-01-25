# 🛠️ Admin Directory

This directory contains administrative tools and scripts for managing the "On Their Footsteps" project.

## 📁 Directory Structure

```
admin/
├── README.md                 # This file
├── scripts/                  # Management scripts
│   ├── backup.sh            # Database backup
│   ├── deploy.sh            # Deployment script
│   ├── cleanup.sh           # Clean up temporary files
│   └── health_check.sh      # System health monitoring
├── config/                   # Configuration files
│   ├── nginx.conf           # Nginx configuration
│   ├── docker.prod.yml      # Production Docker compose
│   └── env.example          # Environment variables template
├── logs/                     # Administrative logs
├── monitoring/               # Monitoring tools
│   ├── performance.py       # Performance monitoring
│   └── analytics.py         # Usage analytics
└── tools/                    # Utility tools
    ├── db_manager.py        # Database management utilities
    ├── user_manager.py       # User management utilities
    └── content_manager.py    # Content management utilities
```

## 🚀 Quick Start

### Database Management
```bash
# Create backup
python admin/scripts/backup.py

# Restore from backup
python admin/scripts/restore.py backup_file.db

# Clean up old data
python admin/scripts/cleanup.py
```

### Deployment
```bash
# Deploy to production
python admin/scripts/deploy.py --env production

# Deploy to staging
python admin/scripts/deploy.py --env staging
```

### Health Monitoring
```bash
# Check system health
python admin/monitoring/health_check.py

# View performance metrics
python admin/monitoring/performance.py
```

## 📋 Available Scripts

### Database Scripts
- **backup.py**: Create automated database backups
- **restore.py**: Restore database from backup files
- **migrate.py**: Run database migrations
- **seed.py**: Populate database with sample data

### Deployment Scripts
- **deploy.py**: Deploy application to different environments
- **rollback.py**: Rollback to previous deployment
- **health_check.py**: Verify deployment health

### Monitoring Scripts
- **performance.py**: Monitor application performance
- **analytics.py**: Generate usage analytics
- **log_analyzer.py**: Analyze application logs

## 🔧 Configuration

### Environment Variables
Copy `admin/config/env.example` to `.env` and update the values:

```bash
cp admin/config/env.example .env
```

### Docker Configuration
Production Docker configuration is in `admin/config/docker.prod.yml`.

## 📊 Monitoring

The admin directory provides tools for:

- **Performance Monitoring**: CPU, memory, and response time tracking
- **User Analytics**: User engagement and usage patterns
- **Error Tracking**: Automatic error detection and reporting
- **Health Checks**: Service availability and dependency monitoring

## 🛡️ Security

- **User Management**: Create, update, and delete user accounts
- **Access Control**: Manage user permissions and roles
- **Security Audits**: Regular security vulnerability scans
- **Data Protection**: Automated data encryption and backup

## 📝 Documentation

- **API Documentation**: Auto-generated API docs
- **Deployment Guide**: Step-by-step deployment instructions
- **Troubleshooting**: Common issues and solutions
- **Maintenance Schedule**: Regular maintenance tasks

## 🔄 Automation

All scripts are designed to be run automatically:

```bash
# Set up cron jobs for regular tasks
python admin/scripts/setup_cron.py

# Run all maintenance tasks
python admin/scripts/maintenance.py --all
```

## 📞 Support

For issues with admin tools:
1. Check the logs in `admin/logs/`
2. Run the health check script
3. Review the troubleshooting guide
4. Contact the development team

---

**Note**: This directory should only be accessed by authorized administrators.
