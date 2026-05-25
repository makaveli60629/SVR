(() => {
  const DEFAULT_API = localStorage.getItem('SVR_API_BASE') || 'https://YOUR-API-NAME.azurewebsites.net';
  const api = {
    base: DEFAULT_API,
    setBase(url){ localStorage.setItem('SVR_API_BASE', url); api.base = url; },
    async get(path){ const r = await fetch(`${api.base}${path}`); return r.json(); },
    async post(path, body){ const r = await fetch(`${api.base}${path}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}); return r.json(); }
  };
  window.SVRApi = api;
})();
