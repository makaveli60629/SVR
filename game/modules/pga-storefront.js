/**
 * PGA Storefront VR Component
 * Premium Golf equipment and apparel retail experience
 * 
 * Usage:
 * <a-entity pga-storefront="enabled: true"></a-entity>
 */

AFRAME.registerComponent('pga-storefront', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },

  init: function() {
    const scene = this.el.sceneEl;

    // Environment
    this.createEnvironment();
    
    // Lighting
    this.setupLighting();
    
    // Storefront structure
    this.createStorefront();
    
    // Product displays
    this.createProductDisplays();
    
    // Shop counter
    this.createShopCounter();
    
    // Background
    this.createBackground();

    console.log('⛳ PGA Storefront loaded');
  },

  createEnvironment: function() {
    const scene = this.el.sceneEl;

    // Outdoor environment
    const sky = document.createElement('a-sky');
    sky.setAttribute('color', '#87CEEB');
    scene.appendChild(sky);

    // Ground (grass)
    const ground = document.createElement('a-plane');
    ground.setAttribute('position', '0 0 0');
    ground.setAttribute('rotation', '-90 0 0');
    ground.setAttribute('width', '100');
    ground.setAttribute('height', '100');
    ground.setAttribute('color', '#2d5016');
    ground.setAttribute('material', 'emissive: #1a3d0a; emissiveIntensity: 0.2;');
    scene.appendChild(ground);
  },

  setupLighting: function() {
    const scene = this.el.sceneEl;

    // Sunlight
    const sunlight = document.createElement('a-light');
    sunlight.setAttribute('type', 'directional');
    sunlight.setAttribute('position', '10 20 10');
    sunlight.setAttribute('intensity', '1');
    sunlight.setAttribute('color', '#fff');
    scene.appendChild(sunlight);

    // Ambient
    const ambient = document.createElement('a-light');
    ambient.setAttribute('type', 'ambient');
    ambient.setAttribute('intensity', '0.6');
    ambient.setAttribute('color', '#fff');
    scene.appendChild(ambient);
  },

  createStorefront: function() {
    const scene = this.el.sceneEl;

    // Main storefront building
    const building = document.createElement('a-box');
    building.setAttribute('position', '0 3 -10');
    building.setAttribute('width', '12');
    building.setAttribute('height', '6');
    building.setAttribute('depth', '6');
    building.setAttribute('color', '#f5f5f5');
    building.setAttribute('material', 'emissive: #ffffff; emissiveIntensity: 0.1;');
    scene.appendChild(building);

    // Storefront roof
    const roof = document.createElement('a-pyramid');
    roof.setAttribute('position', '0 6 -10');
    roof.setAttribute('width', '12.5');
    roof.setAttribute('height', '2');
    roof.setAttribute('depth', '6.5');
    roof.setAttribute('color', '#1a1a1a');
    scene.appendChild(roof);

    // Front glass window
    const window1 = document.createElement('a-plane');
    window1.setAttribute('position', '-3 3 -3.9');
    window1.setAttribute('width', '2.5');
    window1.setAttribute('height', '4');
    window1.setAttribute('material', 'color: #87CEEB; opacity: 0.3; transparent: true; emissive: #87CEEB; emissiveIntensity: 0.2;');
    scene.appendChild(window1);

    const window2 = document.createElement('a-plane');
    window2.setAttribute('position', '0 3 -3.9');
    window2.setAttribute('width', '2.5');
    window2.setAttribute('height', '4');
    window2.setAttribute('material', 'color: #87CEEB; opacity: 0.3; transparent: true; emissive: #87CEEB; emissiveIntensity: 0.2;');
    scene.appendChild(window2);

    const window3 = document.createElement('a-plane');
    window3.setAttribute('position', '3 3 -3.9');
    window3.setAttribute('width', '2.5');
    window3.setAttribute('height', '4');
    window3.setAttribute('material', 'color: #87CEEB; opacity: 0.3; transparent: true; emissive: #87CEEB; emissiveIntensity: 0.2;');
    scene.appendChild(window3);

    // Door
    const door = document.createElement('a-box');
    door.setAttribute('position', '0 1 -3.95');
    door.setAttribute('width', '1.2');
    door.setAttribute('height', '2.5');
    door.setAttribute('depth', '0.1');
    door.setAttribute('color', '#8B4513');
    scene.appendChild(door);

    // Store sign
    const sign = document.createElement('a-box');
    sign.setAttribute('position', '0 7 -10');
    sign.setAttribute('width', '5');
    sign.setAttribute('height', '1.2');
    sign.setAttribute('depth', '0.3');
    sign.setAttribute('color', '#1a1a1a');
    scene.appendChild(sign);

    const signText = document.createElement('a-text');
    signText.setAttribute('position', '0 7 -9.8');
    signText.setAttribute('value', '⛳ PGA PRO SHOP ⛳');
    signText.setAttribute('align', 'center');
    signText.setAttribute('anchor', 'center');
    signText.setAttribute('scale', '2 2 2');
    signText.setAttribute('color', '#00aa44');
    scene.appendChild(signText);
  },

  createProductDisplays: function() {
    const scene = this.el.sceneEl;

    // Golf clubs display
    this.createDisplay(scene, -4, 2, -5, '🏌️ GOLF CLUBS', '#ff6b6b');
    
    // Golf balls display
    this.createDisplay(scene, 0, 2, -5, '⚪ GOLF BALLS', '#ff9f9f');
    
    // Golf bags display
    this.createDisplay(scene, 4, 2, -5, '🎒 GOLF BAGS', '#ffb3b3');
    
    // Apparel display
    this.createDisplay(scene, -4, 2, 0, '👕 APPAREL', '#66cc99');
    
    // Shoes display
    this.createDisplay(scene, 0, 2, 0, '👟 SHOES', '#99ffcc');
    
    // Accessories display
    this.createDisplay(scene, 4, 2, 0, '⌚ ACCESSORIES', '#ccffee');
  },

  createDisplay: function(scene, x, y, z, label, color) {
    // Display pedestal
    const pedestal = document.createElement('a-box');
    pedestal.setAttribute('position', `${x} ${y} ${z}`);
    pedestal.setAttribute('width', '1.5');
    pedestal.setAttribute('height', '2');
    pedestal.setAttribute('depth', '1.5');
    pedestal.setAttribute('color', color);
    pedestal.setAttribute('material', `emissive: ${color}; emissiveIntensity: 0.3;`);
    scene.appendChild(pedestal);

    // Product sphere
    const product = document.createElement('a-sphere');
    product.setAttribute('position', `${x} ${y + 1.5} ${z}`);
    product.setAttribute('radius', '0.5');
    product.setAttribute('color', color);
    product.setAttribute('material', `emissive: ${color}; emissiveIntensity: 0.6; shininess: 100;`);
    product.setAttribute('animation', 'property: rotation; from: 0 0 0; to: 0 360 0; dur: 4000; loop: true;');
    scene.appendChild(product);

    // Label
    const labelText = document.createElement('a-text');
    labelText.setAttribute('position', `${x} ${y + 2.2} ${z}`);
    labelText.setAttribute('value', label);
    labelText.setAttribute('align', 'center');
    labelText.setAttribute('anchor', 'center');
    labelText.setAttribute('scale', '0.8 0.8 0.8');
    labelText.setAttribute('color', '#000');
    scene.appendChild(labelText);

    // Price tag
    const priceText = document.createElement('a-text');
    priceText.setAttribute('position', `${x} ${y - 1} ${z}`);
    priceText.setAttribute('value', '$' + Math.floor(Math.random() * 300 + 50));
    priceText.setAttribute('align', 'center');
    priceText.setAttribute('anchor', 'center');
    priceText.setAttribute('scale', '0.6 0.6 0.6');
    priceText.setAttribute('color', '#fff');
    scene.appendChild(priceText);

    // Buy button
    this.createBuyButton(scene, x, y - 1.3, z, label);
  },

  createBuyButton: function(scene, x, y, z, productName) {
    const button = document.createElement('a-box');
    button.setAttribute('position', `${x} ${y} ${z}`);
    button.setAttribute('width', '0.8');
    button.setAttribute('height', '0.4');
    button.setAttribute('depth', '0.2');
    button.setAttribute('color', '#00aa44');
    button.setAttribute('material', 'emissive: #00ff66; emissiveIntensity: 0.5;');
    button.setAttribute('class', 'buy-button');
    button.setAttribute('data-product', productName);

    const buttonText = document.createElement('a-text');
    buttonText.setAttribute('position', '0 0 0.15');
    buttonText.setAttribute('value', 'BUY');
    buttonText.setAttribute('align', 'center');
    buttonText.setAttribute('anchor', 'center');
    buttonText.setAttribute('scale', '0.5 0.5 0.5');
    buttonText.setAttribute('color', '#fff');
    button.appendChild(buttonText);

    button.addEventListener('click', () => {
      this.handlePurchase(productName);
    });

    scene.appendChild(button);
  },

  createShopCounter: function() {
    const scene = this.el.sceneEl;

    // Counter desk
    const counter = document.createElement('a-box');
    counter.setAttribute('position', '0 1.2 2');
    counter.setAttribute('width', '4');
    counter.setAttribute('height', '1');
    counter.setAttribute('depth', '1');
    counter.setAttribute('color', '#8B4513');
    scene.appendChild(counter);

    // Register
    const register = document.createElement('a-box');
    register.setAttribute('position', '0 2 2');
    register.setAttribute('width', '0.8');
    register.setAttribute('height', '0.6');
    register.setAttribute('depth', '0.5');
    register.setAttribute('color', '#333');
    scene.appendChild(register);

    // Cashier sign
    const cashierSign = document.createElement('a-text');
    cashierSign.setAttribute('position', '0 2.8 2');
    cashierSign.setAttribute('value', 'CHECKOUT');
    cashierSign.setAttribute('align', 'center');
    cashierSign.setAttribute('anchor', 'center');
    cashierSign.setAttribute('scale', '1 1 1');
    cashierSign.setAttribute('color', '#fff');
    scene.appendChild(cashierSign);
  },

  createBackground: function() {
    const scene = this.el.sceneEl;

    // Golf course in background
    const background = document.createElement('a-plane');
    background.setAttribute('position', '0 5 -30');
    background.setAttribute('width', '100');
    background.setAttribute('height', '20');
    background.setAttribute('color', '#2d5016');
    background.setAttribute('material', 'emissive: #1a3d0a; emissiveIntensity: 0.1;');
    scene.appendChild(background);

    // Mountains
    const mountain1 = document.createElement('a-pyramid');
    mountain1.setAttribute('position', '-20 15 -25');
    mountain1.setAttribute('width', '15');
    mountain1.setAttribute('height', '20');
    mountain1.setAttribute('depth', '15');
    mountain1.setAttribute('color', '#8B7355');
    scene.appendChild(mountain1);

    const mountain2 = document.createElement('a-pyramid');
    mountain2.setAttribute('position', '20 12 -25');
    mountain2.setAttribute('width', '12');
    mountain2.setAttribute('height', '18');
    mountain2.setAttribute('depth', '12');
    mountain2.setAttribute('color', '#A0826D');
    scene.appendChild(mountain2);
  },

  handlePurchase: function(productName) {
    alert(`🛒 Added to cart: ${productName}`);
    
    if (window.eventEmitter) {
      window.eventEmitter.emit('purchase:item', { product: productName, store: 'pga' });
    }

    if (window.api) {
      window.api.post('/api/purchases/item', {
        product: productName,
        store: 'pga-storefront',
        timestamp: new Date().toISOString()
      }).catch(err => console.error('Purchase tracking error:', err));
    }
  }
});
