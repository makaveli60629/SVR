// Scarlett VR Poker - VR Seat Helper Module
// Phase 173 Milestone 5.0
(function(){
  if (typeof window === 'undefined') return;
  window.SVR_PHASE173_MODULES = window.SVR_PHASE173_MODULES || {};
  window.SVR_PHASE173_MODULES.seatHelper = { loaded: true, phase: 'PHASE-173-MILESTONE-5-PRIVACY-AND-PRESENTATION-LOCK' };
  if (!window.AFRAME || !window.THREE) return;

  AFRAME.registerComponent('seat-trigger', {
    schema: {
      assignedSeatNum: { type: 'int', default: 1 },
      cameraSnapHeight: { type: 'number', default: 1.2 },
      range: { type: 'number', default: 0.6 }
    },
    init: function () {
      this.isOccupied = false;
      this.playerRig = document.getElementById('player-rig');
      this.seatWorldPos = new THREE.Vector3();
      this.playerWorldPos = new THREE.Vector3();
      this.lastCheck = 0;
      this.el.setAttribute('material', { color: '#b95aff', opacity: 0.2, transparent: true, shader: 'flat' });
    },
    tick: function (time) {
      if (time - this.lastCheck < 120) return;
      this.lastCheck = time;
      if (!this.playerRig) this.playerRig = document.getElementById('player-rig');
      if (!this.playerRig || this.isOccupied) return;
      this.el.object3D.getWorldPosition(this.seatWorldPos);
      this.playerRig.object3D.getWorldPosition(this.playerWorldPos);
      const dx = this.playerWorldPos.x - this.seatWorldPos.x;
      const dz = this.playerWorldPos.z - this.seatWorldPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < this.data.range) this.sitPlayer();
    },
    sitPlayer: function () {
      this.isOccupied = true;
      this.playerRig.setAttribute('position', { x: this.seatWorldPos.x, y: this.seatWorldPos.y + (this.data.cameraSnapHeight - 0.5), z: this.seatWorldPos.z });
      this.el.setAttribute('material', 'opacity', '0.05');
      this.el.emit('player-seated-automatically', { seatNum: this.data.assignedSeatNum });
      window.dispatchEvent(new CustomEvent('svr_player_seated_automatically', { detail: { seatNum: this.data.assignedSeatNum } }));
    }
  });
})();
