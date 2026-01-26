// /js/scarlett1/world.js - Circular Lobby + Features (PERMANENT)
(function () {
  // Door behavior: simple open/close animation on pad poke/grab
  AFRAME.registerComponent('doorway', {
    schema: { open: { default: false } },
    init: function () {
      this.closedY = this.el.object3D.position.y;
    },
    openDoor: function () {
      // slide down slightly to simulate opening
      this.el.setAttribute('animation__open', 'property: position; dur: 350; easing: easeOutQuad; to: 0 -8.0 0.55');
      this.data.open = true;
    },
    closeDoor: function () {
      this.el.setAttribute('animation__close', `property: position; dur: 350; easing: easeOutQuad; to: 0 -6.2 0.55`);
      this.data.open = false;
    }
  });

  AFRAME.registerComponent('doorpad', {
    init: function () {
      // glow pulse
      this.el.setAttribute('animation__pulse', 'property: material.emissiveIntensity; dir: alternate; dur: 900; loop: true; to: 3.5');
      this.el.addEventListener('grab-start', () => this.toggle());
      this.el.addEventListener('click', () => this.toggle());
    },
    toggle: function () {
      const stack = this.el.closest('.jumbotron-stack');
      if (!stack) return;
      const door = stack.querySelector('.door');
      if (!door) return;
      const doorway = door.components.doorway;
      if (!doorway) return;
      if (doorway.data.open) doorway.closeDoor();
      else doorway.openDoor();
    }
  });

  // World API for Dev HUD
  window.ScarlettWorld = {
    neonOn: true,

    toggleLobbyNeon() {
      this.neonOn = !this.neonOn;
      const targets = ['#neon-ring-top', '#neon-ring-mid', '#neon-ring-base'];
      targets.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el) return;
        el.setAttribute('material', `emissiveIntensity: ${this.neonOn ? (sel.includes('mid') ? 10 : 16) : 0.2}`);
      });
      console.log('Lobby neon:', this.neonOn ? 'ON' : 'OFF');
    },

    dealFlop() {
      const container = document.querySelector('#community-cards');
      if (!container) return;

      container.innerHTML = '';

      for (let i = 0; i < 3; i++) {
        const card = document.createElement('a-box');
        card.classList.add('grabbable');

        card.setAttribute('width', '0.5');
        card.setAttribute('height', '0.7');
        card.setAttribute('depth', '0.02');
        card.setAttribute('position', `${(i - 1) * 0.7} 0 0`);
        card.setAttribute('rotation', '-90 0 0');

        // Material placeholder
        card.setAttribute('material', 'color: #ffffff; metalness: 0.2; roughness: 0.85');

        // Living hover
        card.setAttribute('animation__hover', `property: position; dir: alternate; dur: 1800; loop: true; to: ${(i - 1) * 0.7} 0.08 0`);

        // Grab whole card
        card.setAttribute('grabbable', '');
        card.setAttribute('hoverable', '');
        card.setAttribute('droppable', '');

        container.appendChild(card);
      }
      console.log('Feature: Flop spawned (grabbable).');
    },

    spawnBot() {
      const anchor = document.querySelector('#bot-anchor');
      if (!anchor) return;

      const bot = document.createElement('a-entity');
      bot.innerHTML = `
        <a-sphere radius="0.5" position="4 1.5 0" color="#333"></a-sphere>
        <a-text value="BOT" position="4 2.2 0" align="center" width="4"></a-text>
      `;
      anchor.appendChild(bot);
    },

    toggleStore() {
      alert('Store Module: Loading Avatars (Male/Female/Ninja)…');
    }
  };

  // Auto-start: spawn cards
  document.addEventListener('DOMContentLoaded', () => {
    window.ScarlettWorld.dealFlop();
  });
})();
