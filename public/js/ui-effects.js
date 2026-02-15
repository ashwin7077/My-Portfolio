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

  const renderCursor = () => {
    if (!cursorDot || !cursorRing) return;
    cursorDotPos.x += (cursorTarget.x - cursorDotPos.x) * 0.52;
    cursorDotPos.y += (cursorTarget.y - cursorDotPos.y) * 0.52;
    cursorRingPos.x += (cursorTarget.x - cursorRingPos.x) * 0.19;
    cursorRingPos.y += (cursorTarget.y - cursorRingPos.y) * 0.19;
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

    document.body.classList.add('custom-cursor-enabled');
    cursorDot = document.createElement('div');
    cursorDot.className = 'fx-cursor-dot';
    cursorRing = document.createElement('div');
    cursorRing.className = 'fx-cursor-ring';
    document.body.append(cursorRing, cursorDot);

    if (!cursorFrame) cursorFrame = window.requestAnimationFrame(renderCursor);
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
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const start = () => {
    root.style.setProperty('--parallax-x', '0');
    root.style.setProperty('--parallax-y', '0');
    decorateCards(document);
    setupEffectLayers();
    setupPointerDelegation();
    setupMutationObserver();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
