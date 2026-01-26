/** * SCARLETT1 MODULE - FULL THROTTLE GAME RESTORE
 * Rebuilds the Lobby, Bots, Table, and Jumbotron Logic
 */

window.scarlettModule = {
    init: function() {
        console.log("SCARLETT1: Initiating Full Throttle Restore...");
        this.buildLobby();
        this.spawnBots();
        this.initJumbos();
    },

    buildLobby: function() {
        const container = document.querySelector('#poker-module');
        if (!container) return;

        // 1. POKER TABLE
        const table = document.createElement('a-cylinder');
        table.setAttribute('radius', '4');
        table.setAttribute('height', '1.2');
        table.setAttribute('position', '0 0.6 -12');
        table.setAttribute('color', '#076324'); // Casino Green
        table.setAttribute('material', 'roughness: 0.8; metalness: 0.2');
        container.appendChild(table);

        // 2. FLOOR LIGHTING ACCENTS
        const lightRing = document.createElement('a-ring');
        lightRing.setAttribute('radius-inner', '4.1');
        lightRing.setAttribute('radius-outer', '4.3');
        lightRing.setAttribute('position', '0 0.05 -12');
        lightRing.setAttribute('rotation', '-90 0 0');
        lightRing.setAttribute('color', '#A020F0');
        lightRing.setAttribute('material', 'emissive: #A020F0; emissiveIntensity: 5');
        container.appendChild(lightRing);
    },

    spawnBots: function() {
        const container = document.querySelector('#poker-module');
        const seats = [
            { pos: '3.5 0.5 -12.5', rot: '160' },
            { pos: '0 0.5 -11.0', rot: '180' },
            { pos: '-3.5 0.5 -12.5', rot: '200' }
        ];

        seats.forEach((seat, index) => {
            const bot = document.createElement('a-entity');
            bot.setAttribute('gltf-model', '#ninjaModel');
            bot.setAttribute('position', seat.pos);
            bot.setAttribute('rotation', `0 ${seat.rot} 0`);
            bot.setAttribute('scale', '1.5 1.5 1.5');
            bot.setAttribute('animation-mixer', 'clip: idle');
            container.appendChild(bot);
        });
    },

    initJumbos: function() {
        const canvases = ['NE', 'NW', 'SE', 'SW'];
        canvases.forEach(id => {
            const canvas = document.getElementById(`jumboCanvas_${id}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = "#000";
                ctx.fillRect(0,0,1024,512);
                ctx.fillStyle = "#00FFFF";
                ctx.font = "bold 60px Arial";
                ctx.fillText(`SCARLETT_ARENA_${id}`, 50, 100);
            }
        });
    },

    dealFlop: function() {
        SDK.celebrateWin('0 5 -12'); // Trigger Spine Win Particles
        console.log("SCARLETT1: Flop Dealt.");
    },

    spawnStore: function() {
        console.log("SCARLETT1: Store Inventory Loading...");
    }
};

// Automatic initialization if the Spine is already waiting
if (window.__scarlettInitDone === false) {
    window.scarlettModule.init();
}
