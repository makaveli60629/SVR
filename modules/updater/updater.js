async function checkUpdate() {
    const res = await fetch('/update/version.json')
    const data = await res.json()
    const current = localStorage.getItem('svr_version')
    if (current !== data.version) {
        localStorage.setItem('svr_version', data.version)
        location.reload()
    }
}

checkUpdate()
