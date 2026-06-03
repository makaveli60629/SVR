/**
 * Portal System Component
 * Enables teleportation between VR environments
 * 
 * Usage:
 * <a-entity portal-system="destination: meditation; title: Meditation Chamber"></a-entity>
 */

AFRAME.registerComponent('portal-system', {
  schema: {
    destination: { type: 'string', default: 'meditation' },
    title: { type: 'string', default: 'Portal' },
    color: { type: 'string', default: '#9370db' },
    glowColor: { type: 'string', default: '#7b68ee' },
    scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    interactive: { type: 'boolean', default: true }
  },

  init: function() {
    const data = this.data;
    const scene = this.el.sceneEl;

    // Create portal ring
    this.createPortalRing(data);
    
    // Create label
    this.createLabel(data);

    // Add interaction
    if (data.interactive) {
      this.setupInteraction();
    }

    // Add particles
    this.createParticles(data);

    // Add sound effect
    this.createAudio();

    console.log(`🌀 Portal created: ${data.title} → ${data.destination}`);
  },

  createPortalRing: function(data) {
    // Main portal ring
    const ring = document.createElement('a-torus');
    ring.setAttribute('position', '0 0 0');
    ring.setAttribute('radius', '1.5');
    ring.setAttribute('radius-tubular', '0.15');
    ring.setAttribute('segments-radial', '64');
    ring.setAttribute('segments-tubular', '32');
    ring.setAttribute('material', `color: ${data.color}; emissive: ${data.glowColor}; emissiveIntensity: 0.8; shininess: 100;`);
    ring.setAttribute('rotation', '0 0 0');
    ring.setAttribute('animation', 'property: rotation; from: 0 0 0; to: 360 0 0; dur: 4000; loop: true; easing: linear;');
    this.el.appendChild(ring);

    // Rotating glow disk
    const disk = document.createElement('a-cylinder');
    disk.setAttribute('position', '0 0 0');
    disk.setAttribute('radius', '1.3');
    disk.setAttribute('height', '0.1');
    disk.setAttribute('material', `color: ${data.glowColor}; opacity: 0.3; emissive: ${data.glowColor}; emissiveIntensity: 0.6; transparent: true;`);
    disk.setAttribute('animation', 'property: rotation; from: 0 0 0; to: 0 360 0; dur: 6000; loop: true; easing: linear;');
    this.el.appendChild(disk);

    // Inner vortex effect
    const vortex = document.createElement('a-sphere');
    vortex.setAttribute('position', '0 0 0');
    vortex.setAttribute('radius', '1');
    vortex.setAttribute('segments-height', '32');
    vortex.setAttribute('segments-width', '32');
    vortex.setAttribute('material', `color: ${data.glowColor}; opacity: 0.2; emissive: ${data.glowColor}; emissiveIntensity: 0.7; transparent: true;`);
    vortex.setAttribute('animation', 'property: scale; from: 1 1 1; to: 1.1 1.1 1.1; dur: 2000; dir: alternate; loop: true;');
    this.el.appendChild(vortex);

    // Outer ring for depth
    const outerRing = document.createElement('a-torus');
    outerRing.setAttribute('position', '0 0 0');
    outerRing.setAttribute('radius', '2');
    outerRing.setAttribute('radius-tubular', '0.08');
    outerRing.setAttribute('segments-radial', '64');
    outerRing.setAttribute('segments-tubular', '32');
    outerRing.setAttribute('material', `color: ${data.color}; opacity: 0.5; emissive: ${data.glowColor}; emissiveIntensity: 0.4; transparent: true;`);
    outerRing.setAttribute('animation', 'property: rotation; from: 0 0 0; to: 360 0 0; dur: 8000; loop: true; easing: linear;');
    this.el.appendChild(outerRing);
  },

  createLabel: function(data) {
    const label = document.createElement('a-text');
    label.setAttribute('position', '0 2.5 0');
    label.setAttribute('value', data.title);
    label.setAttribute('align', 'center');
    label.setAttribute('anchor', 'center');
    label.setAttribute('scale', '2 2 2');
    label.setAttribute('color', '#fff');
    label.setAttribute('font-family', 'Arial');
    label.setAttribute('width', '10');
    this.el.appendChild(label);

    // Subtitle with destination
    const subtitle = document.createElement('a-text');
    subtitle.setAttribute('position', '0 -2.5 0');
    subtitle.setAttribute('value', `→ ${data.destination}`);
    subtitle.setAttribute('align', 'center');
    subtitle.setAttribute('anchor', 'center');
    subtitle.setAttribute('scale', '1.5 1.5 1.5');
    subtitle.setAttribute('color', data.glowColor);
    subtitle.setAttribute('font-family', 'Arial');
    subtitle.setAttribute('width', '10');
    this.el.appendChild(subtitle);
  },

  createParticles: function(data) {
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const x = Math.cos(angle) * 2;
      const z = Math.sin(angle) * 2;
      const y = (Math.random() - 0.5) * 3;

      const particle = document.createElement('a-sphere');
      particle.setAttribute('position', `${x} ${y} ${z}`);
      particle.setAttribute('radius', `${0.1 + Math.random() * 0.15}`);
      particle.setAttribute('material', `color: ${data.glowColor}; emissive: ${data.glowColor}; emissiveIntensity: 0.8;`);
      
      const duration = 3000 + Math.random() * 2000;
      const targetX = Math.cos(angle) * 1;
      const targetZ = Math.sin(angle) * 1;
      const targetY = y + (Math.random() - 0.5) * 2;

      particle.setAttribute('animation', `property: position; from: ${x} ${y} ${z}; to: ${targetX} ${targetY} ${targetZ}; dur: ${duration}; loop: true; dir: alternate;`);
      this.el.appendChild(particle);
    }
  },

  createAudio: function() {
    const audio = document.createElement('a-entity');
    audio.setAttribute('sound', 'src: url(data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAAA=); volume: 0.5; loop: false;');
    this.el.appendChild(audio);
    this.audioEntity = audio;
  },

  setupInteraction: function() {
    const self = this;
    const data = this.data;

    // Cursor hover effect
    this.el.addEventListener('mouseenter', function() {
      self.el.setAttribute('scale', '1.2 1.2 1.2');
      self.playSound();
    });

    this.el.addEventListener('mouseleave', function() {
      self.el.setAttribute('scale', '1 1 1');
    });

    // Click to teleport
    this.el.addEventListener('click', function() {
      self.teleport();
    });

    // Hand tracking (for VR)
    this.el.addEventListener('grip-down', function() {
      self.teleport();
    });
  },

  playSound: function() {
    // Play portal activation sound
    if (this.audioEntity) {
      const sound = this.audioEntity.components.sound;
      if (sound) {
        sound.playSound();
      }
    }
  },

  teleport: function() {
    const data = this.data;
    const camera = document.querySelector('a-camera');
    
    // Flash effect
    const flash = document.createElement('a-plane');
    flash.setAttribute('position', '0 0 -0.1');
    flash.setAttribute('width', '100');
    flash.setAttribute('height', '100');
    flash.setAttribute('material', 'color: #fff; opacity: 1;');
    flash.setAttribute('animation', 'property: material.opacity; from: 1; to: 0; dur: 500; easing: easeInQuad;');
    camera.appendChild(flash);

    setTimeout(() => {
      flash.remove();
    }, 500);

    // Emit teleport event
    const event = new CustomEvent('portal-teleport', {
      detail: { destination: data.destination }
    });
    document.dispatchEvent(event);

    console.log(`✨ Teleporting to ${data.destination}...`);

    // Emit to global event system if available
    if (window.eventEmitter) {
      window.eventEmitter.emit('portal:teleport', { destination: data.destination });
    }
  }
});

/**
 * Portal Manager - Controls all portals in scene
 */
AFRAME.registerComponent('portal-manager', {
  schema: {
    autoSpawn: { type: 'boolean', default: true },
    spacing: { type: 'number', default: 6 }
  },

  init: function() {
    const data = this.data;
    const scene = this.el.sceneEl;

    if (data.autoSpawn) {
      this.spawnDefaultPortals(scene, data.spacing);
    }

    // Listen for teleport events
    document.addEventListener('portal-teleport', (e) => {
      this.handleTeleport(e.detail.destination);
    });
  },

  spawnDefaultPortals: function(scene, spacing) {
    const portals = [
      {
        position: { x: 0, y: 2, z: -8 },
        destination: 'meditation',
        title: '🧘 Meditation',
        color: '#9370db',
        glowColor: '#7b68ee'
      },
      {
        position: { x: 8, y: 2, z: -8 },
        destination: 'poker',
        title: '🎰 Poker Table',
        color: '#ffd700',
        glowColor: '#ffed4e'
      },
      {
        position: { x: -8, y: 2, z: -8 },
        destination: 'webex',
        title: '📞 Video Call',
        color: '#00d4ff',
        glowColor: '#00ffff'
      },
      {
        position: { x: 10, y: 2, z: 0 },
        destination: 'pga-store',
        title: '⛳ PGA Storefront',
        color: '#00aa44',
        glowColor: '#00ff66'
      },
      {
        position: { x: -10, y: 2, z: 0 },
        destination: 'smoker-store',
        title: '🚬 Smoker Shop',
        color: '#8b4513',
        glowColor: '#a0522d'
      }
    ];

    portals.forEach(portal => {
      const entity = document.createElement('a-entity');
      entity.setAttribute('position', `${portal.position.x} ${portal.position.y} ${portal.position.z}`);
      entity.setAttribute('portal-system', {
        destination: portal.destination,
        title: portal.title,
        color: portal.color,
        glowColor: portal.glowColor
      });
      scene.appendChild(entity);
    });

    console.log(`🌀 ${portals.length} portals spawned`);
  },

  handleTeleport: function(destination) {
    console.log(`📍 Portal manager handling teleport to: ${destination}`);
    // Can be extended for additional logic
  }
});
