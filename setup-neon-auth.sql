-- Create neon_auth schema for admin authentication
CREATE SCHEMA IF NOT EXISTS neon_auth;

-- Create admin_users table in neon_auth schema
CREATE TABLE IF NOT EXISTS neon_auth.admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  role TEXT DEFAULT 'admin'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON neon_auth.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON neon_auth.admin_users(username);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION neon_auth.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON neon_auth.admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON neon_auth.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION neon_auth.update_updated_at_column();
