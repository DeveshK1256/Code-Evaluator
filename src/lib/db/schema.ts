/**
 * Database Schema Definitions for Repository Ingestion.
 *
 * SQL migration statements for the repository management tables.
 * These are the source of truth — run against Supabase PostgreSQL.
 */

export const REPOSITORY_TABLES_SQL = `
-- ─── Repository Status Enum ──────────────────────────────────
CREATE TYPE repository_source AS ENUM ('github', 'zip', 'folder', 'readme');
CREATE TYPE repository_status AS ENUM (
  'pending', 'uploading', 'validating', 'extracting',
  'scanning', 'detecting', 'manifest_ready', 'ready_for_analysis',
  'analysis_running', 'evaluation_complete', 'failed', 'archived'
);
CREATE TYPE upload_status AS ENUM ('uploading', 'validating', 'processing', 'completed', 'failed');

-- ─── Repositories ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repositories (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  source          repository_source NOT NULL,
  status          repository_status NOT NULL DEFAULT 'pending',
  status_message  TEXT,
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- GitHub specific
  github_url      TEXT,
  github_owner    TEXT,
  github_repo     TEXT,
  default_branch  TEXT,
  visibility      TEXT DEFAULT 'unknown',

  -- Metadata
  description     TEXT,
  license         TEXT,
  stars           INTEGER DEFAULT 0,
  forks           INTEGER DEFAULT 0,
  open_issues     INTEGER DEFAULT 0,
  size_bytes      BIGINT DEFAULT 0,
  file_count      INTEGER DEFAULT 0,
  primary_language TEXT,
  topics          TEXT[] DEFAULT '{}',
  last_updated    TIMESTAMPTZ,
  commit_count    INTEGER DEFAULT 0,
  contributor_count INTEGER DEFAULT 0,
  has_readme      BOOLEAN DEFAULT FALSE,
  has_license     BOOLEAN DEFAULT FALSE,
  has_ci_cd       BOOLEAN DEFAULT FALSE,

  -- Storage
  workspace_path      TEXT,
  content_fingerprint TEXT,
  manifest_id         UUID,

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Repository Files ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repository_files (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path            TEXT NOT NULL,
  name            TEXT NOT NULL,
  extension       TEXT NOT NULL DEFAULT '',
  size_bytes      BIGINT NOT NULL DEFAULT 0,
  mime_type       TEXT,
  is_binary       BOOLEAN NOT NULL DEFAULT FALSE,
  is_generated    BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  is_config       BOOLEAN NOT NULL DEFAULT FALSE,
  content_hash    TEXT
);

-- ─── Technology Profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS technology_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,
  categories      JSONB NOT NULL DEFAULT '{}',
  detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Repository Manifests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS repository_manifests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,
  version         TEXT NOT NULL DEFAULT '1.0',
  metadata        JSONB NOT NULL DEFAULT '{}',
  file_summary    JSONB NOT NULL DEFAULT '{}',
  technologies    JSONB NOT NULL DEFAULT '{}',
  dependencies    JSONB NOT NULL DEFAULT '[]',
  configuration   JSONB NOT NULL DEFAULT '{}',
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Uploads ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  source          repository_source NOT NULL,
  status          upload_status NOT NULL DEFAULT 'uploading',
  file_name       TEXT,
  file_size_bytes BIGINT,
  mime_type       TEXT,
  progress        INTEGER NOT NULL DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Indexes ──────────────────────────────────────────────────
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_status ON repositories(status);
CREATE INDEX idx_repositories_source ON repositories(source);
CREATE INDEX idx_repositories_created_at ON repositories(created_at DESC);
CREATE UNIQUE INDEX idx_repositories_github ON repositories(user_id, github_owner, github_repo)
  WHERE github_url IS NOT NULL;
CREATE INDEX idx_repository_files_repo_id ON repository_files(repository_id);
CREATE INDEX idx_repository_files_extension ON repository_files(extension);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_repository_id ON uploads(repository_id);

-- ─── Updated At Trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_repositories_updated_at
  BEFORE UPDATE ON repositories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Row Level Security ──────────────────────────────────────
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own repositories"
  ON repositories FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own repository files"
  ON repository_files FOR ALL
  USING (repository_id IN (
    SELECT id FROM repositories WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own technology profiles"
  ON technology_profiles FOR ALL
  USING (repository_id IN (
    SELECT id FROM repositories WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own manifests"
  ON repository_manifests FOR ALL
  USING (repository_id IN (
    SELECT id FROM repositories WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own uploads"
  ON uploads FOR ALL
  USING (user_id = auth.uid());
`;

/**
 * Schema version for tracking migrations.
 */
export const SCHEMA_VERSION = "2.0.0";
export const SCHEMA_CHANGE = "Added repository ingestion tables";
