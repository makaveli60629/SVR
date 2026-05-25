(function(){
  'use strict';
  const MODULE = 'mod_watch';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    isActive: false,
    menuOptions: ['Profile_Rank','Wallet_Chips','Lobby_Menu','Reiki_Audio'],
    init(leftHandAnchor){
      if (!window.THREE || !leftHandAnchor){ console.info('[SVR]', MODULE, 'ready in dormant mode'); return; }
      this.buildHolographicInterface(leftHandAnchor);
      window.addEventListener('svr_left_palm_state', e => e.detail?.facingUp ? this.activateHologram() : this.deactivateHologram());
    },
    buildHolographicInterface(handAnchor){
      this.holoMenuMesh = new THREE.Group(); this.holoMenuMesh.position.set(0,0.15,0); this.holoMenuMesh.visible = false;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08,0.005,8,24), new THREE.MeshBasicMaterial({ color:0x00ffcc, wireframe:true, transparent:true, opacity:.4 }));
      ring.rotation.x = Math.PI/2; this.holoMenuMesh.add(ring);
      this.menuOptions.forEach((name,i)=>{ const a=(i/this.menuOptions.length)*Math.PI*2; const panel=new THREE.Mesh(new THREE.BoxGeometry(.05,.02,.005), new THREE.MeshBasicMaterial({color:0x2d1442, transparent:true, opacity:.8})); panel.position.set(Math.cos(a)*.06,0,Math.sin(a)*.06); panel.name=`btn_${name.toLowerCase()}`; this.holoMenuMesh.add(panel); });
      handAnchor.add(this.holoMenuMesh);
    },
    activateHologram(){ this.isActive = true; if (this.holoMenuMesh) this.holoMenuMesh.visible = true; },
    deactivateHologram(){ this.isActive = false; if (this.holoMenuMesh) this.holoMenuMesh.visible = false; },
    executeMenuAction(actionName){ window.dispatchEvent(new CustomEvent('svr_holo_watch_action', { detail: { actionName } })); }
  };
  root.modules[MODULE] = api;
  window.SVRHoloWatchModule = api;
})();
