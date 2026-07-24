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
  file_summary JSONB DEFAULT '{}',
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

-- ─── Evaluation Profiles ────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_profiles (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  weights         JSONB NOT NULL DEFAULT '{}',
  is_default      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Evaluation Sessions ────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      TEXT REFERENCES evaluation_profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending',
  progress        INTEGER NOT NULL DEFAULT 0,
  selected_modules TEXT[] NOT NULL DEFAULT '{}',
  overall_score   REAL,
  overall_grade   TEXT,
  overall_confidence REAL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Module Results ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS module_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL,
  module_name     TEXT NOT NULL,
  score           REAL NOT NULL,
  grade           TEXT NOT NULL,
  confidence      TEXT NOT NULL,
  confidence_value REAL NOT NULL DEFAULT 0.5,
  summary         TEXT,
  strengths       JSONB NOT NULL DEFAULT '[]',
  weaknesses      JSONB NOT NULL DEFAULT '[]',
  risks           JSONB NOT NULL DEFAULT '[]',
  missing_practices TEXT[] DEFAULT '{}',
  evidence        JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB NOT NULL DEFAULT '[]',
  evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, module_id)
);

-- ─── Evidence Items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL,
  finding_title   TEXT NOT NULL,
  description     TEXT NOT NULL,
  file_path       TEXT,
  line_number     INTEGER,
  evidence_type   TEXT NOT NULL DEFAULT 'inferred',
  confidence      TEXT NOT NULL DEFAULT 'medium',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Recommendations ────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  severity        TEXT NOT NULL,
  confidence      TEXT NOT NULL DEFAULT 'medium',
  suggested_fix   TEXT,
  estimated_effort TEXT DEFAULT 'hours',
  expected_improvement REAL DEFAULT 0,
  priority        INTEGER DEFAULT 0,
  roadmap_phase   TEXT DEFAULT 'next_sprint',
  affected_files  TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────
CREATE INDEX idx_eval_sessions_repo ON evaluation_sessions(repository_id);
CREATE INDEX idx_eval_sessions_user ON evaluation_sessions(user_id);
CREATE INDEX idx_eval_sessions_status ON evaluation_sessions(status);
CREATE INDEX idx_module_results_session ON module_results(session_id);
CREATE INDEX idx_evidence_session ON evidence_items(session_id);
CREATE INDEX idx_recommendations_session ON recommendations(session_id);

-- ─── RLS ────────────────────────────────────────────────
ALTER TABLE evaluation_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles" ON evaluation_profiles FOR SELECT USING (true);
CREATE POLICY "Users own sessions" ON evaluation_sessions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users own module results" ON module_results FOR ALL USING (
  session_id IN (SELECT id FROM evaluation_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users own evidence" ON evidence_items FOR ALL USING (
  session_id IN (SELECT id FROM evaluation_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "Users own recommendations" ON recommendations FOR ALL USING (
  session_id IN (SELECT id FROM evaluation_sessions WHERE user_id = auth.uid())
);
`;
