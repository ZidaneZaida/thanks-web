/* script.js — interaksi & animasi untuk semua halaman */

/* Utility: safe navigate with fade-out */
function navigateWithFade(url) {
  document.body.classList.add('page-exit');
  // match CSS animation duration (450ms) + small buffer
  setTimeout(() => { window.location.href = url; }, 480);
}

/* INDEX PAGE: envelope click -> zoom & redirect */
function initIndex() {
  const btn = document.getElementById('openLetterBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // add zoom class for animation
    btn.classList.add('envelope-zoom');

    // small sound effect could be added (omitted) -> we wait then navigate
    setTimeout(() => {
      navigateWithFade('story.html');
    }, 900); // matches envelopeZoomOut keyframes
  });
}

/* STORY PAGE: reveal on scroll and button to thanks */
function initStory() {
  // IntersectionObserver to reveal sections on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal-left, .reveal-right').forEach(el => observer.observe(el));

  // Smooth in-page navigation: when user clicks "Lanjut ke Akhir"
  const toThanks = document.getElementById('toThanksBtn');
  if (toThanks) {
    toThanks.addEventListener('click', (e) => {
      e.preventDefault();
      navigateWithFade('thanks.html');
    });
  }

  // Also make internal anchor links fade then navigate
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('mailto:') && a.id !== 'toThanksBtn') {
      // leave normal external/back links alone except adding fade for internal same-site
      if (href.endsWith('.html') || href.startsWith(window.location.origin) || !href.startsWith('http')) {
        a.addEventListener('click', (ev) => {
          // allow external targets open normally
          ev.preventDefault();
          navigateWithFade(href);
        });
      }
    }
  });
}

/* THANKS PAGE: fireworks + typing/fade-in */
function initThanks() {
  // typing-like fade-in for title and message
  const title = document.getElementById('thanksTitle');
  const msg = document.getElementById('closingMsg');

  if (title) {
    title.style.opacity = 0;
    msg.style.opacity = 0;
    setTimeout(() => { title.style.transition = 'opacity 700ms ease, transform 700ms ease'; title.style.opacity = 1; title.style.transform = 'translateY(0)'; }, 250);
    setTimeout(() => { msg.style.transition = 'opacity 800ms ease'; msg.style.opacity = 1; }, 650);
  }

  // Fireworks canvas
  const canvas = document.getElementById('fireworksCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  let particles = [];
  let fireworks = [];

  // handle resize
  window.addEventListener('resize', () => {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
  });

  // simple firework launcher
  function launchFirework() {
    const startX = Math.random() * W;
    const startY = H + 10;
    const targetX = Math.random() * (W * 0.9) + W * 0.05;
    const targetY = Math.random() * (H * 0.5) + H * 0.1;
    fireworks.push(new Firework(startX, startY, targetX, targetY));
  }

  function Firework(sx, sy, tx, ty) {
    this.x = sx; this.y = sy;
    this.tx = tx; this.ty = ty;
    this.speed = 6 + Math.random() * 3;
    this.angle = Math.atan2(ty - sy, tx - sx);
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.traveled = 0;
    this.distanceToTarget = Math.hypot(tx - sx, ty - sy);
    this.brightness = 50 + Math.random() * 50;
    this.color = `hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`;
  }
  Firework.prototype.update = function(i) {
    this.x += this.vx;
    this.y += this.vy;
    this.traveled += Math.hypot(this.vx, this.vy);

    // slight gravity
    this.vy += 0.02;

    if (this.traveled >= this.distanceToTarget) {
      // explode
      createParticles(this.tx, this.ty, this.color);
      fireworks.splice(i,1);
    }
  }
  Firework.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, 2.2, 0, Math.PI*2);
    ctx.fill();
  }

  function createParticles(x, y, color) {
    const count = 20 + Math.floor(Math.random()*30);
    for (let i=0;i<count;i++){
      particles.push(new Particle(x,y,color));
    }
  }
  function Particle(x,y,color) {
    this.x = x; this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 5;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.decay = 0.012 + Math.random() * 0.018;
    this.color = color;
    this.size = 1 + Math.random()*2.5;
  }
  Particle.prototype.update = function(i) {
    this.vy += 0.02; // gravity
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
    if (this.alpha <= 0) {
      particles.splice(i,1);
    }
  }
  Particle.prototype.draw = function(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.alpha, 0);
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // main loop
  let lastLaunch = 0;
  function loop(t) {
    // clear with slight opacity to create trails
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(6,9,20,0.25)';
    ctx.fillRect(0,0,W,H);
    ctx.globalCompositeOperation = 'lighter';

    // update/draw fireworks
    for (let i = fireworks.length-1; i>=0; i--) {
      fireworks[i].draw(ctx);
      fireworks[i].update(i);
    }
    // particles
    for (let i = particles.length-1; i>=0; i--) {
      particles[i].draw(ctx);
      particles[i].update(i);
    }

    // auto-launch fireworks occasionally but not overwhelming
    if (t - lastLaunch > 600 + Math.random()*900) {
      launchFirework();
      lastLaunch = t;
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // initial gentle burst
  for (let i=0;i<3;i++){ setTimeout(()=>launchFirework(), i*300); }

  // reduce CPU if tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // pause heavy activities: clear arrays
      fireworks = [];
      particles = [];
    }
  });
}

/* Page init */
document.addEventListener('DOMContentLoaded', () => {
  // determine which page by body id
  const id = document.body.id || '';
  if (id === 'page-index') initIndex();
  if (id === 'page-story') initStory();
  if (id === 'page-thanks') initThanks();

  // add fade-out navigation for all internal anchors (already handled partly in initStory)
  document.querySelectorAll('a[href]').forEach(a=>{
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
    // skip anchors pointing to same page fragment
    if (href.startsWith('#')) return;
    a.addEventListener('click', (e)=>{
      // allow default behavior if a target has target="_blank"
      if (a.target === '_blank') return;
      // navigation handled by per-page click logic to ensure consistent fade
    });
  });

  // Accessibility: if user prefers reduced motion, disable complex animations
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.envelope-zoom').forEach(el => el.style.animation = 'none');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const music = document.getElementById('bgMusic');
  const musicBtn = document.getElementById('musicBtn');
  let isPlaying = false;

  if (music && musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (!isPlaying) {
        music.play().then(() => {
          isPlaying = true;
          musicBtn.textContent = 'Matikan Musik';
        }).catch(err => {
          console.log('Gagal memutar musik:', err);
        });
      } else {
        music.pause();
        isPlaying = false;
        musicBtn.textContent = '🎵 Hidupkan Musik';
      }
    });
  }
});
