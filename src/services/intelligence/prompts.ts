/**
 * Modular prompt templates for each AI agent.
 * Each prompt is designed to be focused and deterministic.
 */

export const PROMPTS = {
  // ─── Repository Summary Agent ────────────────────────────
  summary: {
    system: `You are a software architect analyzing a repository. Your task is to understand what the application does, who it serves, and its core purpose.

Analyze the provided repository manifest, file listing, and feature chunks to produce a concise but comprehensive summary.

Rules:
1. Base your analysis on actual file contents — do not guess.
2. If you are uncertain about something, state it as an inference with reduced confidence.
3. Cite specific files as evidence for your conclusions.
4. Distinguish between what you can see (deterministic) and what you infer.
5. Output only valid JSON matching the schema.`,
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        purpose: { type: "string" },
        targetUsers: { type: "array", items: { type: "string" } },
        mainWorkflows: { type: "array", items: { type: "string" } },
        businessProblem: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        evidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["deterministic", "inferred"] },
              description: { type: "string" },
              filePath: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
        isInferred: { type: "boolean" },
      },
      required: ["name", "description", "purpose", "confidence", "isInferred"],
    },
  },

  // ─── Architecture Agent ──────────────────────────────────
  architecture: {
    system: `You are a software architecture expert analyzing a repository's structure and design patterns.

Examine the manifest, file tree, configuration, and key files to determine:
1. The architectural pattern (monolith, microservices, layered, etc.)
2. System layers and modules
3. Data flow between components
4. Which files are most critical to understanding the system

Rules:
1. Provide specific file evidence for each architectural finding.
2. If multiple patterns could apply, list the most likely with confidence.
3. Clearly label file paths for key files.
4. Output valid JSON matching the schema.`,
    schema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          enum: [
            "monolith", "modular_monolith", "microservices", "layered",
            "feature_based", "clean_architecture", "mvc", "hexagonal",
            "event_driven", "unknown",
          ],
        },
        patternConfidence: { type: "number", minimum: 0, maximum: 1 },
        patternEvidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              description: { type: "string" },
              filePath: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
        layers: { type: "array", items: { type: "string" } },
        modules: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              path: { type: "string" },
              description: { type: "string" },
              responsibility: { type: "string" },
              keyFiles: { type: "array", items: { type: "string" } },
              confidence: { type: "number" },
            },
          },
        },
        entryPoints: { type: "array", items: { type: "string" } },
        dataFlow: {
          type: "object",
          properties: {
            description: { type: "string" },
            flows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  source: { type: "string" },
                  target: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        keyFiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string" },
              importance: { type: "string", enum: ["critical", "high", "medium", "low"] },
              reason: { type: "string" },
            },
          },
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        isInferred: { type: "boolean" },
      },
      required: ["pattern", "patternConfidence", "confidence", "isInferred"],
    },
  },

  // ─── Features Agent ──────────────────────────────────────
  features: {
    system: `You are a product analyst identifying features and capabilities in a software project.

Analyze the provided chunks, file listing, and manifest to identify:
1. What features exist (authentication, CRUD, search, payments, etc.)
2. Which features appear complete vs partial
3. Where feature code lives in the project

Rules:
1. Only list features you can find evidence for in the files.
2. Name specific files that implement each feature.
3. Label features as "complete", "partial", or "incomplete" based on what you see.
4. If a feature appears to be scaffolded but not implemented, label it as "incomplete".
5. Output valid JSON.`,
    schema: {
      type: "object",
      properties: {
        features: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              category: {
                type: "string",
                enum: [
                  "authentication", "user_management", "dashboard", "crud",
                  "search", "filtering", "notifications", "file_upload",
                  "payments", "ai_features", "admin_panel", "analytics",
                  "settings", "chat", "maps", "offline",
                  "document_management", "background_jobs", "api",
                  "reporting", "other",
                ],
              },
              files: { type: "array", items: { type: "string" } },
              status: { type: "string", enum: ["complete", "partial", "incomplete", "unknown"] },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              evidence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    description: { type: "string" },
                    filePath: { type: "string" },
                    confidence: { type: "number" },
                  },
                },
              },
            },
          },
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        isInferred: { type: "boolean" },
      },
      required: ["features", "confidence", "isInferred"],
    },
  },

  // ─── Security Context Agent ──────────────────────────────
  security: {
    system: `You are a security engineer reviewing authentication and authorization in a codebase.

Analyze the provided files to understand:
1. Authentication provider and login flow
2. Session management
3. Protected routes
4. Authorization strategy

Rules:
1. Only report what you can see — do not assume security vulnerabilities.
2. This is NOT a security audit — it is context extraction only.
3. Cite specific files as evidence.
4. Output valid JSON.`,
    schema: {
      type: "object",
      properties: {
        provider: { type: "string" },
        type: {
          type: "string",
          enum: [
            "email_password", "oauth", "sso", "phone",
            "magic_link", "multiple", "unknown",
          ],
        },
        loginFlow: { type: "string" },
        sessionManagement: { type: "string" },
        protectedRoutes: { type: "array", items: { type: "string" } },
        authorizationStrategy: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        isInferred: { type: "boolean" },
        evidence: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string" },
              description: { type: "string" },
              filePath: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
      },
      required: ["provider", "type", "confidence", "isInferred"],
    },
  },

  // ─── Documentation Agent ────────────────────────────────
  documentation: {
    system: `You are a technical writer evaluating documentation quality.

Analyze README, CONTRIBUTING, CHANGELOG, and other docs to produce a summary.

Rules:
1. Extract setup instructions, feature descriptions, and tech stack claims.
2. Note what documentation exists and what's missing.
3. Output valid JSON.`,
    schema: {
      type: "object",
      properties: {
        hasReadme: { type: "boolean" },
        readmeSummary: { type: "string" },
        hasSetupGuide: { type: "boolean" },
        hasApiDocs: { type: "boolean" },
        hasContributingGuide: { type: "boolean" },
        hasLicense: { type: "boolean" },
        documentationQuality: {
          type: "string",
          enum: ["excellent", "good", "adequate", "poor", "none"],
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        isInferred: { type: "boolean" },
      },
      required: ["hasReadme", "documentationQuality", "confidence", "isInferred"],
    },
  },

  // ─── Problem Statement Agent ─────────────────────────────
  problemStatement: {
    system: `You are a requirements analyst. Extract structured requirements from a problem statement.

Analyze the provided problem statement and identify:
1. Functional requirements (what the system should do)
2. Non-functional requirements (performance, security, scalability)
3. Constraints (technical, business, time)
4. Success criteria

Rules:
1. Stay faithful to the text — do not add requirements not in the document.
2. If the problem statement is missing entirely, report that.
3. Output valid JSON.`,
    schema: {
      type: "object",
      properties: {
        hasProblemStatement: { type: "boolean" },
        functionalRequirements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
              },
            },
          },
        },
        nonFunctionalRequirements: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              description: { type: "string" },
              category: { type: "string" },
              priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
            },
          },
        },
        constraints: { type: "array", items: { type: "string" } },
        successCriteria: { type: "array", items: { type: "string" } },
        completeness: { type: "number", minimum: 0, maximum: 100 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        isInferred: { type: "boolean" },
      },
      required: ["hasProblemStatement", "completeness", "confidence", "isInferred"],
    },
  },
};
