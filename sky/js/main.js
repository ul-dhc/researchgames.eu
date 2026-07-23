const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#site-nav');
const themeToggle = document.querySelector('#theme-toggle');

document.querySelectorAll('[data-game-url]').forEach(link => {
  const configuredUrl = window.RESEARCH_GAMES_CONFIG?.[link.dataset.gameUrl];
  if (configuredUrl) link.href = configuredUrl;
});

const dnaPreviewVideo = document.querySelector('.dna-preview-video');

if (dnaPreviewVideo) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrowCard = window.matchMedia('(max-width: 760px)');
  const desktopPoster = dnaPreviewVideo.getAttribute('poster');
  const mobilePoster = dnaPreviewVideo.dataset.mobilePoster;
  let previewVisible = false;

  const updatePreviewPoster = () => {
    dnaPreviewVideo.poster = narrowCard.matches && mobilePoster ? mobilePoster : desktopPoster;
  };

  const updatePreviewPlayback = () => {
    dnaPreviewVideo.muted = true;
    if (reducedMotion.matches || !previewVisible || document.hidden) {
      dnaPreviewVideo.pause();
      return;
    }
    dnaPreviewVideo.play().catch(() => {});
  };

  updatePreviewPoster();
  if (reducedMotion.matches) dnaPreviewVideo.pause();

  const previewObserver = new IntersectionObserver(entries => {
    previewVisible = entries[0]?.isIntersecting ?? false;
    updatePreviewPlayback();
  }, { rootMargin: '260px 0px', threshold: 0 });

  previewObserver.observe(dnaPreviewVideo);
  reducedMotion.addEventListener('change', updatePreviewPlayback);
  narrowCard.addEventListener('change', updatePreviewPoster);
  document.addEventListener('visibilitychange', updatePreviewPlayback);
  dnaPreviewVideo.addEventListener('volumechange', () => {
    if (!dnaPreviewVideo.muted || dnaPreviewVideo.volume !== 0) {
      dnaPreviewVideo.muted = true;
      dnaPreviewVideo.volume = 0;
    }
  });
}

function setTheme(theme, remember = true) {
  document.documentElement.dataset.theme = theme;
  const isLight = theme === 'light';
  themeToggle.setAttribute('aria-pressed', String(isLight));
  themeToggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
  themeToggle.title = `Switch to ${isLight ? 'dark' : 'light'} theme`;
  if (remember) { try { localStorage.setItem('researchgames-theme', theme); } catch (error) {} }
}

setTheme(document.documentElement.dataset.theme || 'dark', false);
themeToggle.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));

window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 24), { passive: true });
toggle.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!open)); nav.classList.toggle('open', !open); });
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }));
document.querySelector('#year').textContent = new Date().getFullYear();

document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

const researchCube = document.querySelector('#research-cube');
const researchCubeScene = document.querySelector('#research-cube-scene');

if (researchCube && researchCubeScene) {
  let cubeX = -10;
  let cubeY = 24;
  let cubeZ = 0;
  let cubePointer = null;
  let cubeLastX = 0;
  let cubeLastY = 0;
  let cubeDragging = false;
  let cubeLastFrame = performance.now();
  const cubeMotionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cubeContext = researchCube.getContext('2d');
  const cubeVertices = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
    [0,0,0]
  ];
  const cubeEdges = [
    [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
    [8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7]
  ];

  const rotateVertex = vertex => {
    const angleX = cubeX * Math.PI / 180;
    const angleY = cubeY * Math.PI / 180;
    const angleZ = cubeZ * Math.PI / 180;
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosZ = Math.cos(angleZ), sinZ = Math.sin(angleZ);
    const x1 = vertex[0] * cosY + vertex[2] * sinY;
    const z1 = -vertex[0] * sinY + vertex[2] * cosY;
    const y2 = vertex[1] * cosX - z1 * sinX;
    const z2 = vertex[1] * sinX + z1 * cosX;
    return [x1 * cosZ - y2 * sinZ, x1 * sinZ + y2 * cosZ, z2];
  };

  const renderCube = () => {
    const width = researchCube.width;
    const height = researchCube.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const camera = 5.4;
    // Leave generous projection room so near vertices and their glow remain
    // inside the canvas even at the cube's widest three-axis orientation.
    const size = width * .18;
    cubeContext.clearRect(0, 0, width, height);

    const projected = cubeVertices.map((vertex, index) => {
      const rotated = rotateVertex(vertex);
      const perspective = camera / (camera - rotated[2]);
      return {
        index,
        x:centerX + rotated[0] * size * perspective,
        y:centerY + rotated[1] * size * perspective,
        z:rotated[2],
        perspective
      };
    });

    const sortedEdges = cubeEdges.map(edge => ({edge,z:(projected[edge[0]].z + projected[edge[1]].z) / 2})).sort((a,b) => a.z - b.z);
    sortedEdges.forEach(({edge,z}) => {
      const from = projected[edge[0]];
      const to = projected[edge[1]];
      const gradient = cubeContext.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, z > 0 ? '#8e4cff' : '#5d48db');
      gradient.addColorStop(1, z > 0 ? '#3d9bff' : '#355fd1');
      cubeContext.beginPath();
      cubeContext.moveTo(from.x, from.y);
      cubeContext.lineTo(to.x, to.y);
      cubeContext.lineCap = 'round';
      cubeContext.lineWidth = (z > 0 ? 18 : 12) * ((from.perspective + to.perspective) / 2);
      cubeContext.globalAlpha = z > 0 ? .96 : .5;
      cubeContext.strokeStyle = gradient;
      cubeContext.shadowColor = z > 0 ? '#7357ff88' : 'transparent';
      cubeContext.shadowBlur = z > 0 ? 11 : 0;
      cubeContext.stroke();
    });

    projected.sort((a,b) => a.z - b.z).forEach(point => {
      const radius = (point.index === 8 ? 29 : 25) * point.perspective;
      const violet = point.index % 3 !== 1;
      const gradient = cubeContext.createRadialGradient(point.x-radius*.3,point.y-radius*.35,radius*.08,point.x,point.y,radius);
      gradient.addColorStop(0, violet ? '#e4a4ff' : '#b9e2ff');
      gradient.addColorStop(.38, violet ? '#9453ff' : '#4fa1ff');
      gradient.addColorStop(1, violet ? '#4e25b9' : '#205ac4');
      cubeContext.beginPath();
      cubeContext.arc(point.x, point.y, radius, 0, Math.PI * 2);
      cubeContext.globalAlpha = .72 + Math.max(-.18, point.z * .12);
      cubeContext.fillStyle = gradient;
      cubeContext.shadowColor = violet ? '#934dff99' : '#398cff99';
      cubeContext.shadowBlur = point.z > 0 ? 22 : 9;
      cubeContext.fill();
      cubeContext.lineWidth = 2.5;
      cubeContext.strokeStyle = '#ffffff55';
      cubeContext.stroke();
    });
    cubeContext.globalAlpha = 1;
    cubeContext.shadowBlur = 0;
  };

  const animateCube = time => {
    const elapsed = Math.min(40, time - cubeLastFrame);
    cubeLastFrame = time;
    if (!cubeDragging && cubeMotionAllowed && document.visibilityState === 'visible') {
      cubeX += elapsed * (.0034 + Math.sin(time * .00027) * .0011);
      cubeY += elapsed * (.0062 + Math.cos(time * .00031) * .0014);
      cubeZ += elapsed * (.0023 + Math.sin(time * .00019) * .0008);
      renderCube();
    }
    requestAnimationFrame(animateCube);
  };

  researchCube.addEventListener('pointerdown', event => {
    researchCube.classList.remove('keyboard-focus');
    cubeDragging = true;
    cubePointer = event.pointerId;
    cubeLastX = event.clientX;
    cubeLastY = event.clientY;
    researchCube.setPointerCapture(event.pointerId);
    researchCubeScene.classList.add('is-dragging');
  });

  researchCube.addEventListener('pointermove', event => {
    if (!cubeDragging || event.pointerId !== cubePointer) return;
    const deltaX = event.clientX - cubeLastX;
    const deltaY = event.clientY - cubeLastY;
    cubeY += deltaX * .55;
    cubeX = Math.max(-75, Math.min(75, cubeX - deltaY * .45));
    cubeLastX = event.clientX;
    cubeLastY = event.clientY;
    renderCube();
  });

  const releaseCube = event => {
    if (!cubeDragging) return;
    if (event?.pointerId != null && cubePointer != null && event.pointerId !== cubePointer) return;
    cubeDragging = false;
    researchCubeScene.classList.remove('is-dragging');
    if (cubePointer != null && researchCube.hasPointerCapture(cubePointer)) researchCube.releasePointerCapture(cubePointer);
    cubePointer = null;
  };
  researchCube.addEventListener('pointerup', releaseCube);
  researchCube.addEventListener('pointercancel', releaseCube);
  researchCube.addEventListener('lostpointercapture', () => releaseCube());
  window.addEventListener('pointerup', releaseCube);
  window.addEventListener('pointercancel', releaseCube);
  window.addEventListener('blur', () => releaseCube());

  researchCube.addEventListener('keydown', event => {
    researchCube.classList.add('keyboard-focus');
    const amount = event.shiftKey ? 15 : 6;
    if (event.key === 'ArrowLeft') cubeY -= amount;
    else if (event.key === 'ArrowRight') cubeY += amount;
    else if (event.key === 'ArrowUp') cubeX = Math.max(-75, cubeX - amount);
    else if (event.key === 'ArrowDown') cubeX = Math.min(75, cubeX + amount);
    else return;
    event.preventDefault();
    renderCube();
  });
  researchCube.addEventListener('blur', () => researchCube.classList.remove('keyboard-focus'));

  renderCube();
  requestAnimationFrame(animateCube);
}
