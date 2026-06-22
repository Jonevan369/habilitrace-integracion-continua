import crypto from 'node:crypto';
import { db } from '../db/database.js';

export function mintBadgeCredential({ badgeId, user }) {
  const badge = db.prepare('SELECT * FROM user_badges WHERE id = ? AND user_id = ?').get(badgeId, user.id);
  if (!badge) {
    const error = new Error('Badge no encontrado');
    error.status = 404;
    throw error;
  }

  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'CompetenceEvidenceCredential'],
    issuer: 'did:web:habilitrace.local',
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: `habilitrace:user:${user.id}`,
      name: user.name,
      skill: badge.skill_name,
      badge: badge.title,
      threshold: badge.threshold
    }
  };

  const hash = crypto.createHash('sha256').update(JSON.stringify(credential)).digest('hex');
  const signed = { ...credential, proof: { type: 'SimulatedHashProof2026', proofPurpose: 'assertionMethod', hash } };
  db.prepare('UPDATE user_badges SET minted_hash = ? WHERE id = ?').run(hash, badgeId);
  return signed;
}
