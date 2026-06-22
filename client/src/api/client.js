const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function token() {
  return localStorage.getItem('skillcert_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const authToken = token();
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  if (!response.ok) throw new Error(payload?.message ?? 'No se pudo completar la solicitud');
  return payload;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/auth/me'),
  search: (query = '') => request(`/search?q=${encodeURIComponent(query)}`),
  users: (search = '') => request(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  profile: (userId) => request(`/users/${userId}/profile`),
  follow: (userId) => request(`/users/${userId}/follow`, { method: 'POST' }),
  unfollow: (userId) => request(`/users/${userId}/follow`, { method: 'DELETE' }),
  exportProfile: (userId) => request(`/users/${userId}/export`),
  evidences: () => request('/evidences'),
  feed: () => request('/feed'),
  createEvidence: (payload) => request('/evidences', { method: 'POST', body: JSON.stringify(payload) }),
  vote: (evidenceId, payload) => request(`/evidences/${evidenceId}/votes`, { method: 'POST', body: JSON.stringify(payload) }),
  competenceMap: (userId, params = {}) => request(`/users/${userId}/competence-map?${new URLSearchParams(params)}`),
  progress: (userId, skill) => request(`/users/${userId}/progress?skill=${encodeURIComponent(skill)}`),
  trends: () => request('/trends'),
  stats: () => request('/stats'),
  aiStatus: () => request('/ai/status'),
  communities: () => request('/communities'),
  community: (id) => request(`/communities/${id}`),
  createCommunity: (payload) => request('/communities', { method: 'POST', body: JSON.stringify(payload) }),
  joinCommunity: (id) => request(`/communities/${id}/join`, { method: 'POST' }),
  leaveCommunity: (id) => request(`/communities/${id}/join`, { method: 'DELETE' }),
  mintCredential: (badgeId) => request(`/badges/${badgeId}/credential`),
  supportRequests: () => request('/support/requests'),
  createSupportRequest: (payload) => request('/support/requests', { method: 'POST', body: JSON.stringify(payload) })
};
