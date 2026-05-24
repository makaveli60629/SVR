// Scarlett VR Poker - Security Bubble Module
// Phase 173 Milestone 5.0
// Safe A-Frame component wrapper. This file is standalone and does not mutate the current Three.js runtime unless AFRAME loads it.
(function(){
  if (typeof window === 'undefined') return;
  window.SVR_PHASE173_MODULES = window.SVR_PHASE173_MODULES || {};
  window.SVR_PHASE173_MODULES.securityBubble = { loaded: true, phase: 'PHASE-173-MILESTONE-5-PRIVACY-AND-PRESENTATION-LOCK' };
  if (!window.AFRAME || !window.THREE) return;

  AFRAME.registerComponent('security-bubble', {
    schema: {
      playerSeatId: { type: 'string', default: '' },
      protectionRadius: { type: 'number', default: 0.45 },
      cloakColor: { type: 'string', default: '#050505' }
    },

    init: function () {
      this.isViolated = false;
      this.handTipTarget = new THREE.Vector3();
      this.cardTarget = new THREE.Vector3();
      this._originalColor = null;
      this._lastCheck = 0;
    },

    tick: function (time) {
      if (time - this._lastCheck < 120) return;
      this._lastCheck = time;
      const sceneEl = this.el.sceneEl;
      if (!sceneEl) return;
      const remoteHands = sceneEl.querySelectorAll('[hand-tracking-controls]');
      if (!remoteHands.length) return;

      this.el.object3D.getWorldPosition(this.cardTarget);
      let violationDetected = false;

      remoteHands.forEach((handEl) => {
        if (handEl.closest('#player-rig')) return;
        const handMesh = handEl.getObject3D('mesh');
        if (!handMesh) return;
        const indexTip = handMesh.getObjectByName('index-finger-tip') || handMesh.getObjectByName('indexTip') || handMesh;
        if (!indexTip) return;
        indexTip.getWorldPosition(this.handTipTarget);
        if (this.cardTarget.distanceTo(this.handTipTarget) < this.data.protectionRadius) violationDetected = true;
      });

      if (violationDetected && !this.isViolated) this.executeCloak();
      if (!violationDetected && this.isViolated) this.liftCloak();
    },

    executeCloak: function () {
      this.isViolated = true;
      const textEl = this.el.querySelector('a-text');
      if (textEl) textEl.setAttribute('visible', 'false');
      const mat = this.el.getAttribute('material') || {};
      this._originalColor = mat.color || '#7a2cff';
      this.el.setAttribute('material', 'color', this.data.cloakColor);
      this.el.emit('security-privacy-activated', { seat: this.data.playerSeatId });
    },

    liftCloak: function () {
      this.isViolated = false;
      const textEl = this.el.querySelector('a-text');
      if (textEl) textEl.setAttribute('visible', 'true');
      this.el.setAttribute('material', 'color', this._originalColor || '#7a2cff');
      this.el.emit('security-privacy-deactivated', { seat: this.data.playerSeatId });
    }
  });
})();
