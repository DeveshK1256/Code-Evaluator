export const INTELLIGENCE_TABLES_SQL = `
-- ─── Intelligence Status Enum ──────────────────────────────
CREATE TYPE intelligence_status AS ENUM (
  'pending', 'chunking', 'analyzing_architecture',
  'analyzing_features', 'analyzing_security',
  'analyzing_documentation', 'analyzing_problem_statement',
  'building_knowledge_graph', 'complete', 'failed'
);

-- ─── Intelligence Sessions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS intelligence_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          intelligence_status NOT NULL DEFAULT 'pending',
  progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  agent_results   JSONB NOT NULL DEFAULT '{}',
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

-- ─── Repository Intelligence Model (canonical output) ──────
CREATE TABLE IF NOT EXISTS repository_intelligence (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id   UUID NOT NULL UNIQUE REFERENCES repositories(id) ON DELETE CASCADE,
  session_id      UUID REFERENCES intelligence_sessions(id) ON DELETE SET NULL,
  version         TEXT NOT NULL DEFAULT '1.0',
  summary         JSONB NOT NULL DEFAULT '{}',
  architecture    JSONB NOT NULL DEFAULT '{}',
  features        JSONB NOT NULL DEFAULT '{}',
  apis            JSONB NOT NULL DEFAULT '{}',
  database        JSONB NOT NULL DEFAULT '{}',
  auth            JSONB NOT NULL DEFAULT '{}',
  dependencies    JSONB NOT NULL DEFAULT '{}',
  documentation   JSONB NOT NULL DEFAULT '{}',
  problem_statement JSONB NOT NULL DEFAULT '{}',
  knowledge_graph JSONB NOT NULL DEFAULT '{}',
  navigation      JSONB NOT NULL DEFAULT '{}',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Knowledge Graph Nodes (searchable) ───────────────────
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id UUID NOT NULL REFERENCES repository_intelligence(id) ON DELETE CASCADE,
  node_id         TEXT NOT NULL,
  type            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  file_path       TEXT,
  metadata        JSONB DEFAULT '{}',
  UNIQUE(intelligence_id, node_id)
);

-- ─── Knowledge Graph Edges ────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id UUID NOT NULL REFERENCES repository_intelligence(id) ON DELETE CASCADE,
  source_node_id  TEXT NOT NULL,
  target_node_id  TEXT NOT NULL,
  relation        TEXT NOT NULL,
  confidence      REAL DEFAULT 1.0
);

-- ─── AI Findings (all agent outputs logged for audit) ─────
CREATE TABLE IF NOT EXISTS ai_findings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intelligence_id UUID NOT NULL REFERENCES repository_intelligence(id) ON DELETE CASCADE,
  agent_name      TEXT NOT NULL,
  finding_type    TEXT NOT NULL,
  description     TEXT NOT NULL,
  confidence      REAL NOT NULL DEFAULT 0.5,
  evidence_type   TEXT NOT NULL DEFAULT 'inferred',
  file_paths      TEXT[] DEFAULT '{}',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AI Cache ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key       TEXT NOT NULL UNIQUE,
  agent_name      TEXT NOT NULL,
  input_hash      TEXT NOT NULL,
  output          JSONB NOT NULL,
  tokens_used     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX idx_intelligence_sessions_repo ON intelligence_sessions(repository_id);
CREATE INDEX idx_intelligence_sessions_user ON intelligence_sessions(user_id);
CREATE INDEX idx_intelligence_sessions_status ON intelligence_sessions(status);
CREATE INDEX idx_repository_intelligence_repo ON repository_intelligence(repository_id);
CREATE INDEX idx_kg_nodes_intelligence ON knowledge_graph_nodes(intelligence_id);
CREATE INDEX idx_kg_edges_intelligence ON knowledge_graph_edges(intelligence_id);
CREATE INDEX idx_kg_nodes_type ON knowledge_graph_nodes(type);
CREATE INDEX idx_ai_findings_intelligence ON ai_findings(intelligence_id);
CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);

-- ─── RLS ──────────────────────────────────────────────────
ALTER TABLE intelligence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own intelligence sessions"
  ON intelligence_sessions FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users own intelligence data"
  ON repository_intelligence FOR ALL
  USING (repository_id IN (SELECT id FROM repositories WHERE user_id = auth.uid()));

CREATE POLICY "Users own graph data"
  ON knowledge_graph_nodes FOR ALL
  USING (intelligence_id IN (
    SELECT ri.id FROM repository_intelligence ri
    JOIN repositories r ON r.id = ri.repository_id WHERE r.user_id = auth.uid()
  ));

CREATE POLICY "Users own graph edges"
  ON knowledge_graph_edges FOR ALL
  USING (intelligence_id IN (
    SELECT ri.id FROM repository_intelligence ri
    JOIN repositories r ON r.id = ri.repository_id WHERE r.user_id = auth.uid()
  ));
`;

export const INTELLIGENCE_SCHEMA_VERSION = "3.0.0";
export const INTELLIGENCE_SCHEMA_CHANGE = "Added repository intelligence tables";
