(() => {
  const root = document.documentElement;
  let previous = '';
  const update = () => {
    const header = [...document.querySelectorAll('.topbar')].find(node => node.offsetHeight > 0);
    const footer = document.querySelector('.site-footer');
    const top = header?.offsetHeight || 72, bottom = footer?.offsetHeight || 65;
    const next = `${top}/${bottom}`;
    if (next === previous) return;
    previous = next;
    root.style.setProperty('--shell-top', `${top}px`);
    root.style.setProperty('--shell-bottom', `${bottom}px`);
  };
  const observer = new ResizeObserver(update);
  document.querySelectorAll('.topbar,.site-footer').forEach(node => observer.observe(node));
  update();
})();
