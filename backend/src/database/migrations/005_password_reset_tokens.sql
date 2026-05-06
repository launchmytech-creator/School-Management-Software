-- Migration: 005_password_reset_tokens
-- Description: Create password_reset_tokens table for secure password reset functionality

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Add comment for documentation
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiration for secure password recovery';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hashed token value for security';
COMMENT ON COLUMN password_reset_tokens.used IS 'Flag to mark tokens as used to prevent reuse';
