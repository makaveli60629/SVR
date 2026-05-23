# SVR Game ↔ Site Bridge — Phase 09

The site exposes:

```js
window.SVR_SITE_BRIDGE.getProfile()
window.SVR_SITE_BRIDGE.getRooms()
window.SVR_SITE_BRIDGE.getAds()
window.SVR_SITE_BRIDGE.openRoute("profile.html")
```

The game can also post messages to the site iframe:

```js
iframe.contentWindow.postMessage({ type: "SVR_GET_PROFILE" }, "*");
iframe.contentWindow.postMessage({ type: "SVR_GET_ROOMS" }, "*");
```

The site responds with:
- `SVR_PROFILE`
- `SVR_ROOMS`
