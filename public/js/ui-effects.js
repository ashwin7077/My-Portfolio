(function initUiEffects() {
  const CARD_SELECTOR = '.project-card, .cert-card, .blog-card, .cert-category-tile, .contact-tile, .panel';
  const MAGNETIC_SELECTOR = '.btn, .nav-link, .detail-close';
  const INTERACTIVE_SELECTOR = 'a,button,input,textarea,select,[role="button"],[contenteditable="true"]';
  const root = document.documentElement;
  const hasFinePointer = window.matchMedia('(pointer:fine)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LIGHT_IDLE_TIMEOUT = 260;
  const LIGHT_SMOOTHING = 0.11;

  let activeMagnetic = null;
  let lightIdleTimer = 0;
  let lightFrame = 0;
  let cursorFrame = 0;

  let globalLights = [];
  let cursorDot = null;
  let cursorRing = null;

  const lightTarget = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.24 };
  const lightCurrent = { x: lightTarget.x, y: lightTarget.y };
  const cursorTarget = { x: lightTarget.x, y: lightTarget.y };
  const cursorRingPos = { x: lightTarget.x, y: lightTarget.y };
  const cursorDotPos = { x: lightTarget.x, y: lightTarget.y };

  const decorateCards = (container) => {
    const host = container instanceof Element || container instanceof Document ? container : document;
    const cards = host.querySelectorAll(CARD_SELECTOR);
    cards.forEach((card, index) => {
      card.classList.add('card-spotlight', 'card-animated');
      if (!card.style.getPropertyValue('--card-delay')) {
        card.style.setProperty('--card-delay', `${Math.min(index, 16) * 40}ms`);
      }
    });
  };

  const updateSpotlight = (card, event) => {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', `${x.toFixed(2)}%`);
    card.style.setProperty('--my', `${y.toFixed(2)}%`);
  };

  const resetMagnetic = (node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.setProperty('--mag-x', '0px');
    node.style.setProperty('--mag-y', '0px');
  };

  const updateMagnetic = (node, event) => {
    if (!(node instanceof HTMLElement)) return;
    const rect = node.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const maxShift = Math.min(10, Math.max(5, rect.width * 0.08));
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    node.style.setProperty('--mag-x', `${(nx * maxShift).toFixed(2)}px`);
    node.style.setProperty('--mag-y', `${(ny * maxShift).toFixed(2)}px`);
  };

  const scheduleLightFade = () => {
    if (lightIdleTimer) window.clearTimeout(lightIdleTimer);
    document.body.classList.add('cursor-light-active');
    lightIdleTimer = window.setTimeout(() => {
      document.body.classList.remove('cursor-light-active');
    }, LIGHT_IDLE_TIMEOUT);
  };

  const renderLightAndParallax = () => {
    lightCurrent.x += (lightTarget.x - lightCurrent.x) * LIGHT_SMOOTHING;
    lightCurrent.y += (lightTarget.y - lightCurrent.y) * LIGHT_SMOOTHING;

    if (globalLights.length) {
      const transformValue = `translate3d(${lightCurrent.x.toFixed(2)}px, ${lightCurrent.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      globalLights.forEach((node) => {
        node.style.transform = transformValue;
      });
    }

    const px = Math.max(0, Math.min(1, lightCurrent.x / window.innerWidth));
    const py = Math.max(0, Math.min(1, lightCurrent.y / window.innerHeight));
    root.style.setProperty('--parallax-x', `${(px - 0.5).toFixed(4)}`);
    root.style.setProperty('--parallax-y', `${(py - 0.5).toFixed(4)}`);

    const dx = Math.abs(lightTarget.x - lightCurrent.x);
    const dy = Math.abs(lightTarget.y - lightCurrent.y);
    const moving = document.body.classList.contains('cursor-light-active');
    if (dx > 0.1 || dy > 0.1 || moving) {
      lightFrame = window.requestAnimationFrame(renderLightAndParallax);
    } else {
      lightFrame = 0;
    }
  };

  const queueLightUpdate = (event) => {
    if (prefersReducedMotion || event.pointerType === 'touch' || !hasFinePointer) return;
    lightTarget.x = event.clientX;
    lightTarget.y = event.clientY;
    scheduleLightFade();
    if (!lightFrame) lightFrame = window.requestAnimationFrame(renderLightAndParallax);
  };

  /* ─────────────────────────────────────────────────
     CROSSHAIR CURSOR
     - Renders a hollow crosshair that follows the mouse
     - On hovering interactive elements: morphs to a solid square
     - On click: rotates 45°
     ───────────────────────────────────────────────── */
  const renderCursor = () => {
    if (!cursorDot || !cursorRing) return;
    cursorDotPos.x += (cursorTarget.x - cursorDotPos.x) * 0.55;
    cursorDotPos.y += (cursorTarget.y - cursorDotPos.y) * 0.55;
    cursorRingPos.x += (cursorTarget.x - cursorRingPos.x) * 0.18;
    cursorRingPos.y += (cursorTarget.y - cursorRingPos.y) * 0.18;
    cursorDot.style.left = `${cursorDotPos.x.toFixed(2)}px`;
    cursorDot.style.top = `${cursorDotPos.y.toFixed(2)}px`;
    cursorRing.style.left = `${cursorRingPos.x.toFixed(2)}px`;
    cursorRing.style.top = `${cursorRingPos.y.toFixed(2)}px`;
    cursorFrame = window.requestAnimationFrame(renderCursor);
  };

  const setupEffectLayers = () => {
    if (!hasFinePointer || prefersReducedMotion) return;

    const low = document.createElement('div');
    low.className = 'fx-global-light fx-global-light-low';
    const high = document.createElement('div');
    high.className = 'fx-global-light fx-global-light-high';
    document.body.append(low, high);
    globalLights = [low, high];

    // Crosshair cursor: dot is the center point, ring is the crosshair frame
    document.body.classList.add('custom-cursor-enabled');
    cursorDot = document.createElement('div');
    cursorDot.className = 'fx-cursor-dot';
    cursorRing = document.createElement('div');
    cursorRing.className = 'fx-cursor-ring';

    // Build crosshair lines inside the ring
    for (let i = 0; i < 4; i++) {
      const line = document.createElement('span');
      line.className = 'fx-crosshair-line';
      cursorRing.appendChild(line);
    }

    document.body.append(cursorRing, cursorDot);

    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(renderCursor);
  };

  /* ─────────────────────────────────────────────────
     PARTICLE NETWORK BACKGROUND
     Interactive nodes + connecting lines that react
     to mouse movement. Represents connections/networks.
     ───────────────────────────────────────────────── */
  const setupParticleNetwork = () => {
    if (prefersReducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'particle-network';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    const mouse = { x: -1000, y: -1000 };
    const PARTICLE_COUNT = Math.min(70, Math.floor(window.innerWidth / 18));
    const CONNECTION_DIST = 160;
    const MOUSE_DIST = 200;
    const particles = [];

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * (w || window.innerWidth);
        this.y = Math.random() * (h || window.innerHeight);
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.5;
      }
      update() {
        // Mouse repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST && dist > 0) {
          const force = (MOUSE_DIST - dist) / MOUSE_DIST * 0.03;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.x += this.vx;
        this.y += this.vy;
        // Wrap around
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
      }
    }

    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.18;
            ctx.strokeStyle = `rgba(0, 255, 180, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw mouse connections
      for (let i = 0; i < particles.length; i++) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          const alpha = (1 - dist / MOUSE_DIST) * 0.3;
          ctx.strokeStyle = `rgba(0, 255, 200, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // Draw particles
      for (const p of particles) {
        p.update();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 180, 0.5)';
        ctx.fill();
      }

      requestAnimationFrame(draw);
    };

    // Track mouse for particle interaction (pointer-events: none on canvas, so use document)
    document.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });
    draw();
  };

  /* ── Scroll progress bar ── */
  const injectScrollProgress = () => {
    if (prefersReducedMotion) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  /* ── Stagger index assignment ── */
  const assignStaggerIndices = (container) => {
    const host = container instanceof Element || container instanceof Document ? container : document;

    host.querySelectorAll('.chip-list').forEach(list => {
      list.querySelectorAll('span').forEach((span, i) => {
        if (!span.style.getPropertyValue('--i')) {
          span.style.setProperty('--i', String(i));
        }
      });
    });

    host.querySelectorAll('.credibility-row').forEach(row => {
      row.querySelectorAll('.metric').forEach((m, i) => {
        if (!m.style.getPropertyValue('--i')) {
          m.style.setProperty('--i', String(i));
        }
      });
    });

    host.querySelectorAll('.contact-grid').forEach(grid => {
      grid.querySelectorAll('.contact-tile').forEach((tile, i) => {
        tile.style.setProperty('--i', String(i));
      });
    });
  };

  /* ─────────────────────────────────────────────────
     STAGGERED SLIDE-IN SCROLL REVEAL
     Instead of just fading, cards slide in from
     alternating directions with staggered delays.
     ───────────────────────────────────────────────── */
  const setupScrollReveal = () => {
    const sections = document.querySelectorAll('.reveal:not(.in-view)');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('in-view');

        // Stagger child cards with alternating slide direction
        const childCards = el.querySelectorAll('.project-card, .cert-card, .blog-card, .cert-category-tile, .cert-card-featured, .panel, .contact-tile, .metric, .book-card');
        childCards.forEach((card, idx) => {
          const delay = idx * 80;
          const direction = idx % 2 === 0 ? 'slide-left' : 'slide-right';
          card.style.setProperty('--slide-delay', `${delay}ms`);
          card.classList.add('stagger-slide', direction);
        });

        observer.unobserve(el);
      });
    }, {
      threshold: 0.06,
      rootMargin: '0px 0px -40px 0px'
    });

    sections.forEach(s => observer.observe(s));
  };

  /* ─────────────────────────────────────────────────
     TERMINAL TYPEWRITER
     Makes the hero line look like a command being
     executed in a terminal: "> " prefix, green tint,
     monospace font, character by character.
     ───────────────────────────────────────────────── */
  const setupTypewriter = () => {
    if (prefersReducedMotion) return;
    const heroLine = document.getElementById('heroLine');
    if (!heroLine) return;

    const tryType = () => {
      const fullText = heroLine.textContent.trim();
      if (!fullText || fullText === '') {
        setTimeout(tryType, 200);
        return;
      }

      // Style as terminal output
      heroLine.classList.add('terminal-text');
      heroLine.textContent = '';

      // Create the prompt prefix
      const prompt = document.createElement('span');
      prompt.className = 'terminal-prompt';
      prompt.textContent = '> ';
      heroLine.appendChild(prompt);

      // Create the text container
      const textSpan = document.createElement('span');
      textSpan.className = 'terminal-output';
      heroLine.appendChild(textSpan);

      // Create the cursor
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      cursor.textContent = '█';
      heroLine.appendChild(cursor);

      let charIndex = 0;

      const typeChar = () => {
        if (charIndex < fullText.length) {
          textSpan.textContent += fullText[charIndex];
          charIndex++;
          // Variable speed: faster for spaces, slightly random otherwise
          const delay = fullText[charIndex - 1] === ' ' ? 15 : 22 + Math.random() * 30;
          setTimeout(typeChar, delay);
        } else {
          // Blink cursor a few times then go steady
          setTimeout(() => {
            cursor.classList.add('terminal-cursor-blink');
          }, 300);
        }
      };

      typeChar();
    };

    setTimeout(tryType, 800);
  };

  /* ── Animated number counter ── */
  const setupCounters = () => {
    if (prefersReducedMotion) return;

    const countUp = (el, target) => {
      const duration = 1200;
      const startTime = performance.now();

      const animate = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);
        el.textContent = current;
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          el.textContent = target;
        }
      };

      requestAnimationFrame(animate);
    };

    const observer = new MutationObserver(() => {
      const metrics = document.querySelectorAll('.metric strong:not([data-counted])');
      metrics.forEach(el => {
        const value = parseInt(el.textContent, 10);
        if (isNaN(value) || value <= 0) return;
        el.setAttribute('data-counted', 'true');
        el.setAttribute('data-count-target', String(value));
        el.textContent = '0';
        const io = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            countUp(el, value);
            io.unobserve(el);
          });
        }, { threshold: 0.5 });
        io.observe(el);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  /* ── Button click ripple ── */
  const setupButtonRipple = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target instanceof Element ? e.target.closest('.btn') : null;
      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  };

  /* ── Section header slide-in on scroll ── */
  const setupHeaderSlideIn = () => {
    if (prefersReducedMotion) return;

    const headers = document.querySelectorAll('.section-header h2, .section-header p');
    if (!headers.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.style.animation = 'slideInHeader 0.6s cubic-bezier(.2,.75,.2,1) both';
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    headers.forEach(h => {
      h.style.opacity = '0';
      observer.observe(h);
    });

    if (!document.getElementById('fx-slideInHeader')) {
      const style = document.createElement('style');
      style.id = 'fx-slideInHeader';
      style.textContent = `
        @keyframes slideInHeader {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
    }
  };

  const setupPointerDelegation = () => {
    document.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      queueLightUpdate(event);
      cursorTarget.x = event.clientX;
      cursorTarget.y = event.clientY;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const interactive = target.closest(INTERACTIVE_SELECTOR);
      document.body.classList.toggle('cursor-hovering', Boolean(interactive));

      const card = target.closest(CARD_SELECTOR);
      if (card) updateSpotlight(card, event);

      if (hasFinePointer && !prefersReducedMotion) {
        const magnetic = target.closest(MAGNETIC_SELECTOR);
        if (magnetic !== activeMagnetic) {
          resetMagnetic(activeMagnetic);
          activeMagnetic = magnetic instanceof HTMLElement ? magnetic : null;
        }
        if (activeMagnetic) updateMagnetic(activeMagnetic, event);
      }
    }, { passive: true });

    document.addEventListener('pointerenter', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest(CARD_SELECTOR);
      if (card) card.classList.add('is-pointer');
    }, true);

    document.addEventListener('pointerleave', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest(CARD_SELECTOR);
      if (card) card.classList.remove('is-pointer');
      if (target.matches?.(MAGNETIC_SELECTOR) || target.closest?.(MAGNETIC_SELECTOR)) {
        resetMagnetic(target.closest?.(MAGNETIC_SELECTOR) || target);
      }
    }, true);

    document.addEventListener('pointerdown', () => {
      document.body.classList.add('cursor-pressed');
    }, { passive: true });

    document.addEventListener('pointerup', () => {
      document.body.classList.remove('cursor-pressed');
    }, { passive: true });

    window.addEventListener('blur', () => {
      resetMagnetic(activeMagnetic);
      activeMagnetic = null;
      if (lightIdleTimer) window.clearTimeout(lightIdleTimer);
      document.body.classList.remove('cursor-light-active', 'cursor-hovering', 'cursor-pressed');
    });
  };

  const setupMutationObserver = () => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(CARD_SELECTOR)) {
            decorateCards(node.parentElement || document);
          } else if (node.querySelector(CARD_SELECTOR)) {
            decorateCards(node);
          }
          assignStaggerIndices(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const start = () => {
    root.style.setProperty('--parallax-x', '0');
    root.style.setProperty('--parallax-y', '0');
    decorateCards(document);
    assignStaggerIndices(document);
    setupEffectLayers();
    setupParticleNetwork();
    injectScrollProgress();
    setupPointerDelegation();
    setupMutationObserver();
    setupScrollReveal();
    setupTypewriter();
    setupCounters();
    setupButtonRipple();
    setupHeaderSlideIn();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
