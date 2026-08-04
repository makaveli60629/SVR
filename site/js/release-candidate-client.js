// SVR Phase 193 internal site release candidate client. Public root page untouched.
export const SVR_RELEASE_CANDIDATE_BUILD = 'PHASE-193-RELEASE-CANDIDATE-CHECKLIST-LOCK';
export async function fetchReleaseCandidate({ limit = 20 } = {}) {
  const res = await fetch(`/api/game/release-candidate?limit=${encodeURIComponent(limit)}`, { cache: 'no-store' });
  if (!res.ok) return [];
  return await res.json();
}
