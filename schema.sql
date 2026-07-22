-- ─── Repositories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repositories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('github', 'zip', 'folder', 'readme')),
  status TEXT NOT NULL DEFAULT 'pending',
  status_message TEXT,
  progress INTEGER DEFAULT 0,
  github_url TEXT,
  github_owner TEXT,
  github_repo TEXT,
  default_branch TEXT,
  visibility TEXT DEFAULT 'unknown',
  description TEXT,
  license TEXT,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  size_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  primary_language TEXT,
  topics TEXT[] DEFAULT '{}',
  last_updated TIMESTAMPTZ,
  commit_count INTEGER DEFAULT 0,
  contributor_count INTEGER DEFAULT 0,
  has_readme BOOLEAN DEFAULT FALSE,
  has_license BOOLEAN DEFAULT FALSE,
  has_ci_cd BOOLEAN DEFAULT FALSE,
  workspace_path TEXT,
  content_fingerprint TEXT,
  manifest_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_status ON repositories(status);

-- ─── Uploads ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('github', 'zip', 'folder', 'readme')),
  status TEXT NOT NULL DEFAULT 'uploading',
  file_name TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_uploads_repository_id ON uploads(repository_id);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);

-- ─── Repository Manifests ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS repository_manifests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  files JSONB DEFAULT '[]',
  technologies JSONB DEFAULT '{}',
  dependencies JSONB DEFAULT '[]',
  configuration JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_manifests_repository_id ON repository_manifests(repository_id);

-- ─── Technology Profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS technology_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  categories JSONB DEFAULT '{}',
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tech_profiles_repository_id ON technology_profiles(repository_id);

-- ─── Repository Files ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS repository_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  name TEXT NOT NULL,
  extension TEXT NOT NULL,
  size_bytes BIGINT DEFAULT 0,
  mime_type TEXT,
  is_binary BOOLEAN DEFAULT FALSE,
  is_generated BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  is_config BOOLEAN DEFAULT FALSE,
  content_hash TEXT
);

CREATE INDEX idx_files_repository_id ON repository_files(repository_id);

-- ─── AI Cache ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  prompt_hash TEXT NOT NULL,
  response TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
