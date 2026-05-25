// Scarlett VR Poker - Daily Pick Wheel Module
// Phase 173 Milestone 5.0
// Play-money / demo reward wheel helper. No real-money wagering or payout logic.
(function(){
  if (typeof window === 'undefined') return;
  window.SVR_PHASE173_MODULES = window.SVR_PHASE173_MODULES || {};
  window.SVR_PHASE173_MODULES.dailyPick = { loaded: true, phase: 'PHASE-173-MILESTONE-5-PRIVACY-AND-PRESENTATION-LOCK', realMoney: false };
  if (!window.AFRAME) return;

  AFRAME.registerComponent('daily-pick-wheel', {
    schema: {
      minReward: { type: 'number', default: 500 },
      maxReward: { type: 'number', default: 5000 },
      step: { type: 'number', default: 500 }
    },
    init: function () {
      this.isSpinning = false;
      this.el.addEventListener('click', this.startSpinEngine.bind(this));
    },
    startSpinEngine: function () {
      if (this.isSpinning) return;
      this.isSpinning = true;
      const totalSteps = ((this.data.maxReward - this.data.minReward) / this.data.step) + 1;
      const chosenIndex = Math.floor(Math.random() * totalSteps);
      const targetReward = this.data.minReward + (chosenIndex * this.data.step);
      const baseDegreesPerSegment = 360 / totalSteps;
      const extraRevolutions = 360 * (4 + Math.floor(Math.random() * 3));
      const targetDegrees = extraRevolutions + (chosenIndex * baseDegreesPerSegment);
      const startLocation = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
      const initialZ = startLocation.z || 0;
      let startTime = null;
      const duration = 5000;
      const animateWheel = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        if (progress < duration) {
          const timeFactor = progress / duration;
          const decayFactor = 1 - Math.pow(1 - timeFactor, 3);
          this.el.setAttribute('rotation', { x: startLocation.x || 0, y: startLocation.y || 0, z: initialZ + (targetDegrees * decayFactor) });
          requestAnimationFrame(animateWheel);
        } else {
          const finalZ = (initialZ + targetDegrees) % 360;
          this.el.setAttribute('rotation', { x: startLocation.x || 0, y: startLocation.y || 0, z: finalZ });
          this.isSpinning = false;
          this.el.emit('daily-pick-finished', { rewardAmount: targetReward, currency: 'play_chips' });
          window.dispatchEvent(new CustomEvent('svr_daily_pick_finished', { detail: { rewardAmount: targetReward, currency: 'play_chips' } }));
        }
      };
      requestAnimationFrame(animateWheel);
    }
  });
})();
