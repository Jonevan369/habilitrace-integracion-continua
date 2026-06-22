import { z } from 'zod';
import { db } from '../db/database.js';

const SUPPORT_TYPES = ['general', 'validation_help', 'appeal', 'technical'];

export const supportRequestSchema = z.object({
  type: z.enum(SUPPORT_TYPES).optional().default('general'),
  subject: z.string().min(6).max(140),
  message: z.string().min(20).max(2000),
  evidenceId: z.coerce.number().int().positive().optional().nullable()
});

export function listSupportRequests(req, res, next) {
  try {
    const rows = db
      .prepare(
        `SELECT support_requests.*,
                evidences.title AS evidence_title,
                evidences.status AS evidence_status
         FROM support_requests
         LEFT JOIN evidences ON evidences.id = support_requests.evidence_id
         WHERE support_requests.user_id = ?
         ORDER BY support_requests.created_at DESC
         LIMIT 40`
      )
      .all(req.user.id);
    res.json(rows.map(mapSupportRequest));
  } catch (error) {
    next(error);
  }
}

export function createSupportRequest(req, res, next) {
  try {
    const payload = supportRequestSchema.parse(req.body);
    if (payload.evidenceId) {
      const evidence = db
        .prepare('SELECT id, author_id FROM evidences WHERE id = ?')
        .get(payload.evidenceId);
      if (!evidence) return res.status(404).json({ message: 'Evidencia no encontrada' });
      if (evidence.author_id !== req.user.id) {
        return res.status(403).json({ message: 'Solo puedes solicitar soporte sobre tus propias evidencias' });
      }
    }

    const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const result = db
      .prepare(
        `INSERT INTO support_requests (user_id, evidence_id, type, subject, message, response_due_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(req.user.id, payload.evidenceId ?? null, payload.type, payload.subject, payload.message, dueAt);

    const row = db
      .prepare(
        `SELECT support_requests.*,
                evidences.title AS evidence_title,
                evidences.status AS evidence_status
         FROM support_requests
         LEFT JOIN evidences ON evidences.id = support_requests.evidence_id
         WHERE support_requests.id = ?`
      )
      .get(result.lastInsertRowid);

    res.status(201).json({
      ...mapSupportRequest(row),
      standardResponse:
        'Solicitud recibida. El equipo revisara la evidencia, la rubrica y el historial de auditoria. Recibiras una respuesta inicial dentro de 48 horas habiles.'
    });
  } catch (error) {
    next(error);
  }
}

function mapSupportRequest(row) {
  return {
    id: row.id,
    userId: row.user_id,
    evidenceId: row.evidence_id ?? null,
    type: row.type,
    subject: row.subject,
    message: row.message,
    status: row.status,
    responseDueAt: row.response_due_at,
    resolution: row.resolution ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    evidence: row.evidence_id
      ? { id: row.evidence_id, title: row.evidence_title, status: row.evidence_status }
      : null
  };
}
