import { z } from 'zod';
import { db, evidenceSelectClause, mapEvidence } from '../db/database.js';

export const communitySchema = z.object({
  name: z.string().min(3).max(80),
  area: z.string().min(3).max(80),
  description: z.string().max(500).optional()
});

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function listCommunities(req, res, next) {
  try {
    const rows = db
      .prepare(
        `SELECT communities.*,
                COUNT(DISTINCT community_members.user_id) AS memberCount,
                COUNT(DISTINCT evidences.id) AS evidenceCount,
                ${req.user ? 'MAX(CASE WHEN community_members.user_id = ? THEN 1 ELSE 0 END)' : '0'} AS joined
         FROM communities
         LEFT JOIN community_members ON community_members.community_id = communities.id
         LEFT JOIN evidences ON evidences.community_id = communities.id
         GROUP BY communities.id
         ORDER BY memberCount DESC, communities.name ASC`
      )
      .all(...(req.user ? [req.user.id] : []));
    res.json(
      rows.map((row) => ({
        ...row,
        memberCount: row.memberCount,
        evidenceCount: row.evidenceCount,
        joined: Boolean(row.joined)
      }))
    );
  } catch (error) {
    next(error);
  }
}

export function createCommunity(req, res, next) {
  try {
    if (process.env.ENABLE_PUBLIC_AREA_CREATION !== 'true') {
      return res.status(403).json({
        message: 'Las areas de practica son administradas por el sistema. Los usuarios pueden vincularse a areas existentes.'
      });
    }

    const payload = communitySchema.parse(req.body);
    const slug = slugify(payload.name);
    const result = db
      .prepare('INSERT INTO communities (name, slug, area, description, owner_id) VALUES (?, ?, ?, ?, ?)')
      .run(payload.name, slug, payload.area, payload.description ?? '', req.user.id);
    db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)').run(
      result.lastInsertRowid,
      req.user.id
    );
    res.status(201).json(db.prepare('SELECT * FROM communities WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    next(error);
  }
}

export function joinCommunity(req, res, next) {
  try {
    db.prepare('INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)').run(
      Number(req.params.id),
      req.user.id
    );
    res.json({ joined: true });
  } catch (error) {
    next(error);
  }
}

export function leaveCommunity(req, res, next) {
  try {
    db.prepare('DELETE FROM community_members WHERE community_id = ? AND user_id = ?').run(
      Number(req.params.id),
      req.user.id
    );
    res.json({ joined: false });
  } catch (error) {
    next(error);
  }
}

export function getCommunity(req, res, next) {
  try {
    const id = Number(req.params.id);
    const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(id);
    if (!community) return res.status(404).json({ message: 'Comunidad no encontrada' });
    const joined = req.user
      ? Boolean(db.prepare('SELECT 1 FROM community_members WHERE community_id = ? AND user_id = ?').get(id, req.user.id))
      : false;
    const evidences = db
      .prepare(`${evidenceSelectClause('WHERE evidences.community_id = ?')} ORDER BY evidences.created_at DESC`)
      .all(id)
      .map(mapEvidence);
    res.json({ community, joined, evidences });
  } catch (error) {
    next(error);
  }
}
