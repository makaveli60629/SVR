AFRAME.registerComponent('poker-table', {

    init: function () {
        this.deck = []
        const suits = ['H', 'D', 'S', 'C']
        suits.forEach(s => {
            for (let i = 1; i <= 13; i++) {
                this.deck.push({ suit: s, value: i })
            }
        })
        console.log('Deck ready', this.deck.length)
    }

})
