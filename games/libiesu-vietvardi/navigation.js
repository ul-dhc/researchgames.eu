(() => {
  "use strict";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.hidden = true;
  button.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 12 6-6 6 6M12 6v14"/></svg>';
  const label = () => {
    const text = document.documentElement.lang === "en" ? "Back to top" : "Uz lapas augšu";
    button.setAttribute("aria-label", text);
    button.title = text;
  };
  const update = () => { button.hidden = window.scrollY <= 160; };
  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, left: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  });
  document.body.appendChild(button);
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  label();
  update();
})();
