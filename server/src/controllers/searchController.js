import { db, evidenceSelectClause, mapEvidence } from '../db/database.js';
import { publicUser } from '../db/sql.js';

export function searchAll(req, res, next) {
  try {
    const query = String(req.query.q ?? '').trim().toLowerCase();
    if (!query) {
      return res.json({ query: '', users: [], evidences: [], communities: [], competences: [] });
    }

    const pattern = `%${query}%`;
    const users = db
      .prepare(
        `SELECT DISTINCT users.*
         FROM users
         LEFT JOIN evidences ON evidences.author_id = users.id
         LEFT JOIN competence_suggestions ON competence_suggestions.evidence_id = evidences.id
         WHERE lower(users.name) LIKE ?
            OR lower(users.headline) LIKE ?
            OR lower(users.bio) LIKE ?
            OR lower(competence_suggestions.name) LIKE ?
         ORDER BY users.karma DESC, users.name ASC
         LIMIT 12`
      )
      .all(pattern, pattern, pattern, pattern)
      .map((user) => ({
        ...publicUser(user),
        topSkills: topSkillsForUser(user.id)
      }));

    const evidences = db
      .prepare(
        `${evidenceSelectClause(`
          LEFT JOIN competence_suggestions ON competence_suggestions.evidence_id = evidences.id
          WHERE lower(evidences.title) LIKE ?
             OR lower(evidences.body) LIKE ?
             OR lower(evidences.skill_area) LIKE ?
             OR lower(evidences.evidence_type) LIKE ?
             OR lower(competence_suggestions.name) LIKE ?
        `)}
        GROUP BY evidences.id
        ORDER BY evidences.created_at DESC
        LIMIT 12`
      )
      .all(pattern, pattern, pattern, pattern, pattern)
      .map(mapEvidence);

    const communities = db
      .prepare(
        `SELECT communities.*,
                COUNT(DISTINCT community_members.user_id) AS memberCount,
                COUNT(DISTINCT evidences.id) AS evidenceCount
         FROM communities
         LEFT JOIN community_members ON community_members.community_id = communities.id
         LEFT JOIN evidences ON evidences.community_id = communities.id
         WHERE lower(communities.name) LIKE ?
            OR lower(communities.area) LIKE ?
            OR lower(communities.description) LIKE ?
         GROUP BY communities.id
         ORDER BY evidenceCount DESC, memberCount DESC
         LIMIT 12`
      )
      .all(pattern, pattern, pattern);

    const competences = db
      .prepare(
        `SELECT competence_suggestions.name,
                COUNT(DISTINCT evidences.id) AS evidenceCount,
                ROUND(AVG(competence_suggestions.confidence), 2) AS averageConfidence
         FROM competence_suggestions
         JOIN evidences ON evidences.id = competence_suggestions.evidence_id
         WHERE lower(competence_suggestions.name) LIKE ?
         GROUP BY competence_suggestions.name
         ORDER BY evidenceCount DESC, averageConfidence DESC
         LIMIT 12`
      )
      .all(pattern);

    return res.json({ query, users, evidences, communities, competences });
  } catch (error) {
    return next(error);
  }
}

function topSkillsForUser(userId) {
  return db
    .prepare(
      `SELECT competence_suggestions.name, COUNT(*) AS evidenceCount
       FROM evidences
       JOIN competence_suggestions ON competence_suggestions.evidence_id = evidences.id
       WHERE evidences.author_id = ?
       GROUP BY competence_suggestions.name
       ORDER BY evidenceCount DESC
       LIMIT 4`
    )
    .all(userId);
}
