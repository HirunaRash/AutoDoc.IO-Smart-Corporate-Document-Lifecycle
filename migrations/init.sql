-- AutoDoc.IO — initial schema
-- SQLAlchemy will handle table creation via init_db(),
-- but this file seeds the DB for the Docker entrypoint.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The actual tables are created by SQLAlchemy on startup.
-- This file is intentionally minimal; add seed data below if needed.

-- Example: create a test user (password: "testpass123" bcrypt hash)
-- INSERT INTO users (id, email, hashed_password, full_name)
-- VALUES (
--   uuid_generate_v4(),
--   'demo@autodoc.io',
--   '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36Z6IM9O6bJlZxmgYSZSUSe',
--   'Demo User'
-- ) ON CONFLICT DO NOTHING;
