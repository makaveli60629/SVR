// world.js - Modular World Logic
document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('#poker-zone');
    
    // Add floating animation to community cards
    const flopCards = document.querySelectorAll('#community-flop a-box');
    flopCards.forEach((card, index) => {
        card.setAttribute('animation', {
            property: 'position',
            dir: 'alternate',
            dur: 1500 + (index * 200),
            loop: true,
            to: `${(index - 1) * 0.8} 0.1 0`
        });
        // Make cards face the player
        card.setAttribute('rotation', '0 0 0');
    });

    console.log("World Sealed. Neon Trims Active.");
});

// Function to handle the Store opening (Lobby Logic)
function openStore() {
    // Logic to bring up store mesh
    console.log("Opening Store Lobby...");
}
