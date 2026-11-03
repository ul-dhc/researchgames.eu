/* The location quiz must not reveal answers through geographic labels. */
(function (root) {
  "use strict";
  function style(theme, mode) {
    if (theme === "light") return mode === "map" ? "light_nolabels" : "light_all";
    return mode === "map" ? "dark_nolabels" : "dark_all";
  }
  const api = { style };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LivonianBasemaps = api;
})(typeof window === "undefined" ? globalThis : window);
