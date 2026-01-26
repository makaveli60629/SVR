import * as THREE from 'three';

export function initDealer({ Bus, scene }) {
  const deckGeo = new THREE.BoxGeometry(0.10, 0.05, 0.15);
  const deckMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.position.set(0.5, 0.95, -2.8);
  deck.name = 'MAIN_DECK';
  scene.add(deck);

  const cards = [];
  scene.userData._cards = cards;

  function dealCard(x, z) {
    const cardGeo = new THREE.PlaneGeometry(0.06, 0.09);
    const cardMat = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const card = new THREE.Mesh(cardGeo, cardMat);
    card.rotation.x = -Math.PI / 2;
    card.position.set(x, 0.96, z);
    card.userData.isCard = true;
    scene.add(card);
    cards.push(card);
    Bus.emit('cardSpawned', card);
    window.playSound?.('shuffle');
    return card;
  }

  // Quick HUD actions
  window.dealFlop = () => {
    Bus.log('DEAL: FLOP');
    dealCard(-0.25, -3.05);
    dealCard( 0.00, -3.05);
    dealCard( 0.25, -3.05);
  };

  scene.userData.dealCard = dealCard;
  Bus.log('DEALER MODULE ONLINE');
}
