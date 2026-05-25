(function(){
  'use strict';
  const MODULE = 'mod_commerce';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    productCatalog: [],
    init(){ console.info('[SVR]', MODULE, 'ready'); if (root.config?.backendEnabled) this.cacheCatalog(); },
    async cacheCatalog(){
      try{ const r = await fetch('/api/commerce/products'); if (r.ok) this.productCatalog = await r.json(); }
      catch(error){ console.warn('[SVR] commerce catalog unavailable', error); }
    },
    async purchaseDigitalProduct(productId, userId){
      window.dispatchEvent(new CustomEvent('svr_commerce_loading', { detail: { active: true } }));
      try{
        if (!root.config?.backendEnabled) throw new Error('Commerce backend disabled in safe mode');
        const r = await fetch('/api/commerce/transact', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productId, userId }) });
        if (r.ok){ const receipt = await r.json(); window.dispatchEvent(new CustomEvent('svr_commerce_success', { detail: receipt })); return true; }
      }catch(error){ console.warn('[SVR] commerce transaction unavailable', error.message || error); }
      finally{ window.dispatchEvent(new CustomEvent('svr_commerce_loading', { detail: { active:false } })); }
      return false;
    }
  };
  root.modules[MODULE] = api;
  window.SVRCommerceModule = api;
  api.init();
})();
