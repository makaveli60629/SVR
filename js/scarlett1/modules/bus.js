// Simple event bus + terminal logger.
export const Bus = {
  _handlers: new Map(),
  init() {},
  on(evt, fn) {
    if (!this._handlers.has(evt)) this._handlers.set(evt, new Set());
    this._handlers.get(evt).add(fn);
    return () => this._handlers.get(evt)?.delete(fn);
  },
  emit(evt, payload) {
    const set = this._handlers.get(evt);
    if (!set) return;
    for (const fn of set) {
      try { fn(payload); } catch (e) { console.warn('[Bus handler error]', evt, e); }
    }
  },
  log(msg) {
    const term = document.getElementById('term-log');
    if (term) {
      term.innerHTML += `<br>> ${escapeHtml(String(msg))}`;
      term.scrollTop = term.scrollHeight;
    }
    console.log('[SCARLETT]', msg);
  }
};

function escapeHtml(s){
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
