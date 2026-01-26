// Legacy Bridge: fetch JSON or text from another server (CORS-dependent).
export function initBridge({ Bus }) {
  window.importLegacyAsset = async (url) => {
    Bus.log(`LEGACY: FETCHING ${url}`);
    const res = await fetch(url, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) throw new Error(`Legacy fetch failed: ${res.status}`);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) return await res.json();
    return await res.text();
  };

  window.legacyPrompt = async () => {
    const url = prompt('Legacy URL to fetch (CORS must allow this site):');
    if (!url) return;
    try {
      const data = await window.importLegacyAsset(url);
      Bus.log('LEGACY: IMPORT OK');
      Bus.emit('legacyImported', data);
    } catch (e) {
      Bus.log('LEGACY: IMPORT FAILED (CORS?)');
      console.warn(e);
    }
  };

  Bus.log('LEGACY BRIDGE ONLINE');
}
