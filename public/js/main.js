const sectionIds = ['about', 'projects', 'certifications', 'books', 'contact'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  projects: [],
  books: [],
  certifications: []
};

function setText(id, value = '') {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setLink(id, href = '#') {
  const node = document.getElementById(id);
  if (node) node.href = href || '#';
}

function setBrand(profile = {}) {
  const textNode = document.getElementById('brandLogoText');
  const imageNode = document.getElementById('brandLogoImage');
  const logoText = String(profile.logoText || profile.name || 'AP').trim().slice(0, 2).toUpperCase();

  if (textNode) textNode.textContent = logoText || 'AP';
  if (!imageNode) return;

  const logoUrl = String(profile.logoImageUrl || '').trim();
  if (logoUrl) {
    imageNode.src = logoUrl;
    imageNode.classList.add('visible');
    if (textNode) textNode.classList.add('hidden');
    return;
  }

  imageNode.classList.remove('visible');
  imageNode.removeAttribute('src');
  if (textNode) textNode.classList.remove('hidden');
}

function normalizeHexColor(value, fallback) {
  const color = String(value || '').trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : fallback;
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  const colors = {
    bg: normalizeHexColor(theme.bg, '#080b14'),
    surface: normalizeHexColor(theme.surface, '#101625'),
    text: normalizeHexColor(theme.text, '#e9eefc'),
    muted: normalizeHexColor(theme.muted, '#a9b3cc'),
    accent: normalizeHexColor(theme.accent, '#4da3ff'),
    line: normalizeHexColor(theme.line, '#2a3958')
  };

  root.style.setProperty('--bg', colors.bg);
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--surface-2', `color-mix(in srgb, ${colors.surface} 82%, ${colors.bg})`);
  root.style.setProperty('--text', colors.text);
  root.style.setProperty('--muted', colors.muted);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--line', colors.line);
}

function setMediaSource(id, url = '') {
  const node = document.getElementById(id);
  if (!node) return;

  if (!url) {
    node.classList.remove('visible');
    node.removeAttribute('src');
    return;
  }

  node.src = url;
  node.classList.add('visible');
}

function renderChips(id, values = []) {
  const node = document.getElementById(id);
  if (!node) return;
  node.innerHTML = '';

  if (!values.length) {
    const span = document.createElement('span');
    span.textContent = 'No data yet';
    node.appendChild(span);
    return;
  }

  values.forEach((value) => {
    const chip = document.createElement('span');
    chip.textContent = value;
    node.appendChild(chip);
  });
}

function renderCredibility(credibility = [], projects = []) {
  const row = document.getElementById('credibilityRow');
  if (!row) return;

  const fallback = [
    { label: 'CTF', value: 4 },
    { label: 'Bug Bounty', value: 3 },
    { label: 'Forensics', value: 5 },
    { label: 'Projects', value: projects.length || 1 }
  ];

  const metrics = Array.isArray(credibility) && credibility.length ? credibility : fallback;
  row.innerHTML = '';
  metrics.forEach((metric) => {
    const card = document.createElement('div');
    card.className = 'metric';
    card.innerHTML = `<strong>${Number(metric.value || 0)}</strong><span>${metric.label || 'Metric'}</span>`;
    row.appendChild(card);
  });
}

function projectTemplate(project = {}) {
  const image = project.imageUrl || project.coverUrl || '';
  return `
    <article class="project-card">
      ${image ? `<img class="card-image" src="${image}" alt="${project.title || 'Project'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${project.title || 'Untitled Project'}</h3>
        <span>${project.category || 'General'}</span>
      </div>
      <p><strong>Tech:</strong> ${project.tech || 'N/A'}</p>
      <p class="project-long">${project.summary || 'No summary yet.'}</p>
      ${project.descriptionHtml ? `<div class="project-long">${project.descriptionHtml}</div>` : ''}
      <div class="project-actions">
        ${project.repoUrl ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ''}
        ${project.demoUrl ? `<a class="btn ghost" href="${project.demoUrl}" target="_blank" rel="noreferrer">Live Demo</a>` : ''}
      </div>
    </article>
  `;
}

function renderProjects(projects = []) {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const items = projects.slice(0, 4);
  if (!items.length) {
    grid.innerHTML = '<article class="project-card"><h3>No projects yet</h3><p>Add projects from admin.</p></article>';
    return;
  }

  grid.innerHTML = items.map((project) => projectTemplate(project)).join('');
}

function certificationTemplate(item = {}) {
  const certImage = item.imageUrl || (Array.isArray(item.imageUrls) ? item.imageUrls[0] : '');
  return `
    <article class="cert-card">
      ${certImage ? `<img class="card-image" src="${certImage}" alt="${item.title || 'Certification'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${item.title || 'Certification'}</h3>
        <span>${item.category || 'General'}</span>
      </div>
      <p>${item.issuer || ''}${item.date ? ` • ${item.date}` : ''}</p>
      ${item.credentialUrl ? `<a class="btn ghost" href="${item.credentialUrl}" target="_blank" rel="noreferrer">View Credential</a>` : ''}
    </article>
  `;
}

function renderCertifications(certifications = []) {
  const grid = document.getElementById('certificationsGrid');
  if (!grid) return;

  const items = certifications.slice(0, 4);
  if (!items.length) {
    grid.innerHTML = '<article class="cert-card"><h3>No certifications yet</h3><p>Add certifications from admin.</p></article>';
    return;
  }

  grid.innerHTML = items.map((item) => certificationTemplate(item)).join('');
}

function bookCardTemplate(book = {}) {
  const image = book.imageUrl || book.profileImageUrl || book.coverUrl || '';
  return `
    <article class="cert-card book-card">
      ${image ? `<img class="card-image" src="${image}" alt="${book.title || 'Book'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${book.title || 'Book'}</h3>
        <span>${book.category || 'General'}</span>
      </div>
      <p>${book.author || ''}</p>
      ${book.descriptionHtml ? `<div class="project-long">${book.descriptionHtml}</div>` : ''}
    </article>
  `;
}

function renderBooks(books = [], categories = []) {
  const grid = document.getElementById('booksGrid');
  if (!grid) return;

  if (!books.length) {
    grid.innerHTML = '<article class="cert-card"><h3>No books yet</h3><p>Add books from admin.</p></article>';
    return;
  }

  const grouped = books.reduce((acc, book) => {
    const category = book.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(book);
    return acc;
  }, {});

  const orderedCategories = [...new Set([...(categories || []), ...Object.keys(grouped)])];
  grid.innerHTML = orderedCategories
    .filter((category) => grouped[category]?.length)
    .map((category) => `
      <section class="book-category">
        <h3 class="book-category-title">${category}</h3>
        <div class="books-grid">
          ${grouped[category].map((book) => bookCardTemplate(book)).join('')}
        </div>
      </section>
    `).join('');
}

function makeHeroLine(profile, technicalSkills) {
  const stack = technicalSkills.slice(0, 3).join(', ');
  const niche = profile.niche || 'security engineering';
  return `${profile.role || 'Developer'} specializing in ${niche} using ${stack || 'modern web stack'}.`;
}

async function fetchContent() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to load content');
  return data.content;
}

function setupNavHighlight() {
  const links = [...document.querySelectorAll('.nav-link')];
  const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
  const linkById = new Map(links.map((link) => [link.getAttribute('href')?.replace('#', ''), link]));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      links.forEach((l) => l.classList.remove('active'));
      const active = linkById.get(id);
      if (active) active.classList.add('active');
    });
  }, { rootMargin: '-40% 0px -45% 0px', threshold: 0.01 });

  sections.forEach((section) => observer.observe(section));
}

function setupBackToTop() {
  const button = document.getElementById('backToTop');
  if (!button) return;

  const toggle = () => button.classList.toggle('visible', window.scrollY > 280);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });
}

function setupReveal() {
  const nodes = document.querySelectorAll('.reveal');
  if (reducedMotion) {
    nodes.forEach((n) => n.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  nodes.forEach((node) => observer.observe(node));
}

(async function init() {
  setupNavHighlight();
  setupBackToTop();
  setupReveal();

  try {
    const content = await fetchContent();
    const profile = content.profile || {};
    const skills = Array.isArray(content.skills)
      ? { technical: content.skills, soft: [] }
      : {
          technical: Array.isArray(content.skills?.technical) ? content.skills.technical : [],
          soft: Array.isArray(content.skills?.soft) ? content.skills.soft : []
        };

    state.projects = Array.isArray(content.projects) ? content.projects : [];
    state.books = Array.isArray(content.books) ? content.books : [];
    state.certifications = Array.isArray(content.certifications) ? content.certifications : [];

    applyTheme(content.theme || {});

    document.title = `${profile.name || 'Portfolio'} | Portfolio`;
    setText('name', profile.name || 'Portfolio Owner');
    setBrand(profile);
    setText('heroLine', makeHeroLine(profile, skills.technical));
    setText('bio', profile.bio || '');

    setLink('cvBtn', profile.cvUrl || '#');
    setLink('emailBtn', profile.email ? `mailto:${profile.email}` : '#');

    setMediaSource('profileImage', profile.profileImageUrl || '');
    setMediaSource('profileAudio', profile.profileAudioUrl || '');
    setMediaSource('profileVideo', profile.profileVideoUrl || '');

    renderCredibility(content.credibility || [], state.projects);
    renderChips('technicalSkillsPreview', skills.technical);
    renderChips('softSkillsPreview', skills.soft);
    renderProjects(state.projects);
    renderCertifications(state.certifications);
    renderBooks(state.books, content.bookCategories || []);

    setText('contactLine', `Open to ${profile.niche || 'security'} opportunities. Reach out at ${profile.email || 'email'}.`);
  } catch (error) {
    setBrand({ logoText: 'AP' });
    setText('heroLine', 'Unable to load portfolio data right now.');
    setText('bio', error.message || 'Please verify backend and Firebase configuration.');
    renderCredibility([], []);
    renderChips('technicalSkillsPreview', []);
    renderChips('softSkillsPreview', []);
    renderProjects([]);
    renderCertifications([]);
    renderBooks([], []);
  }
})();

