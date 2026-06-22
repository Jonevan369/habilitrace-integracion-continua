import { listBadges, refreshBadgesForUser } from '../services/badgeService.js';
import { mintBadgeCredential } from '../services/credentialService.js';

export function listUserBadges(req, res, next) {
  try {
    refreshBadgesForUser(Number(req.params.userId));
    res.json(listBadges(Number(req.params.userId)));
  } catch (error) {
    next(error);
  }
}

export function mintCredential(req, res, next) {
  try {
    const credential = mintBadgeCredential({ badgeId: Number(req.params.badgeId), user: req.user });
    res.setHeader('Content-Disposition', `attachment; filename="habilitrace-credential-${req.params.badgeId}.json"`);
    res.json(credential);
  } catch (error) {
    next(error);
  }
}
