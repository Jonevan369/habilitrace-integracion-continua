import 'dotenv/config';
import { db } from './database.js';
import { addColumnIfMissing } from './sql.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    headline TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    karma REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS communities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    area TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    owner_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS evidences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    community_id INTEGER,
    skill_area TEXT NOT NULL DEFAULT 'general',
    evidence_type TEXT NOT NULL DEFAULT 'experiencia',
    assessment_mode TEXT NOT NULL DEFAULT 'evidencia_practica',
    learning_sources TEXT DEFAULT '',
    challenge_answers TEXT DEFAULT '',
    artifact_url TEXT DEFAULT '',
    artifact_file_name TEXT DEFAULT '',
    artifact_mime_type TEXT DEFAULT '',
    artifact_hash TEXT DEFAULT '',
    artifact_size INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS competence_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    confidence REAL NOT NULL,
    rationale TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'fallback',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evidence_id) REFERENCES evidences(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    value INTEGER NOT NULL CHECK (value IN (1, -1)),
    weight REAL NOT NULL DEFAULT 1,
    weighted_value REAL NOT NULL DEFAULT 1,
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evidence_id) REFERENCES evidences(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(evidence_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS evidence_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id INTEGER NOT NULL UNIQUE,
    overall_score INTEGER NOT NULL,
    status TEXT NOT NULL,
    rubric_json TEXT NOT NULL,
    risk_flags_json TEXT NOT NULL,
    human_review_required INTEGER NOT NULL DEFAULT 0,
    rationale TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'fallback',
    provider_model TEXT DEFAULT '',
    evidence_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evidence_id) REFERENCES evidences(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS community_members (
    community_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (community_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    skill_name TEXT NOT NULL,
    title TEXT NOT NULL,
    threshold REAL NOT NULL,
    issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    minted_hash TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, skill_name, title)
  );

  CREATE TABLE IF NOT EXISTS support_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    evidence_id INTEGER,
    type TEXT NOT NULL DEFAULT 'general',
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    response_due_at TEXT NOT NULL,
    resolution TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidences(id) ON DELETE SET NULL
  );
`);

addColumnIfMissing('users', 'password_hash', 'TEXT');
addColumnIfMissing('users', 'headline', "TEXT DEFAULT ''");
addColumnIfMissing('users', 'bio', "TEXT DEFAULT ''");
addColumnIfMissing('users', 'karma', 'REAL NOT NULL DEFAULT 0');
addColumnIfMissing('evidences', 'community_id', 'INTEGER');
addColumnIfMissing('evidences', 'skill_area', "TEXT NOT NULL DEFAULT 'general'");
addColumnIfMissing('evidences', 'evidence_type', "TEXT NOT NULL DEFAULT 'experiencia'");
addColumnIfMissing('evidences', 'assessment_mode', "TEXT NOT NULL DEFAULT 'evidencia_practica'");
addColumnIfMissing('evidences', 'learning_sources', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'challenge_answers', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'artifact_url', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'artifact_file_name', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'artifact_mime_type', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'artifact_hash', "TEXT DEFAULT ''");
addColumnIfMissing('evidences', 'artifact_size', 'INTEGER DEFAULT 0');
addColumnIfMissing('evidence_evaluations', 'provider_model', "TEXT DEFAULT ''");
addColumnIfMissing('votes', 'weight', 'REAL NOT NULL DEFAULT 1');
addColumnIfMissing('votes', 'weighted_value', 'REAL NOT NULL DEFAULT 1');
addColumnIfMissing('support_requests', 'evidence_id', 'INTEGER');
addColumnIfMissing('support_requests', 'resolution', "TEXT DEFAULT ''");
addColumnIfMissing('support_requests', 'updated_at', 'TEXT');

console.log('SQLite schema ready.');
