(function initDnaTitleAmbient() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createBubbleCanvas(stage, options) {
    if (!stage || stage.querySelector(":scope > .dna-title-ambient")) return;

    const canvas = document.createElement("canvas");
    canvas.className = "dna-title-ambient";
    canvas.setAttribute("aria-hidden", "true");
    stage.append(canvas);

    const context = canvas.getContext("2d", { alpha: true });
    const count = reducedMotion ? 12 : options.count;
    const bubbles = Array.from({ length: count }, (_, index) => ({
      x: options.minX + Math.random() * (1 - options.minX),
      y: Math.random() * 1.18,
      radius: 2.5 + Math.random() * 8,
      speed: .000008 + Math.random() * .000018,
      drift: 8 + Math.random() * 24,
      phase: Math.random() * Math.PI * 2,
      warm: index % 4 === 0,
      alpha: .08 + Math.random() * .18
    }));

    let width = 1;
    let height = 1;
    let pointerX = 0;
    let pointerY = 0;
    let lastTime = performance.now();

    function resize() {
      const rect = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawBubble(bubble, time) {
      const x = bubble.x * width + Math.sin(time * .00035 + bubble.phase) * bubble.drift;
      const y = bubble.y * height;
      const color = bubble.warm ? "255,179,71" : "0,206,194";
      const glow = context.createRadialGradient(x, y, 0, x, y, bubble.radius * 3.4);
      glow.addColorStop(0, `rgba(${color},${bubble.alpha * 1.6})`);
      glow.addColorStop(.34, `rgba(${color},${bubble.alpha * .65})`);
      glow.addColorStop(1, `rgba(${color},0)`);
      context.fillStyle = glow;
      context.beginPath();
      context.arc(x, y, bubble.radius * 3.4, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = `rgba(${color},${bubble.alpha * .75})`;
      context.lineWidth = .8;
      context.beginPath();
      context.arc(x, y, bubble.radius, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = `rgba(255,255,255,${bubble.alpha * .55})`;
      context.beginPath();
      context.arc(x - bubble.radius * .28, y - bubble.radius * .3, Math.max(.7, bubble.radius * .14), 0, Math.PI * 2);
      context.fill();
    }

    function draw(time) {
      const delta = Math.min(time - lastTime, 32);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      context.save();
      context.translate(pointerX * 3, pointerY * 2);
      bubbles.forEach((bubble) => {
        if (!reducedMotion) {
          bubble.y -= bubble.speed * delta;
          if (bubble.y < -.08) {
            bubble.y = 1.08;
            bubble.x = options.minX + Math.random() * (1 - options.minX);
          }
        }
        drawBubble(bubble, time);
      });
      context.restore();
      if (!reducedMotion) requestAnimationFrame(draw);
    }

    stage.addEventListener("pointermove", (event) => {
      const rect = stage.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width - .5) * 2;
      pointerY = ((event.clientY - rect.top) / rect.height - .5) * 2;
    });
    stage.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });
    window.addEventListener("resize", resize);
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
    resize();
    requestAnimationFrame(draw);
  }

  createBubbleCanvas(document.querySelector("#dna-preview .dna-preview-media"), { count: 34, minX: .04 });
  createBubbleCanvas(document.querySelector(".dna-showcase-hero"), { count: 34, minX: .38 });
  createBubbleCanvas(document.querySelector(".science-hero"), { count: 34, minX: .02 });
})();
