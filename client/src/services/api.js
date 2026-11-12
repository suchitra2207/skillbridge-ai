/**
 * api.js — central fetch wrapper for all backend calls.
 *
 * All API calls go to /api/* which Vite proxies to http://localhost:3001 in dev.
 * Never put API keys or secrets in this file or anywhere in the client.
 */

const BASE = '/api';

async function request(method, path, body) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, options);

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try { const data = await res.json(); message = data.error || message; }
    catch { /* ignore */ }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path)       => request('DELETE', path),
};

// ── Named endpoint functions ───────────────────────────────────────────────

export function getHealth()        { return api.get('/health'); }
export function getSession()       { return api.get('/session'); }
export function startDemoSession() { return api.post('/session/start'); }

// Profile
export function getProfile()          { return api.get('/profile'); }
export function updateProfile(data)   { return api.put('/profile', data); }

// Skills
export function getSkills()              { return api.get('/skills'); }
export function extractSkills()          { return api.post('/skills/extract'); }
export function confirmSkills(confirmed) { return api.post('/skills/confirm', { confirmed }); }
export function deleteSkill(id)          { return api.delete(`/skills/${id}`); }

// Opportunities
export function getOpportunities(params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null)
  ).toString();
  return api.get(`/opportunities${qs ? `?${qs}` : ''}`);
}
export function getOpportunityMeta()          { return api.get('/opportunities/meta'); }
export function getOpportunity(id)            { return api.get(`/opportunities/${id}`); }
export function toggleSaveOpportunity(id)     { return api.post(`/opportunities/${id}/save`); }
export function getSavedOpportunities()       { return api.get('/opportunities/saved/list'); }

// Gap analysis
export function getGapAnalysis(opportunityId)           { return api.get(`/gaps/${opportunityId}`); }
export function getGapSummary()                         { return api.get('/gaps/summary'); }
export function updateSkillProgress(skillName, status)  { return api.put(`/gaps/progress/${encodeURIComponent(skillName)}`, { status }); }
export function getAllSkillProgress()                    { return api.get('/gaps/progress/all'); }
export function removeSkillProgress(skillName)          { return api.delete(`/gaps/progress/${encodeURIComponent(skillName)}`); }
