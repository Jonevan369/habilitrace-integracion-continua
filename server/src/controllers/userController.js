import { z } from 'zod';
import { db, evidenceSelectClause, mapEvidence } from '../db/database.js';
import { publicUser } from '../db/sql.js';
import { listBadges, refreshBadgesForUser } from '../services/badgeService.js';
import { buildProfileExport } from '../services/profileService.js';

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email()
});

export function listUsers(req, res, next) {
  try {
    const search = String(req.query.search ?? '').trim().toLowerCase();
    const rows = search
      ? db
          .prepare(
            `SELECT DISTINCT users.*
             FROM users
             LEFT JOIN evidences ON evidences.author_id = users.id
             LEFT JOIN competence_suggestions ON competence_suggestions.evidence_id = evidences.id
             WHERE lower(users.name) LIKE ? OR lower(competence_suggestions.name) LIKE ?
             ORDER BY users.name ASC`
          )
          .all(`%${search}%`, `%${search}%`)
      : db.prepare('SELECT * FROM users ORDER BY name ASC').all();

    const users = rows.map((row) => ({
      ...publicUser(row),
      topSkills: db
        .prepare(
          `SELECT competence_suggestions.name, COUNT(*) AS evidenceCount
           FROM evidences
           JOIN competence_suggestions ON competence_suggestions.evidence_id = evidences.id
           WHERE evidences.author_id = ?
           GROUP BY competence_suggestions.name
           ORDER BY evidenceCount DESC
           LIMIT 4`
        )
        .all(row.id)
    }));
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export function createUser(req, res, next) {
  try {
    const payload = createUserSchema.parse(req.body);
    const result = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)').run(payload.name, payload.email);
    res.status(201).json(publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)));
  } catch (error) {
    next(error);
  }
}

export function getProfile(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    refreshBadgesForUser(userId);
    const user = publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const evidences = db
      .prepare(`${evidenceSelectClause('WHERE evidences.author_id = ?')} ORDER BY evidences.created_at DESC`)
      .all(userId)
      .map(mapEvidence);
    const followers = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE following_id = ?').get(userId).count;
    const following = db.prepare('SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?').get(userId).count;
    const isFollowing = req.user
      ? Boolean(
          db
            .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
            .get(req.user.id, userId)
        )
      : false;

    res.json({ user, evidences, badges: listBadges(userId), stats: { followers, following }, isFollowing });
  } catch (error) {
    next(error);
  }
}

export function followUser(req, res, next) {
  try {
    const targetId = Number(req.params.userId);
    if (targetId === req.user.id) return res.status(400).json({ message: 'No puedes seguirte a ti mismo' });
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user.id, targetId);
    res.json({ following: true });
  } catch (error) {
    next(error);
  }
}

export function unfollowUser(req, res, next) {
  try {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user.id, Number(req.params.userId));
    res.json({ following: false });
  } catch (error) {
    next(error);
  }
}

export function exportProfile(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    if (req.user.id !== userId) return res.status(403).json({ message: 'Solo puedes exportar tu propio perfil' });
    const payload = buildProfileExport(userId);
    res.setHeader('Content-Disposition', `attachment; filename="habilitrace-profile-${userId}.json"`);
    res.json(payload);
  } catch (error) {
    next(error);
  }
}
