-- AI Blogger — Neon PostgreSQL Schema
-- Run: npm run migrate

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            VARCHAR(20)  NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  plan            VARCHAR(20)  NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','pro','enterprise')),
  blogs_generated INTEGER     NOT NULL DEFAULT 0,
  blogs_limit     INTEGER     NOT NULL DEFAULT 5,
  is_verified     BOOLEAN     NOT NULL DEFAULT false,
  avatar          TEXT,
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT        UNIQUE NOT NULL,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rt_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_rt_user  ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  token      TEXT        UNIQUE NOT NULL,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blogs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  slug            VARCHAR(600) UNIQUE NOT NULL,
  content         TEXT        NOT NULL,
  excerpt         TEXT,
  tags            TEXT[]      DEFAULT '{}',
  category        VARCHAR(100) DEFAULT 'General',
  status          VARCHAR(20)  NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  featured_image  TEXT,
  seo_title       VARCHAR(200),
  seo_description TEXT,
  seo_score       INTEGER     DEFAULT 0,
  word_count      INTEGER     DEFAULT 0,
  read_time       INTEGER     DEFAULT 1,
  views           INTEGER     NOT NULL DEFAULT 0,
  is_ai_generated BOOLEAN     NOT NULL DEFAULT false,
  ai_topic        TEXT,
  ai_tone         VARCHAR(50),
  ai_structure    VARCHAR(50),
  humanized       BOOLEAN     DEFAULT false,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blogs_user   ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_date   ON blogs(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_generations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blog_id    UUID        REFERENCES blogs(id) ON DELETE SET NULL,
  topic      TEXT        NOT NULL,
  length     VARCHAR(20),
  tone       VARCHAR(50),
  structure  VARCHAR(50),
  word_count INTEGER,
  seo_score  INTEGER,
  keywords   TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aigen_user ON ai_generations(user_id);

CREATE TABLE IF NOT EXISTS trending_cache (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  geo        VARCHAR(10) NOT NULL,
  keywords   JSONB       NOT NULL DEFAULT '[]',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
