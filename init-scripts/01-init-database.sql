-- Aether Link Database Initialization
-- This script sets up the initial database schema for Aether Link

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Extensions table
CREATE TABLE IF NOT EXISTS extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extension VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    technology VARCHAR(20) NOT NULL CHECK (technology IN ('sip', 'iax2', 'dahdi', 'pjsip')),
    secret VARCHAR(255),
    context VARCHAR(50) DEFAULT 'default',
    caller_id VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trunks table
CREATE TABLE IF NOT EXISTS trunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    technology VARCHAR(20) NOT NULL CHECK (technology IN ('sip', 'iax2', 'dahdi', 'pjsip')),
    host VARCHAR(255) NOT NULL,
    port INTEGER DEFAULT 5060,
    username VARCHAR(100),
    secret VARCHAR(255),
    context VARCHAR(50) DEFAULT 'from-trunk',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call Detail Records (CDR) table
CREATE TABLE IF NOT EXISTS cdr (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(100) UNIQUE NOT NULL,
    caller_id VARCHAR(255),
    source VARCHAR(100),
    destination VARCHAR(100),
    context VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    answer_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 0,
    billable_seconds INTEGER DEFAULT 0,
    disposition VARCHAR(20) CHECK (disposition IN ('answered', 'no-answer', 'busy', 'failed')),
    hangup_cause VARCHAR(50),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_extensions_extension ON extensions(extension);
CREATE INDEX IF NOT EXISTS idx_extensions_user_id ON extensions(user_id);
CREATE INDEX IF NOT EXISTS idx_cdr_start_time ON cdr(start_time);
CREATE IF NOT EXISTS idx_cdr_caller_id ON cdr(caller_id);
CREATE IF NOT EXISTS idx_cdr_source ON cdr(source);
CREATE IF NOT EXISTS idx_cdr_destination ON cdr(destination);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extensions_updated_at BEFORE UPDATE ON extensions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trunks_updated_at BEFORE UPDATE ON trunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role, first_name, last_name)
VALUES (
    'admin',
    'admin@aether-link.local',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LFvOe', -- admin123
    'admin',
    'System',
    'Administrator'
) ON CONFLICT (username) DO NOTHING;

-- Insert default settings
INSERT INTO settings (key, value, description, category, is_public) VALUES
    ('company_name', 'Aether Link', 'Company name displayed in UI', 'general', true),
    ('max_call_duration', '3600', 'Maximum call duration in seconds', 'call_limits', false),
    ('allow_international', 'true', 'Allow international calls', 'call_limits', false),
    ('recording_enabled', 'false', 'Enable call recording', 'features', false),
    ('voicemail_enabled', 'true', 'Enable voicemail', 'features', true)
ON CONFLICT (key) DO NOTHING;

-- Create default context for extensions
INSERT INTO settings (key, value, description, category, is_public) VALUES
    ('default_context', 'default', 'Default dialplan context', 'asterisk', false)
ON CONFLICT (key) DO NOTHING;

-- Grant permissions to aether user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aether;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aether;