(function () {
  "use strict";

  window.SVR_PWA = {
    manifestInstalled: true,
    protocol: window.location.protocol,
    secureContext: !!window.isSecureContext,
    serviceWorkerAvailable: "serviceWorker" in navigator
  };

  function log(message) {
    try {
      console.info("[SVR PWA]", message);
    } catch (_) {}
  }

  function warn(message, error) {
    try {
      console.warn("[SVR PWA]", message, error || "");
    } catch (_) {}
  }

  // Important:
  // This file intentionally does NOT clear caches automatically.
  // Some browser policies block CacheStorage and ServiceWorker APIs.
  // The previous boot watchdog called those APIs and caused the red error box.

  var params = new URLSearchParams(window.location.search);

  if (params.has("svrWatch")) {
    var errors = [];

    window.addEventListener("error", function (e) {
      errors.push("JS error: " + (e.message || "unknown"));
    });

    window.addEventListener("unhandledrejection", function (e) {
      var reason = e.reason;
      if (reason && reason.message) reason = reason.message;
      errors.push("Promise rejection: " + reason);
    });

    setTimeout(function () {
      var bodyText = "";
      try {
        bodyText = document.body ? document.body.innerText : "";
      } catch (_) {}

      var looksStuck = /booting|loading|initializing/i.test(bodyText);

      if (!looksStuck && errors.length === 0) return;
      if (document.getElementById("svr-watch-panel")) return;

      var panel = document.createElement("div");
      panel.id = "svr-watch-panel";
      panel.style.position = "fixed";
      panel.style.left = "16px";
      panel.style.right = "16px";
      panel.style.bottom = "16px";
      panel.style.zIndex = "999999";
      panel.style.background = "rgba(8,0,20,0.96)";
      panel.style.color = "#fff";
      panel.style.border = "2px solid #27f5ff";
      panel.style.borderRadius = "12px";
      panel.style.padding = "14px";
      panel.style.fontFamily = "Arial, sans-serif";
      panel.innerHTML =
        "<strong>SVR Watch Mode</strong><br>" +
        "Page still appears to be loading.<br><pre style='white-space:pre-wrap'>" +
        (errors.length ? errors.join("\n") : "No JavaScript error captured.") +
        "</pre>";
      document.body.appendChild(panel);
    }, 9000);
  }

  // Service worker is now opt-in only.
  // Use ?svrSW=1 if you want to test it.
  if (!params.has("svrSW")) {
    log("Service worker skipped. Manifest is active. Add ?svrSW=1 to test service worker.");
    return;
  }

  if (!("serviceWorker" in navigator)) {
    warn("Service worker not supported.");
    return;
  }

  if (!window.isSecureContext || window.location.protocol === "file:") {
    warn("Service worker skipped because this is not a secure browser context.");
    return;
  }

  navigator.serviceWorker.register("./svr-service-worker.js", { scope: "./" })
    .then(function () {
      log("Service worker registered.");
    })
    .catch(function (error) {
      warn("Service worker registration failed safely.", error);
    });
})();
