(function(){
  'use strict';
  const MODULE = 'mod_private';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    sessionToken: null,
    playerProfile: null,
    init(){ this.sessionToken = localStorage.getItem('svr_auth_token'); console.info('[SVR]', MODULE, 'ready'); if (root.config?.backendEnabled && this.sessionToken) this.verifySession(this.sessionToken); },
    async verifySession(token){
      try{
        const response = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok){ this.playerProfile = await response.json(); window.dispatchEvent(new CustomEvent('svr_user_authenticated', { detail: this.playerProfile })); }
        else this.logout(false);
      }catch(error){ console.warn('[SVR] session verification unavailable', error); }
    },
    evaluateSeatingProximity(playerPosition){
      if (!this.playerProfile || !playerPosition) return;
      const dx = playerPosition.x || 0;
      const dz = playerPosition.z || 0;
      if (Math.hypot(dx, dz) <= 2.5) this.executeAutoSeat();
    },
    executeAutoSeat(){
      const profile = this.playerProfile || { user_id: 'guest', username: 'Guest', chips_balance: 50000 };
      window.dispatchEvent(new CustomEvent('svr_request_seat', { detail: { userId: profile.user_id, username: profile.username, chips: profile.chips_balance, maxSeats: 6 } }));
    },
    async updateUserPoints(pointType, numericalValue){
      if (!root.config?.backendEnabled || !this.sessionToken) return false;
      try{
        const response = await fetch('/api/user/progression', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization:`Bearer ${this.sessionToken}` }, body: JSON.stringify({ type: pointType, increment: numericalValue }) });
        return response.ok;
      }catch(error){ console.warn('[SVR] progression sync unavailable', error); return false; }
    },
    logout(reload = true){ localStorage.removeItem('svr_auth_token'); this.sessionToken = null; this.playerProfile = null; if (reload) location.reload(); }
  };
  root.modules[MODULE] = api;
  window.SVRPrivateModule = api;
  api.init();
})();
