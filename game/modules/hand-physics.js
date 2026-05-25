// Scarlett VR Poker - Velocity Hand Physics Module
// Phase 173 Milestone 5.0
// Safe A-Frame component wrapper. Pre-allocates vectors to reduce Quest browser GC spikes.
(function(){
  if (typeof window === 'undefined') return;
  window.SVR_PHASE173_MODULES = window.SVR_PHASE173_MODULES || {};
  window.SVR_PHASE173_MODULES.handPhysics = { loaded: true, phase: 'PHASE-173-MILESTONE-5-PRIVACY-AND-PRESENTATION-LOCK' };
  if (!window.AFRAME || !window.THREE) return;

  AFRAME.registerComponent('hand-physics', {
    schema: {
      velocityThreshold: { type: 'number', default: 1.2 },
      targetMuckZone: { type: 'vec3', default: { x: 0, y: 0.8, z: -1.5 } }
    },

    init: function () {
      this.positionHistory = [];
      this.maxFrames = 5;
      this.trackedJoint = null;
      this.currentPos = new THREE.Vector3();
      this.oldestToNewest = new THREE.Vector3();
      this.direction = new THREE.Vector3();
      this.el.addEventListener('model-loaded', this.bindHandTracking.bind(this));
    },

    bindHandTracking: function () {
      const controllerMesh = this.el.getObject3D('mesh');
      if (controllerMesh) {
        this.trackedJoint = controllerMesh.getObjectByName('wrist') || controllerMesh;
      }
    },

    tick: function (time) {
      if (!this.trackedJoint) this.bindHandTracking();
      if (!this.trackedJoint) return;

      this.trackedJoint.getWorldPosition(this.currentPos);
      this.positionHistory.push({ x: this.currentPos.x, y: this.currentPos.y, z: this.currentPos.z, time: time });
      if (this.positionHistory.length > this.maxFrames) this.positionHistory.shift();
      if (this.positionHistory.length < 2) return;

      const oldest = this.positionHistory[0];
      const newest = this.positionHistory[this.positionHistory.length - 1];
      const dx = newest.x - oldest.x;
      const dy = newest.y - oldest.y;
      const dz = newest.z - oldest.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const timeSec = (newest.time - oldest.time) / 1000;
      if (timeSec <= 0) return;

      const velocity = distance / timeSec;
      if (velocity > this.data.velocityThreshold) this.evaluateFlickGesture(dx, dy, dz);
    },

    evaluateFlickGesture: function (dx, dy, dz) {
      this.direction.set(dx, dy, dz).normalize();
      if (this.direction.z < -0.5) {
        this.positionHistory.length = 0;
        this.el.emit('hand-physics-flick-triggered', { direction: this.direction.clone() });
        window.dispatchEvent(new CustomEvent('svr_hand_physics_flick', { detail: { direction: { x: this.direction.x, y: this.direction.y, z: this.direction.z } } }));
      }
    }
  });
})();
