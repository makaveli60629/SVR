// SVR Phase 195 internal bug-report client. Public Matrix page untouched.
export const SVRBugReportClient = {
  build: 'PHASE-195-BUG-REPORT-CAPTURE-LOCK',
  async list(limit = 30) {
    try { const res = await fetch(`/api/game/bug-report?limit=${encodeURIComponent(limit)}`); return await res.json(); }
    catch (_) { return []; }
  }
};
