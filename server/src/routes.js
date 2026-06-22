import { Router } from 'express';
import { login, me, register } from './controllers/authController.js';
import { listUsers, createUser, getProfile, followUser, unfollowUser, exportProfile } from './controllers/userController.js';
import { createEvidence, getFeed, listEvidences, voteEvidence } from './controllers/evidenceController.js';
import { getCompetenceMap, getSkillProgress, getTrends } from './controllers/skillController.js';
import { createCommunity, getCommunity, joinCommunity, leaveCommunity, listCommunities } from './controllers/communityController.js';
import { listUserBadges, mintCredential } from './controllers/badgeController.js';
import { getAiStatus, getPlatformStats } from './controllers/platformController.js';
import { searchAll } from './controllers/searchController.js';
import { createSupportRequest, listSupportRequests } from './controllers/supportController.js';
import { optionalAuth, requireAuth } from './middleware/auth.js';

export const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: 'HabiliTrace API',
    version: '0.3.0',
    message: 'Esta es la API REST del prototipo. No es una pagina visual; usa /api/docs para probar endpoints con Swagger.',
    docs: '/api/docs',
    health: '/api/health',
    exampleEndpoints: {
      login: 'POST /api/auth/login',
      evidences: 'GET /api/evidences',
      createEvidence: 'POST /api/evidences',
      competenceMap: 'GET /api/users/:userId/competence-map',
      stats: 'GET /api/stats',
      aiStatus: 'GET /api/ai/status'
    }
  });
});

router.get('/health', (_req, res) => res.json({ ok: true, name: 'HabiliTrace API' }));
router.get('/ai/status', getAiStatus);
router.get('/stats', getPlatformStats);
router.get('/search', searchAll);

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', requireAuth, me);

router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:userId/profile', optionalAuth, getProfile);
router.post('/users/:userId/follow', requireAuth, followUser);
router.delete('/users/:userId/follow', requireAuth, unfollowUser);
router.get('/users/:userId/export', requireAuth, exportProfile);
router.get('/users/:userId/competence-map', getCompetenceMap);
router.get('/users/:userId/progress', getSkillProgress);
router.get('/users/:userId/badges', listUserBadges);

router.get('/evidences', listEvidences);
router.post('/evidences', requireAuth, createEvidence);
router.post('/evidences/:id/votes', requireAuth, voteEvidence);
router.get('/feed', requireAuth, getFeed);

router.get('/communities', optionalAuth, listCommunities);
router.post('/communities', requireAuth, createCommunity);
router.get('/communities/:id', optionalAuth, getCommunity);
router.post('/communities/:id/join', requireAuth, joinCommunity);
router.delete('/communities/:id/join', requireAuth, leaveCommunity);

router.get('/trends', getTrends);
router.get('/badges/:badgeId/credential', requireAuth, mintCredential);
router.get('/support/requests', requireAuth, listSupportRequests);
router.post('/support/requests', requireAuth, createSupportRequest);
