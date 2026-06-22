import { db } from '../db/database.js';
import { getAiProviderStatus } from '../services/ai.js';

function scalar(sql, fallback = 0) {
  const row = db.prepare(sql).get();
  return Number(Object.values(row ?? {})[0] ?? fallback);
}

export function getAiStatus(_req, res) {
  res.json(getAiProviderStatus());
}

export function getPlatformStats(_req, res, next) {
  try {
    const statusRows = db
      .prepare(
        `SELECT status, COUNT(*) AS count
         FROM evidence_evaluations
         GROUP BY status`
      )
      .all();
    const statusCounts = Object.fromEntries(statusRows.map((row) => [row.status, row.count]));
    const totalEvaluations = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    const averageScore = scalar('SELECT ROUND(AVG(overall_score), 0) AS value FROM evidence_evaluations');
    const humanReviewRequired = scalar('SELECT COUNT(*) AS value FROM evidence_evaluations WHERE human_review_required = 1');
    const sourceRows = db
      .prepare(
        `SELECT source, COALESCE(NULLIF(provider_model, ''), source) AS model, COUNT(*) AS count
         FROM evidence_evaluations
         GROUP BY source, model
         ORDER BY count DESC`
      )
      .all();
    const voteRow = db
      .prepare(
        `SELECT
           SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS confirmations,
           SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS objections,
           COALESCE(SUM(weighted_value), 0) AS weightedConsensus
         FROM votes`
      )
      .get();
    const topCompetences = db
      .prepare(
        `SELECT name,
                COUNT(DISTINCT evidence_id) AS evidenceCount,
                ROUND(AVG(confidence), 2) AS averageConfidence
         FROM competence_suggestions
         GROUP BY name
         ORDER BY evidenceCount DESC, averageConfidence DESC
         LIMIT 8`
      )
      .all();

    res.json({
      totals: {
        users: scalar('SELECT COUNT(*) AS value FROM users'),
        communities: scalar('SELECT COUNT(*) AS value FROM communities'),
        evidences: scalar('SELECT COUNT(*) AS value FROM evidences'),
        badges: scalar('SELECT COUNT(*) AS value FROM user_badges')
      },
      evaluations: {
        total: totalEvaluations,
        averageScore,
        prevalidated: statusCounts.prevalidated_ai ?? 0,
        needsHumanReview: statusCounts.needs_human_review ?? 0,
        insufficient: statusCounts.insufficient ?? 0,
        humanReviewRequired,
        reviewRate: totalEvaluations ? Number(((humanReviewRequired / totalEvaluations) * 100).toFixed(1)) : 0
      },
      votes: {
        confirmations: Number(voteRow?.confirmations ?? 0),
        objections: Number(voteRow?.objections ?? 0),
        weightedConsensus: Number(Number(voteRow?.weightedConsensus ?? 0).toFixed(2))
      },
      ai: getAiProviderStatus(),
      aiSources: sourceRows,
      topCompetences,
      humanReview: {
        summary:
          'La revision humana es la capa de control despues de la preevaluacion de IA. La IA sugiere competencias y riesgo; la comunidad confirma o cuestiona con votos ponderados por reputacion.',
        triggerRules: [
          'Habilidades sensibles: electricidad, soldadura, salud, quimica o practicas con riesgo fisico.',
          'Evidencias con baja trazabilidad: sin soporte, fechas, repositorio, bitacora o archivo verificable.',
          'Confianza moderada, descripcion vaga, contradicciones o puntaje insuficiente en la rubrica.',
          'Objeciones de revisores con reputacion suficiente.'
        ],
        workflow: [
          'El usuario registra evidencia, fuente de aprendizaje, soporte y defensa diagnostica.',
          'La IA calcula rubrica, competencias detectadas, hash y estado preliminar.',
          'Si aplica revision, otros usuarios de la red confirman o cuestionan la evidencia.',
          'El consenso ponderado alimenta reputacion, mapa de habilidades y credenciales.'
        ]
      }
    });
  } catch (error) {
    next(error);
  }
}
