AFRAME.registerComponent('teleport-system', {

    init: function () {
        let teleport = false
        window.addEventListener('keydown', e => {
            if (e.key === 'f') {
                teleport = !teleport
                console.log('Teleport', teleport)
            }
        })
    }

})
