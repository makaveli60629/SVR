/**
 * SVR Poker — vrPokerTable.js
 * A-Frame component that renders the live table state in VR.
 * Three.js r170 / A-Frame 1.5
 */

export class VRPokerTable {
  constructor(scene) {
    this.scene      = scene;
    this.tableState = null;
    this._cards     = new Map();
    this._seats     = new Map();
  }

  /** Update from server tableState */
  update(table) {
    this.tableState = table;
    this._renderCommunity();
    this._renderPlayers();
  }

  _renderCommunity() {
    if (!this.tableState) return;
    const cards = this.tableState.community || [];

    cards.forEach((label, i) => {
      const id = 'community_' + i;
      let el   = document.getElementById(id);
      if (!el) {
        el = document.createElement('a-plane');
        el.setAttribute('id', id);
        el.setAttribute('width',  '0.30');
        el.setAttribute('height', '0.45');
        el.setAttribute('color',  '#ffffff');
        el.setAttribute('position', `${i * 0.38 - 0.76} 1.12 -0.95`);
        el.setAttribute('rotation', '-90 0 0');
        this.scene.appendChild(el);
        this._cards.set(id, el);
      }
      el.setAttribute('text', `value: ${label}; align: center; color: black; width: 1`);
    });

    // Remove stale cards
    for (const [id, el] of this._cards) {
      const idx = parseInt(id.replace('community_', ''));
      if (idx >= cards.length) { el.remove(); this._cards.delete(id); }
    }
  }

  _renderPlayers() {
    if (!this.tableState) return;
    const n = this.tableState.players.length;

    this.tableState.players.forEach((p, i) => {
      const angle = (i / n) * Math.PI * 2;
      const r     = 2.0;
      const x     = Math.cos(angle) * r;
      const z     = Math.sin(angle) * r;

      const id = 'seat_' + i;
      let seat = document.getElementById(id);
      if (!seat) {
        seat = document.createElement('a-cylinder');
        seat.setAttribute('id', id);
        seat.setAttribute('radius', '0.28');
        seat.setAttribute('height', '0.08');
        seat.setAttribute('color',  '#1a004a');
        seat.setAttribute('position', `${x} 0.82 ${z}`);
        this.scene.appendChild(seat);
        this._seats.set(id, seat);
      }

      // Name label
      let label = document.getElementById('label_' + i);
      if (!label) {
        label = document.createElement('a-text');
        label.setAttribute('id', 'label_' + i);
        label.setAttribute('align', 'center');
        label.setAttribute('color', p.folded ? '#555' : '#b95aff');
        label.setAttribute('position', `${x} 1.22 ${z}`);
        label.setAttribute('look-at', '[camera]');
        this.scene.appendChild(label);
      }
      label.setAttribute('value', `${p.name}\n💰${p.chips}${p.folded ? '\n[folded]' : ''}`);
      label.setAttribute('color', p.folded ? '#555' : '#b95aff');
    });
  }
}

// Also register as A-Frame component for A-Frame scenes
if (typeof AFRAME !== 'undefined') {
  AFRAME.registerComponent('vr-poker-table', {
    init() {
      this.vrTable = new VRPokerTable(this.el.sceneEl || this.el);
    },
    update(data) {
      if (data && data.tableState) this.vrTable.update(data.tableState);
    },
  });
}
