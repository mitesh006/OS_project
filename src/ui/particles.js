/**
 * Particle System
 * Subtle ambient particle effects for the menu and battle backgrounds.
 */
'use strict';

const ParticleSystem = (() => {
  let canvas, ctx, particles = [], animFrame;
  let _running = false;

  const PARTICLE_COUNT = 60;

  function init() {
    canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    createParticles();
    if (!_running) { _running = true; loop(); }
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(makeParticle());
    }
  }

  function makeParticle() {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3 - 0.1,
      size: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      color: Math.random() > 0.7 ? '#00f5ff' : Math.random() > 0.5 ? '#a855f7' : '#0066ff'
    };
  }

  function loop() {
    if (!_running || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    animFrame = requestAnimationFrame(loop);
  }

  function stop() {
    _running = false;
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function start() {
    if (!_running) { _running = true; loop(); }
  }

  return { init, stop, start };
})();
