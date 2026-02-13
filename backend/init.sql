-- Initialize database for OnTheirFootsteps application
-- This script runs automatically when PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Entity Framework migrations, but we can add them here for initial setup

-- Sample data can be added here if needed
-- For example, creating initial admin user or default categories

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'OnTheirFootsteps database initialized successfully';
END $$;
