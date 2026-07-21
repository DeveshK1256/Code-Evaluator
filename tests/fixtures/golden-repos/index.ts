/**
 * Golden Repository Benchmark Suite
 *
 * A curated set of repository characteristics that serve as regression benchmarks.
 * Every change to the platform should validate against these expected outcomes.
 */

export interface GoldenRepo {
  id: string;
  name: string;
  description: string;
  type: "exemplary" | "insecure" | "well_tested" | "poor_docs" | "mixed";
  expectedTechStack: string[];
  expectedArchitecture: string;
  expectedIssues: string[];
  expectedScore: { min: number; max: number };
  files: GoldenFile[];
}

export interface GoldenFile {
  path: string;
  content: string;
}

/**
 * Repo 1: Well-structured Next.js app (exemplary)
 */
export const WELL_STRUCTURED_NEXTJS: GoldenRepo = {
  id: "nextjs-exemplary",
  name: "nextjs-exemplary",
  description: "A well-structured Next.js application with proper architecture, testing, and documentation",
  type: "exemplary",
  expectedTechStack: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  expectedArchitecture: "feature_based",
  expectedIssues: [],
  expectedScore: { min: 75, max: 95 },
  files: [
    { path: "package.json", content: JSON.stringify({ dependencies: { next: "15.0.0", react: "19.0.0" }, devDependencies: { typescript: "5.7.0", vitest: "2.0.0" } }) },
    { path: "src/app/page.tsx", content: "export default function Home() { return <main><h1>Hello</h1></main>; }" },
    { path: "src/app/layout.tsx", content: "export default function RootLayout({ children }: { children: React.ReactNode }) { return <html><body>{children}</body></html>; }" },
    { path: "src/components/ui/button.tsx", content: "export function Button({ children }: { children: React.ReactNode }) { return <button>{children}</button>; }" },
    { path: "README.md", content: "# Next.js App\n## Setup\n```bash\nnpm install\n```\n## Features\n- Authentication\n- Dashboard\n- API" },
    { path: "Dockerfile", content: "FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD [\"npm\", \"run\", \"dev\"]" },
    { path: ".github/workflows/ci.yml", content: "name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - run: npm test" },
  ],
};

/**
 * Repo 2: Deliberately insecure Node.js app
 */
export const INSECURE_APP: GoldenRepo = {
  id: "insecure-express",
  name: "insecure-express",
  description: "An Express app with known security vulnerabilities for testing security detection",
  type: "insecure",
  expectedTechStack: ["Express", "JavaScript"],
  expectedArchitecture: "monolith",
  expectedIssues: ["No input validation", "Missing auth", "No security headers", "Secrets in code"],
  expectedScore: { min: 20, max: 50 },
  files: [
    { path: "package.json", content: JSON.stringify({ dependencies: { express: "4.18.0" } }) },
    { path: "index.js", content: "const express = require('express'); const app = express(); app.get('/user/:id', (req, res) => { const query = 'SELECT * FROM users WHERE id = ' + req.params.id; res.json({ data: query }); }); app.listen(3000);" },
    { path: ".env", content: "SECRET_KEY=sk-1234567890abcdef\nDB_PASSWORD=supersecret123\nAPI_KEY=AIzaSyDeadBeef" },
    { path: "config.js", content: "module.exports = { jwtSecret: 'hardcoded-secret-key', dbPassword: 'password123' };" },
  ],
};

/**
 * Repo 3: Well-tested Python app
 */
export const WELL_TESTED_PYTHON: GoldenRepo = {
  id: "python-tested",
  name: "python-tested",
  description: "A Python FastAPI app with comprehensive test coverage",
  type: "well_tested",
  expectedTechStack: ["Python", "FastAPI"],
  expectedArchitecture: "layered",
  expectedIssues: [],
  expectedScore: { min: 70, max: 90 },
  files: [
    { path: "requirements.txt", content: "fastapi==0.100.0\npytest==8.0.0\nsqlalchemy==2.0.0" },
    { path: "main.py", content: "from fastapi import FastAPI\napp = FastAPI()\n@app.get('/')\ndef read_root():\n    return {'Hello': 'World'}" },
    { path: "tests/test_main.py", content: "from fastapi.testclient import TestClient\nfrom main import app\n\ndef test_read_root():\n    client = TestClient(app)\n    response = client.get('/')\n    assert response.status_code == 200" },
  ],
};

/**
 * Repo 4: Poorly documented React app
 */
export const POORLY_DOCUMENTED_REACT: GoldenRepo = {
  id: "react-no-docs",
  name: "react-no-docs",
  description: "A React app with minimal documentation and no tests",
  type: "poor_docs",
  expectedTechStack: ["React"],
  expectedArchitecture: "monolith",
  expectedIssues: ["No README", "No tests"],
  expectedScore: { min: 40, max: 65 },
  files: [
    { path: "package.json", content: JSON.stringify({ dependencies: { react: "18.0.0", reactDom: "18.0.0" } }) },
    { path: "src/App.js", content: "import React from 'react';\nfunction App() {\n  return <div>Hello World</div>;\n}\nexport default App;" },
  ],
};

export const GOLDEN_REPOS: GoldenRepo[] = [
  WELL_STRUCTURED_NEXTJS,
  INSECURE_APP,
  WELL_TESTED_PYTHON,
  POORLY_DOCUMENTED_REACT,
];

export function getGoldenRepo(id: string): GoldenRepo | undefined {
  return GOLDEN_REPOS.find((r) => r.id === id);
}
