// world.js - Modular Feature Attachment
const world = {
    dealFlop() {
        const container = document.querySelector('#community-cards');
        container.innerHTML = ''; // Clear previous
        for (let i = 0; i < 3; i++) {
            let card = document.createElement('a-box');
            card.setAttribute('width', '0.5');
            card.setAttribute('height', '0.7');
            card.setAttribute('depth', '0.02');
            card.setAttribute('position', `${(i - 1) * 0.7} 0 0`);
            card.setAttribute('color', 'white');
            card.setAttribute('animation', `property: position; dir: alternate; dur: 2000; loop: true; to: ${(i - 1) * 0.7} 0.1 0`);
            container.appendChild(card);
        }
        console.log("Feature: Community Cards Hovering.");
    },

    spawnBot() {
        const anchor = document.querySelector('#bot-anchor');
        const bot = document.createElement('a-entity');
        bot.innerHTML = `
            <a-sphere radius="0.5" position="4 1.5 0" color="#333"></a-sphere>
            <a-text value="BOT BOB" position="4 2.2 0" align="center" width="4"></a-text>
            <a-box width="0.3" height="0.5" position="3.5 1.2 0.2" rotation="45 0 0" color="white"></a-box>
        `;
        anchor.appendChild(bot);
    },

    toggleStore() {
        alert("Store Module: Loading Avatars (Male/Female/Ninja)...");
        // Future: Integration with GLB avatar loading
    }
};

// Initial state
document.addEventListener('DOMContentLoaded', () => {
    world.dealFlop();
});
