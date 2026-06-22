import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.resolve(__dirname, '../../data/dev.db');
const dbPath = process.env.DATABASE_PATH ?? defaultPath;
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

export function mapEvidence(row) {
  const suggestions = db
    .prepare('SELECT * FROM competence_suggestions WHERE evidence_id = ? ORDER BY id ASC')
    .all(row.id)
    .map((suggestion) => ({
      id: suggestion.id,
      evidenceId: suggestion.evidence_id,
      name: suggestion.name,
      level: suggestion.level,
      confidence: suggestion.confidence,
      rationale: suggestion.rationale,
      source: suggestion.source,
      createdAt: suggestion.created_at
    }));

  const evaluationRow = db
    .prepare('SELECT * FROM evidence_evaluations WHERE evidence_id = ?')
    .get(row.id);
  const evaluation = evaluationRow
    ? {
        id: evaluationRow.id,
        evidenceId: evaluationRow.evidence_id,
        overallScore: evaluationRow.overall_score,
        status: evaluationRow.status,
        rubric: parseJson(evaluationRow.rubric_json, {}),
        riskFlags: parseJson(evaluationRow.risk_flags_json, []),
        humanReviewRequired: Boolean(evaluationRow.human_review_required),
        rationale: evaluationRow.rationale,
        source: evaluationRow.source,
        providerModel: evaluationRow.provider_model ?? '',
        evidenceHash: evaluationRow.evidence_hash,
        createdAt: evaluationRow.created_at
      }
    : null;

  const votes = db
    .prepare(
      `SELECT votes.*, users.name AS user_name, users.email AS user_email, users.karma AS user_karma
       FROM votes
       JOIN users ON users.id = votes.user_id
       WHERE votes.evidence_id = ?
       ORDER BY votes.created_at DESC`
    )
    .all(row.id)
    .map((vote) => ({
      id: vote.id,
      evidenceId: vote.evidence_id,
      userId: vote.user_id,
      value: vote.value,
      weight: Number(vote.weight ?? 1),
      weightedValue: Number(vote.weighted_value ?? vote.value),
      comment: vote.comment,
      createdAt: vote.created_at,
      user: { id: vote.user_id, name: vote.user_name, email: vote.user_email, karma: vote.user_karma ?? 0 }
    }));

  const positive = votes.filter((vote) => vote.value === 1).length;
  const negative = votes.filter((vote) => vote.value === -1).length;
  const weightedScore = votes.reduce((sum, vote) => sum + vote.weightedValue, 0);

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    authorId: row.author_id,
    communityId: row.community_id ?? null,
    skillArea: row.skill_area ?? 'general',
    evidenceType: row.evidence_type ?? 'experiencia',
    assessmentMode: row.assessment_mode ?? 'evidencia_practica',
    learningSources: row.learning_sources ?? '',
    challengeAnswers: row.challenge_answers ?? '',
    artifactUrl: row.artifact_url ?? '',
    artifactFileName: row.artifact_file_name ?? '',
    artifactMimeType: row.artifact_mime_type ?? '',
    artifactHash: row.artifact_hash ?? '',
    artifactSize: Number(row.artifact_size ?? 0),
    status: row.status,
    createdAt: row.created_at,
    author: {
      id: row.author_id,
      name: row.author_name,
      email: row.author_email,
      headline: row.author_headline ?? '',
      karma: row.author_karma ?? 0
    },
    community: row.community_id
      ? { id: row.community_id, name: row.community_name, slug: row.community_slug, area: row.community_area }
      : null,
    evaluation,
    suggestions,
    votes,
    validationScore: positive - negative,
    weightedScore: Number(weightedScore.toFixed(2)),
    voteSummary: { positive, negative, total: votes.length }
  };
}

export function evidenceSelectClause(whereClause = '') {
  return `
    SELECT evidences.*,
           users.name AS author_name,
           users.email AS author_email,
           users.headline AS author_headline,
           users.karma AS author_karma,
           communities.name AS community_name,
           communities.slug AS community_slug,
           communities.area AS community_area
    FROM evidences
    JOIN users ON users.id = evidences.author_id
    LEFT JOIN communities ON communities.id = evidences.community_id
    ${whereClause}
  `;
}
