export const EVALUATION_TABLES_SQL = `
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

export const EVALUATION_SCHEMA_VERSION = "4.0.0";
