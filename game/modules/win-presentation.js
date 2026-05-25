// Scarlett VR Poker - Win Presentation Module
// Phase 173 Milestone 5.0
(function(){
  if (typeof window === 'undefined') return;
  window.SVR_PHASE173_MODULES = window.SVR_PHASE173_MODULES || {};
  window.SVR_PHASE173_MODULES.winPresentation = { loaded: true, phase: 'PHASE-173-MILESTONE-5-PRIVACY-AND-PRESENTATION-LOCK' };
  if (!window.AFRAME) return;

  AFRAME.registerComponent('win-presentation', {
    schema: {
      duration: { type: 'number', default: 10000 },
      glowColor: { type: 'string', default: '#b95aff' }
    },
    init: function () {
      this.el.addEventListener('game-win-event', this.handleWin.bind(this));
      this.textContainer = null;
      this.activePulseSeat = null;
      this.winTimeout = null;
    },
    handleWin: function (event) {
      const data = event.detail || {};
      this.clearActivePresentation();
      this.triggerFloatingText(data.winnerName || 'PLAYER', data.handDetails || 'WINNING HAND');
      this.triggerSeatPulse(data.seatId);
      this.winTimeout = setTimeout(() => this.clearActivePresentation(), this.data.duration);
      window.dispatchEvent(new CustomEvent('svr_win_presentation_active', { detail: { winnerName: data.winnerName, handDetails: data.handDetails, duration: this.data.duration } }));
    },
    triggerFloatingText: function (winnerName, handDetails) {
      this.textContainer = document.createElement('a-entity');
      this.textContainer.setAttribute('position', '0 2.2 -1.5');
      this.textContainer.setAttribute('id', 'svr-win-text-overlay');
      const nameText = document.createElement('a-text');
      nameText.setAttribute('value', String(winnerName).toUpperCase() + ' WINS!');
      nameText.setAttribute('align', 'center');
      nameText.setAttribute('color', '#f3ecff');
      nameText.setAttribute('font', 'mozillavr');
      nameText.setAttribute('width', '5');
      nameText.setAttribute('position', '0 0.3 0');
      const detailsText = document.createElement('a-text');
      detailsText.setAttribute('value', 'WITH ' + String(handDetails).toUpperCase());
      detailsText.setAttribute('align', 'center');
      detailsText.setAttribute('color', this.data.glowColor);
      detailsText.setAttribute('font', 'mozillavr');
      detailsText.setAttribute('width', '3.5');
      detailsText.setAttribute('position', '0 0 0');
      this.textContainer.setAttribute('animation', { property: 'scale', from: '0 0 0', to: '1 1 1', dur: 400, easing: 'easeOutBack' });
      this.textContainer.appendChild(nameText);
      this.textContainer.appendChild(detailsText);
      this.el.sceneEl.appendChild(this.textContainer);
    },
    triggerSeatPulse: function (seatId) {
      if (!seatId) return;
      const seatEl = document.getElementById(seatId);
      if (!seatEl) return;
      this.activePulseSeat = seatEl;
      seatEl.setAttribute('animation__glow', { property: 'material.emissive', from: '#000000', to: this.data.glowColor, dur: 1000, dir: 'alternate', loop: true });
      seatEl.setAttribute('animation__intensity', { property: 'material.emissiveIntensity', from: '0.2', to: '2.0', dur: 1000, dir: 'alternate', loop: true });
    },
    clearActivePresentation: function () {
      if (this.winTimeout) clearTimeout(this.winTimeout);
      this.winTimeout = null;
      if (this.textContainer && this.textContainer.parentNode) this.textContainer.parentNode.removeChild(this.textContainer);
      this.textContainer = null;
      if (this.activePulseSeat) {
        this.activePulseSeat.removeAttribute('animation__glow');
        this.activePulseSeat.removeAttribute('animation__intensity');
        this.activePulseSeat.setAttribute('material', 'emissiveIntensity', '0');
        this.activePulseSeat = null;
      }
    }
  });
})();
