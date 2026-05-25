(function(){
  'use strict';
  const MODULE = 'mod_network';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    socketInstance: null,
    broadcastInterval: null,
    transmitRateMS: 45,
    init(){ console.info('[SVR]', MODULE, 'ready in dormant mode'); if (root.config?.multiplayerEnabled) this.establishServerConnection(); },
    establishServerConnection(){
      if (!('WebSocket' in window)) return;
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      this.socketInstance = new WebSocket(`${proto}://${location.host}/api/multiplayer/sync`);
      this.socketInstance.onopen = () => this.startReplicationLoop();
      this.socketInstance.onmessage = event => { try { this.demuxIncomingPacket(JSON.parse(event.data)); } catch(error){ console.warn('[SVR] bad network packet', error); } };
      this.socketInstance.onclose = () => { clearInterval(this.broadcastInterval); if (root.config?.multiplayerEnabled) setTimeout(()=>this.establishServerConnection(), 5000); };
    },
    startReplicationLoop(){
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = setInterval(()=>{
        if (this.socketInstance?.readyState !== WebSocket.OPEN) return;
        const packet = { u_id: window.SVRPrivateModule?.playerProfile?.user_id || 'guest_tester', h_rot:[0,0,0], lh:[0,0,0], rh:[0,0,0] };
        this.socketInstance.send(JSON.stringify(packet));
      }, this.transmitRateMS);
    },
    demuxIncomingPacket(data){
      if (!window.THREE || !data?.u_id || !Array.isArray(data.lh) || !Array.isArray(data.rh)) return;
      window.dispatchEvent(new CustomEvent('svr_network_player_update', { detail: { userId: data.u_id, headPos: new THREE.Vector3(data.lh[0], data.lh[1]+.5, data.lh[2]), leftHandPos: new THREE.Vector3(data.lh[0], data.lh[1], data.lh[2]), rightHandPos: new THREE.Vector3(data.rh[0], data.rh[1], data.rh[2]) } }));
    }
  };
  root.modules[MODULE] = api;
  window.SVRNetworkModule = api;
  api.init();
})();
