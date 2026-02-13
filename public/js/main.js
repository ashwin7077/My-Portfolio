async function loadPortfolio() {
  const response = await fetch('/api/content');
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.message || 'Failed to load content');
  }

  return data.content;
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) {
    node.textContent = value || '';
  }
}

function renderChipList(containerId, values = []) {
  const node = document.getElementById(containerId);
  if (!node) {
    return;
  }
  node.innerHTML = '';
  if (!values.length) {
    const empty = document.createElement('span');
    empty.textContent = 'No items yet';
    node.appendChild(empty);
    return;
  }
  values.forEach((value) => {
    const chip = document.createElement('span');
    chip.textContent = value;
    node.appendChild(chip);
  });
}

function setProfileImage(url = '') {
  const node = document.getElementById('profileImage');
  if (!node) {
    return;
  }

  if (!url) {
    node.classList.remove('visible');
    node.removeAttribute('src');
    return;
  }

  node.src = url;
  node.classList.add('visible');
}

function setMediaSource(id, url = '') {
  const node = document.getElementById(id);
  if (!node) {
    return;
  }

  if (!url) {
    node.classList.remove('visible');
    node.removeAttribute('src');
    node.load?.();
    return;
  }

  node.src = url;
  node.classList.add('visible');
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = typeof window.gsap !== 'undefined';

const audioState = {
  enabled: localStorage.getItem('ui_sound_enabled') === 'true',
  context: null
};

function getAudioContext() {
  if (!audioState.context) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioState.context = new Ctx();
  }

  if (audioState.context.state === 'suspended') {
    audioState.context.resume();
  }

  return audioState.context;
}

function playTone({ frequency, duration = 0.08, type = 'sine', gain = 0.03, endFrequency }) {
  if (!audioState.enabled) {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  const osc = ctx.createOscillator();
  const amp = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  if (endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), ctx.currentTime + duration);
  }

  amp.gain.setValueAtTime(0.0001, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + duration * 0.2);
  amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(amp);
  amp.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration + 0.01);
}

function playTapSound() {
  playTone({ frequency: 590, endFrequency: 430, duration: 0.07, gain: 0.022, type: 'triangle' });
}

function playWhooshSound() {
  playTone({ frequency: 310, endFrequency: 130, duration: 0.24, gain: 0.018, type: 'sawtooth' });
}

function playHoverPitch(seed = 0) {
  if (prefersReducedMotion) {
    return;
  }

  const pitch = 380 + (seed % 8) * 18;
  playTone({ frequency: pitch, endFrequency: pitch * 0.95, duration: 0.06, gain: 0.012, type: 'sine' });
}

function updateSoundToggle() {
  const toggle = document.getElementById('soundToggle');
  if (!toggle) {
    return;
  }

  toggle.setAttribute('aria-pressed', String(audioState.enabled));
  toggle.textContent = audioState.enabled ? 'Sound: On' : 'Sound: Off';
}

function setupSoundToggle() {
  const toggle = document.getElementById('soundToggle');
  if (!toggle) {
    return;
  }

  updateSoundToggle();
  toggle.addEventListener('click', () => {
    audioState.enabled = !audioState.enabled;
    localStorage.setItem('ui_sound_enabled', String(audioState.enabled));
    updateSoundToggle();
    playTapSound();
  });
}

function setupEntranceTimeline() {
  if (prefersReducedMotion || !hasGsap) {
    document.body.classList.add('page-ready');
    return;
  }

  const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } });
  timeline
    .from('.logo', { scale: 0.88, opacity: 0, duration: 0.45 })
    .from('.home-nav nav > *', { y: -10, opacity: 0, duration: 0.32, stagger: 0.06 }, '<0.08')
    .from('.intro .eyebrow, .intro h1, .intro .role, .intro .bio', {
      y: 14,
      opacity: 0,
      duration: 0.44,
      stagger: 0.08
    }, '<0.05')
    .add(() => document.body.classList.add('page-ready'));
}

function createTile({ id, className, kicker, title, body, tags = [] }) {
  const tile = document.createElement('article');
  tile.className = `tile ${className || ''}`.trim();
  tile.dataset.caseId = id;
  tile.tabIndex = 0;

  const tagHtml = tags
    .slice(0, 5)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join('');

  tile.innerHTML = `
    <p class="tile-kicker">${escapeHtml(kicker)}</p>
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(body)}</p>
    <div class="meta">${tagHtml}</div>
    <span class="unfold">Open Case</span>
  `;

  return tile;
}

function buildCaseMap(content) {
  const { profile, socials = [], projects = [], certifications = [], experience = [] } = content;
  const skills = Array.isArray(content.skills)
    ? { technical: content.skills, soft: [] }
    : {
        technical: Array.isArray(content.skills?.technical) ? content.skills.technical : [],
        soft: Array.isArray(content.skills?.soft) ? content.skills.soft : []
      };
  const map = new Map();

  map.set('profile', {
    title: `${profile.name} - ${profile.role}`,
    body: profile.bio,
    tags: [profile.location, profile.email, ...skills.technical.slice(0, 4), ...skills.soft.slice(0, 2)].filter(Boolean),
    links: [
      profile.ctaLink ? { label: profile.ctaLabel || 'Primary CTA', href: profile.ctaLink } : null,
      { label: 'Contact Page', href: '/contact' }
    ].filter(Boolean)
  });

  map.set('skills-technical', {
    title: 'Technical Skills',
    body: 'Primary technology stack used for product development and delivery.',
    tags: skills.technical.slice(0, 10),
    links: []
  });

  map.set('skills-soft', {
    title: 'Soft Skills',
    body: 'Collaboration and communication strengths that support clean execution.',
    tags: skills.soft.slice(0, 10),
    links: []
  });

  map.set('experience', {
    title: 'Experience',
    body: 'Professional background and delivery track record.',
    tags: experience.slice(0, 5).map((item) => `${item.role}${item.company ? ` @ ${item.company}` : ''}`),
    links: []
  });

  map.set('certifications', {
    title: 'Certifications',
    body: 'Verified credentials and learning milestones.',
    tags: certifications.slice(0, 8).map((item) => item.title),
    links: certifications.slice(0, 2).map((item) => ({
      label: item.issuer ? `${item.title} - ${item.issuer}` : item.title,
      href: item.credentialUrl || '#'
    })).filter((item) => item.href && item.href !== '#')
  });

  map.set('contact', {
    title: 'Contact + Availability',
    body: 'Open the contact page for direct outreach. You can control all contact details from your admin panel.',
    tags: [profile.email, profile.phone, profile.location].filter(Boolean),
    links: [
      profile.email ? { label: 'Email', href: `mailto:${profile.email}` } : null,
      { label: 'Open Contact', href: '/contact' }
    ].filter(Boolean)
  });

  (projects || []).forEach((project, index) => {
    map.set(`project-${index}`, {
      title: project.title,
      body: project.description,
      tags: (project.tech || '').split(',').map((v) => v.trim()).filter(Boolean),
      links: [
        project.demoUrl ? { label: 'Live Demo', href: project.demoUrl } : null,
        project.repoUrl ? { label: 'Source Code', href: project.repoUrl } : null
      ].filter(Boolean)
    });
  });

  socials.forEach((social, index) => {
    map.set(`social-${index}`, {
      title: social.platform,
      body: `Social profile and network channel for ${profile.name}.`,
      tags: [social.platform],
      links: [{ label: `Visit ${social.platform}`, href: social.url }]
    });
  });

  return map;
}

function renderBento(content) {
  const grid = document.getElementById('bentoGrid');
  const { profile, projects = [], socials = [], certifications = [], experience = [] } = content;
  const skills = Array.isArray(content.skills)
    ? { technical: content.skills, soft: [] }
    : {
        technical: Array.isArray(content.skills?.technical) ? content.skills.technical : [],
        soft: Array.isArray(content.skills?.soft) ? content.skills.soft : []
      };

  const tiles = [
    createTile({
      id: 'profile',
      className: 'profile accent',
      kicker: 'About',
      title: profile.name,
      body: profile.bio,
      tags: [profile.role, profile.location].filter(Boolean)
    }),
    createTile({
      id: 'skills-technical',
      className: 'skills',
      kicker: 'Technical Skills',
      title: `${skills.technical.length} Core Tools`,
      body: 'Focused stack for building scalable and maintainable web products.',
      tags: skills.technical.slice(0, 5)
    }),
    createTile({
      id: 'skills-soft',
      className: 'skills',
      kicker: 'Soft Skills',
      title: `${skills.soft.length} Collaboration Skills`,
      body: 'Communication, ownership, and teamwork for clear delivery.',
      tags: skills.soft.slice(0, 5)
    }),
    createTile({
      id: 'experience',
      className: 'experience accent',
      kicker: 'Experience',
      title: `${experience.length} Roles`,
      body: 'Hands-on delivery across product and engineering workflows.',
      tags: experience.slice(0, 2).map((item) => item.role).filter(Boolean)
    }),
    createTile({
      id: 'certifications',
      className: 'certification',
      kicker: 'Certifications',
      title: `${certifications.length} Credentials`,
      body: 'Professional certifications and continuous learning milestones.',
      tags: certifications.slice(0, 3).map((item) => item.title)
    }),
    createTile({
      id: 'contact',
      className: 'contact accent',
      kicker: 'Reach Out',
      title: 'Let\'s Collaborate',
      body: 'Open contact details and preferred communication channels.',
      tags: [profile.email || 'Email', 'Available']
    })
  ];

  projects.slice(0, 6).forEach((project, index) => {
    tiles.push(
      createTile({
        id: `project-${index}`,
        className: 'project',
        kicker: project.featured ? 'Featured Project' : 'Project',
        title: project.title,
        body: project.description,
        tags: (project.tech || '').split(',').map((v) => v.trim()).filter(Boolean).slice(0, 3)
      })
    );
  });

  socials.slice(0, 2).forEach((social, index) => {
    tiles.push(
      createTile({
        id: `social-${index}`,
        className: 'project',
        kicker: 'Network',
        title: social.platform,
        body: `Connect with ${profile.name} on ${social.platform}.`,
        tags: ['Social Link']
      })
    );
  });

  grid.replaceChildren(...tiles);
  return tiles;
}

function setupGridParallax() {
  if (prefersReducedMotion || !hasGsap) {
    return;
  }

  const grid = document.getElementById('bentoGrid');
  if (!grid) {
    return;
  }

  window.addEventListener('pointermove', (event) => {
    const xRatio = event.clientX / window.innerWidth - 0.5;
    const yRatio = event.clientY / window.innerHeight - 0.5;

    gsap.to(grid, {
      x: xRatio * 10,
      y: yRatio * 8,
      duration: 0.5,
      ease: 'sine.out',
      overwrite: 'auto'
    });
  });
}

function setupBreathing(tiles) {
  if (prefersReducedMotion || !hasGsap) {
    return;
  }

  tiles.forEach((tile, index) => {
    gsap.to(tile, {
      y: 4,
      duration: 2.4 + (index % 3) * 0.35,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: index * 0.06
    });
  });
}

function setupMagnetics(tiles) {
  if (prefersReducedMotion) {
    return;
  }

  tiles.forEach((tile, index) => {
    tile.addEventListener('pointerenter', () => playHoverPitch(index));

    tile.addEventListener('pointermove', (event) => {
      const rect = tile.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const px = x / rect.width;
      const py = y / rect.height;
      const dx = px - 0.5;
      const dy = py - 0.5;

      tile.style.setProperty('--gx', `${px * 100}%`);
      tile.style.setProperty('--gy', `${py * 100}%`);

      if (hasGsap) {
        gsap.to(tile, {
          x: dx * 16,
          y: dy * 14,
          rotateX: -dy * 9,
          rotateY: dx * 9,
          duration: 0.24,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }
    });

    tile.addEventListener('pointerleave', () => {
      if (hasGsap) {
        gsap.to(tile, {
          x: 0,
          y: 0,
          rotateX: 0,
          rotateY: 0,
          duration: 0.36,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      } else {
        tile.style.transform = 'none';
      }
    });
  });
}

function caseTemplate(caseData) {
  const tags = (caseData.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
  const links = (caseData.links || [])
    .map((link) => `<a href="${escapeHtml(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join('');

  return `
    <header class="case-header">
      <h2 class="stagger">${escapeHtml(caseData.title)}</h2>
    </header>
    <div class="case-tags stagger">${tags}</div>
    <p class="stagger">${escapeHtml(caseData.body || '')}</p>
    <div class="case-links stagger">${links}</div>
  `;
}

function setupCaseOverlay(tiles, caseMap) {
  const overlay = document.getElementById('caseOverlay');
  const panel = document.getElementById('casePanel');
  const content = document.getElementById('caseContent');
  const closeButton = document.getElementById('closeCase');

  let activeTile = null;
  let opening = false;

  function openCase(tile) {
    const caseId = tile.dataset.caseId;
    const caseData = caseMap.get(caseId);
    if (!caseData || opening) {
      return;
    }

    playTapSound();
    opening = true;
    activeTile = tile;
    const rect = tile.getBoundingClientRect();

    content.innerHTML = caseTemplate(caseData);
    content.style.opacity = '0';

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');

    const duration = prefersReducedMotion ? 0 : 0.58;

    gsap.set(panel, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: 18
    });

    if (!hasGsap) {
      panel.style.top = `${window.innerHeight * 0.07}px`;
      panel.style.left = `${window.innerWidth * 0.08}px`;
      panel.style.width = `${window.innerWidth * 0.84}px`;
      panel.style.height = `${window.innerHeight * 0.86}px`;
      panel.style.borderRadius = '24px';
      content.style.opacity = '1';
      content.querySelectorAll('.stagger').forEach((node) => {
        node.style.opacity = '1';
        node.style.transform = 'none';
      });
      opening = false;
      return;
    }

    gsap.to(panel, {
      top: window.innerHeight * 0.07,
      left: window.innerWidth * 0.08,
      width: window.innerWidth * 0.84,
      height: window.innerHeight * 0.86,
      borderRadius: 24,
      duration,
      ease: 'power3.inOut',
      onComplete: () => {
        gsap.to(content, { opacity: 1, duration: prefersReducedMotion ? 0 : 0.24 });
        if (!prefersReducedMotion) {
          gsap.to('.case-content .stagger', {
            opacity: 1,
            y: 0,
            duration: 0.32,
            stagger: 0.06,
            ease: 'power2.out'
          });
        } else {
          content.querySelectorAll('.stagger').forEach((node) => {
            node.style.opacity = '1';
            node.style.transform = 'none';
          });
        }
        opening = false;
      }
    });
  }

  function closeCase() {
    if (!activeTile || opening) {
      return;
    }

    opening = true;
    const rect = activeTile.getBoundingClientRect();

    if (!hasGsap) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      activeTile = null;
      opening = false;
      return;
    }

    gsap.to(content, { opacity: 0, duration: prefersReducedMotion ? 0 : 0.16 });
    gsap.to(panel, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      borderRadius: 18,
      duration: prefersReducedMotion ? 0 : 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        activeTile = null;
        opening = false;
      }
    });
  }

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => openCase(tile));
    tile.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openCase(tile);
      }
    });
  });

  closeButton.addEventListener('click', closeCase);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeCase();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeCase();
    }
  });
}

function setupTapAudio() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest('.tile, .sound-toggle, .close-case, .home-nav a')) {
      playTapSound();
    }
  });
}

function setupPageTransitionAudio() {
  document.addEventListener('click', (event) => {
    const link = event.target instanceof HTMLElement ? event.target.closest('a[href]') : null;
    if (!link) {
      return;
    }

    if (link.target === '_blank') {
      return;
    }

    const href = link.getAttribute('href') || '';
    if (!href.startsWith('/')) {
      return;
    }

    if (href === window.location.pathname) {
      return;
    }

    if (prefersReducedMotion) {
      return;
    }

    event.preventDefault();
    playWhooshSound();

    if (!hasGsap) {
      window.location.href = href;
      return;
    }

    gsap.to('body', {
      opacity: 0,
      y: 10,
      duration: 0.3,
      ease: 'power2.inOut',
      onComplete: () => {
        window.location.href = href;
      }
    });
  });
}

(async function init() {
  try {
    const content = await loadPortfolio();
    const { profile, certifications = [] } = content;
    const skills = Array.isArray(content.skills)
      ? { technical: content.skills, soft: [] }
      : {
          technical: Array.isArray(content.skills?.technical) ? content.skills.technical : [],
          soft: Array.isArray(content.skills?.soft) ? content.skills.soft : []
        };

    document.title = `${profile.name} | Living Bento Portfolio`;
    setText('name', profile.name);
    setText('role', profile.role);
    setText('bio', profile.bio);
    setProfileImage(profile.profileImageUrl || '');
    setMediaSource('profileAudio', profile.profileAudioUrl || '');
    setMediaSource('profileVideo', profile.profileVideoUrl || '');
    renderChipList('technicalSkillsPreview', skills.technical);
    renderChipList('softSkillsPreview', skills.soft);
    renderChipList('certificationsPreview', certifications.map((item) => item.title).filter(Boolean));

    setupSoundToggle();
    setupTapAudio();
    setupPageTransitionAudio();
    setupEntranceTimeline();
    setupGridParallax();

    const caseMap = buildCaseMap(content);
    const tiles = renderBento(content);

    if (!prefersReducedMotion && hasGsap) {
      gsap.from('.tile', {
        opacity: 0,
        y: 20,
        duration: 0.52,
        stagger: 0.06,
        ease: 'power2.out'
      });
    }

    setupBreathing(tiles);
    setupMagnetics(tiles);
    setupCaseOverlay(tiles, caseMap);
  } catch (error) {
    console.error(error);
    setText('role', 'Configuration Required');
    setText('bio', 'Portfolio data is unavailable. Ensure Firebase Firestore is created and server env values are valid.');
    renderChipList('technicalSkillsPreview', []);
    renderChipList('softSkillsPreview', []);
    renderChipList('certificationsPreview', []);
  }
})();
