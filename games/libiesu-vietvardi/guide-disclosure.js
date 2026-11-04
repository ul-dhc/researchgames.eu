(() => {
  const guide = document.querySelector('.long-game-guide');
  if (!guide) return;
  const phone = matchMedia('(max-width:600px)');
  const adapt = () => { guide.open = !phone.matches; };
  phone.addEventListener('change', adapt);
  adapt();
})();
