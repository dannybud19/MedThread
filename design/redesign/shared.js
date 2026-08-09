/**
 * Shared across every screen: injects tokens.js as CSS custom properties (so tokens.js stays the
 * single source of truth — CSS never hardcodes a number), and renders the persistent bottom tab bar.
 * Depends on `tokens` (tokens.js) being loaded first.
 */
(function () {
  var root = document.documentElement.style;
  var t = tokens;
  Object.keys(t.color).forEach(function (k) { root.setProperty("--color-" + k, t.color[k]); });
  Object.keys(t.space).forEach(function (k) { root.setProperty("--space-" + k, t.space[k] + "px"); });
  Object.keys(t.radius).forEach(function (k) { root.setProperty("--radius-" + k, t.radius[k] + "px"); });
  Object.keys(t.type).forEach(function (k) { root.setProperty("--type-" + k, t.type[k] + "px"); });
  Object.keys(t.weight).forEach(function (k) { root.setProperty("--weight-" + k, t.weight[k]); });
  root.setProperty("--touch-min", t.touch.min + "px");
  root.setProperty("--touch-gap", t.touch.minGap + "px");
  root.setProperty("--tabbar-height", t.tabBar.height + "px");
})();

/**
 * The persistent bottom tab bar. Four tabs matching the current app's four home actions directly
 * (per explicit product direction — not a re-grouped IA). Icon + label always visible; active tab
 * marked by fill + accent colour + label weight, never colour alone.
 *
 * NOTE (native-port flag): this whole component becomes a native tab-bar/TabNavigator later — it's
 * self-contained on purpose (no dependency on page content) so swapping the shell is a clean cut.
 */
var TABS = [
  { id: "history", label: "History", href: "history.html", icon: "history" },
  { id: "record", label: "Record", href: "record.html", icon: "mic" },
  { id: "chat", label: "Chat", href: "chat.html", icon: "chat" },
  { id: "files", label: "Update files", href: "files.html", icon: "folder" },
];

var ICONS = {
  history: '<path d="M12 8v5l3 3M4 12a8 8 0 1 1 3 6.3M4 12v5m0-5h5"/>',
  mic: '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M6 11a6 6 0 0 0 12 0M12 19v3"/>',
  chat: '<path d="M4 6h16v10H8l-4 4V6z"/>',
  folder: '<path d="M4 6h6l2 2h8v10H4V6z"/>',
};

function renderTabBar(activeId) {
  var nav = document.createElement("nav");
  nav.className = "tabbar";
  nav.setAttribute("aria-label", "Main");
  TABS.forEach(function (tab) {
    var active = tab.id === activeId;
    var a = document.createElement("a");
    a.href = tab.href;
    a.className = "tabbar__item" + (active ? " tabbar__item--active" : "");
    if (active) a.setAttribute("aria-current", "page");
    a.innerHTML =
      '<span class="tabbar__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (active ? "2.5" : "2") +
      '" stroke-linecap="round" stroke-linejoin="round">' +
      ICONS[tab.icon] +
      "</svg></span>" +
      '<span class="tabbar__label">' + tab.label + "</span>";
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
}

/** Text label back control, per NAVIGATION: "Back to home", never a bare chevron. */
function renderBack(label, href) {
  var a = document.createElement("a");
  a.href = href;
  a.className = "backlink";
  a.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20"><path d="M15 18l-6-6 6-6"/></svg><span>' +
    label +
    "</span>";
  return a;
}
