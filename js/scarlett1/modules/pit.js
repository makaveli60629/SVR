AFRAME.registerComponent("scarlett-pit", {
  init: function () {
    const el = this.el;

    // Center table on pedestal
    const table = document.createElement("a-entity");
    table.setAttribute("scarlett-table", "");
    table.setAttribute("position", "0 0 0");
    el.appendChild(table);

    // Jumbotron
    const jumbo = document.createElement("a-entity");
    jumbo.setAttribute("scarlett-jumbotron", "");
    jumbo.setAttribute("position", "0 3.2 -8");
    el.appendChild(jumbo);

    // Bots
    const bots = document.createElement("a-entity");
    bots.setAttribute("scarlett-bots", "");
    el.appendChild(bots);

    // Label
    const txt = document.createElement("a-text");
    txt.setAttribute("value", "POKER PIT");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("position", "-0.6 2.2 2.0");
    txt.setAttribute("width", "6");
    el.appendChild(txt);

    hudLog("Pit built ✅");
  }
});
