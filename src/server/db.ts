import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

export interface WorkspaceRecord {
  id: string;
  name: string;
  is_demo: number;
  created_at: string;
}

export interface SourceRecord {
  id: number;
  workspace_id: string;
  name: string;
  section: string;
  text: string;
  doc_type: string;
  is_sample: number;
  created_at: string;
}

export interface RuleRecord {
  id: number;
  workspace_id: string;
  kind: 'prohibited_term' | 'price' | 'approved_claim' | 'tone_hype' | 'required_terminology';
  term?: string;
  replacement?: string;
  approved_value?: string;
  keyword?: string;
  source_id?: number;
  notes?: string;
  is_sample: number;
  created_at: string;
}

export interface ReviewRecord {
  id: number;
  workspace_id: string;
  title: string;
  draft: string;
  findings_json: string;
  retrieved_json: string;
  engine: string;
  analysis_json: string;
  status: string;
  score_json: string;
  created_at: string;
  updated_at: string;
}

let dbInstance: DatabaseSync | null = null;

export function getDatabase(dbFilePath?: string): DatabaseSync {
  if (dbInstance) return dbInstance;

  const targetPath = dbFilePath || process.env.BRANDTRACE_DB || 'backend/brandtrace.db';
  const resolved = path.resolve(process.cwd(), targetPath);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA foreign_keys = ON;');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      section TEXT NOT NULL,
      text TEXT NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'general',
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      term TEXT,
      replacement TEXT,
      approved_value TEXT,
      keyword TEXT,
      source_id INTEGER,
      notes TEXT,
      is_sample INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      draft TEXT NOT NULL,
      findings_json TEXT NOT NULL DEFAULT '[]',
      retrieved_json TEXT NOT NULL DEFAULT '[]',
      engine TEXT NOT NULL,
      analysis_json TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL,
      score_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS review_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sources_ws ON sources(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_rules_ws ON rules(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_ws ON reviews(workspace_id);
  `);

  dbInstance = db;
  seedDemoWorkspace(db);
  return dbInstance;
}

export function seedDemoWorkspace(db: DatabaseSync, forceReset: boolean = false) {
  const existingWs = db.prepare('SELECT id FROM workspaces WHERE id = ?').get('demo');
  if (existingWs && !forceReset) {
    return;
  }

  if (forceReset) {
    db.exec("DELETE FROM rules WHERE workspace_id = 'demo';");
    db.exec("DELETE FROM sources WHERE workspace_id = 'demo';");
    db.exec("DELETE FROM workspaces WHERE id = 'demo';");
  }

  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO workspaces (id, name, is_demo, created_at) VALUES (?, ?, 1, ?)').run('demo', 'BrandTrace Demo Workspace', now);

  // Standard Demo Sources
  const demoSources = [
    {
      id: 1,
      name: '2026 Pricing Sheet',
      section: 'Section 2',
      text: 'BrandTrace Workspace standard tier is priced at $49/month (or ₹3,200 / Rs 3,200 per month in India). Enterprise tier is custom quoted.',
      doc_type: 'pricing',
    },
    {
      id: 2,
      name: 'Brand Naming Guide',
      section: 'Section 1',
      text: 'The product is named BrandTrace Workspace. The name BrandTrace Suite is retired and must not be used in any public materials.',
      doc_type: 'terminology',
    },
    {
      id: 3,
      name: 'Brand Voice Guide',
      section: 'Section 1',
      text: 'Our tone is clear, friendly and confident. Avoid hype words such as revolutionary, best-in-class, cutting-edge, or gamechanger. Use active voice.',
      doc_type: 'brand_voice',
    },
    {
      id: 4,
      name: 'Approved Claims Register',
      section: 'Section 1',
      text: 'Approved claim: BrandTrace Workspace checks content against approved company information before publication. A human reviewer makes the final publishing decision.',
      doc_type: 'approved_claims',
    },
    {
      id: 5,
      name: 'Terminology Glossary',
      section: 'Section 1',
      text: 'Use review for a content check, finding for a detected issue, and source for an approved reference document. The standard tier is called Standard, with a capital S.',
      doc_type: 'terminology',
    },
  ];

  const insertSource = db.prepare(
    'INSERT INTO sources (id, workspace_id, name, section, text, doc_type, is_sample, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
  );

  for (const s of demoSources) {
    try {
      insertSource.run(s.id, 'demo', s.name, s.section, s.text, s.doc_type, now);
    } catch {
      // Ignore if ID exists
    }
  }

  // Standard Demo Rules
  const demoRules = [
    {
      kind: 'prohibited_term',
      term: 'BrandTrace Suite',
      replacement: 'BrandTrace Workspace',
      source_id: 2,
      notes: 'BrandTrace Suite is retired product naming.',
    },
    {
      kind: 'price',
      keyword: 'standard',
      approved_value: '49',
      replacement: '$49/month',
      source_id: 1,
      notes: 'Standard tier USD subscription rate.',
    },
    {
      kind: 'price',
      keyword: 'standard',
      approved_value: '3200',
      replacement: '₹3,200/month',
      source_id: 1,
      notes: 'Standard tier INR regional subscription rate.',
    },
    {
      kind: 'tone_hype',
      term: 'revolutionary',
      replacement: 'innovative',
      source_id: 3,
      notes: 'Hype word disallowed by Brand Voice Guide.',
    },
    {
      kind: 'tone_hype',
      term: 'best-in-class',
      replacement: 'leading',
      source_id: 3,
      notes: 'Superlative hype phrase disallowed by Brand Voice Guide.',
    },
    {
      kind: 'tone_hype',
      term: 'gamechanger',
      replacement: 'valuable',
      source_id: 3,
      notes: 'Informal hype term disallowed by Brand Voice Guide.',
    },
    {
      kind: 'approved_claim',
      term: 'no human review',
      replacement: 'A human reviewer makes the final publishing decision',
      source_id: 4,
      notes: 'Autonomous publishing without human in the loop is prohibited.',
    },
  ];

  const insertRule = db.prepare(
    'INSERT INTO rules (workspace_id, kind, term, replacement, approved_value, keyword, source_id, notes, is_sample, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)'
  );

  for (const r of demoRules) {
    insertRule.run(
      'demo',
      r.kind,
      r.term || null,
      r.replacement || null,
      r.approved_value || null,
      r.keyword || null,
      r.source_id || null,
      r.notes || null,
      now
    );
  }
}
