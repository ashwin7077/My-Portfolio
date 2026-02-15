const sectionIds = ['about', 'projects', 'certifications', 'books', 'blogs', 'contact'];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const state = {
  projects: [],
  books: [],
  certifications: [],
  blogs: []
};

function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function longDescriptionHtml(item = {}) {
  const rich = String(item.descriptionHtml || '').trim();
  if (rich) return rich;
  const plain = String(item.description || '').trim();
  if (!plain) return '';
  return `<p>${escapeHtml(plain).replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</p>`;
}

function certificationDescriptionHtml(item = {}) {
  const rich = String(item.descriptionHtml || '').trim();
  if (rich) return rich;
  const plain = String(item.description || item.details || '').trim();
  if (!plain) return '';
  return `<p>${escapeHtml(plain).replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</p>`;
}

function blogDescriptionHtml(blog = {}) {
  const rich = String(blog.descriptionHtml || blog.contentHtml || '').trim();
  if (rich) return rich;
  const plain = String(blog.content || blog.description || blog.body || blog.excerpt || '').trim();
  if (!plain) return '';
  return `<p>${escapeHtml(plain).replace(/\r\n/g, '\n').replace(/\n/g, '<br>')}</p>`;
}

function showDetailModal({ title = 'Details', meta = '', content = '', image = '', actions = '' }) {
  const existing = document.querySelector('.detail-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'detail-modal';
  modal.innerHTML = `
    <article class="detail-panel">
      <div class="detail-panel-head">
        <div>
          <h3>${title}</h3>
          ${meta ? `<p class="detail-panel-meta">${meta}</p>` : ''}
        </div>
        <button type="button" class="detail-close" aria-label="Close details">Close</button>
      </div>
      ${image ? `<img class="detail-image" src="${image}" alt="${title} image">` : ''}
      <div class="detail-content">${content || '<p>No detailed description available.</p>'}</div>
      ${actions ? `<div class="detail-actions">${actions}</div>` : ''}
    </article>
  `;
  document.body.appendChild(modal);
  document.body.classList.add('modal-open');

  const close = () => {
    modal.remove();
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKeyDown);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') close();
  };

  modal.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('detail-modal') || target.classList.contains('detail-close')) {
      close();
    }
  });
  document.addEventListener('keydown', onKeyDown);
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeCertificationCategory(value = '') {
  const source = String(value || '').toLowerCase();
  if (source.includes('participation')) return 'participations';
  if (source.includes('soft')) return 'softskill';
  return 'technical-skill';
}

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

function projectTemplate(project = {}, index = 0) {
  const image = project.imageUrl || project.coverUrl || '';
  const detailed = longDescriptionHtml(project);
  const modalMeta = `${project.category || 'General'}${project.tech ? ` | ${project.tech}` : ''}`;
  const modalActions = `
    ${project.repoUrl ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ''}
    ${project.demoUrl ? `<a class="btn ghost" href="${project.demoUrl}" target="_blank" rel="noreferrer">Live Demo</a>` : ''}
  `;
  return `
    <article class="project-card motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 7) * 70}ms"
      ${detailed ? `data-modal="detail" data-modal-title="${escapeHtml(project.title || 'Project')}" data-modal-meta="${escapeHtml(modalMeta)}"` : ''}
    >
      ${image ? `<img class="card-image" src="${image}" alt="${project.title || 'Project'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${project.title || 'Untitled Project'}</h3>
        <span>${project.category || 'General'}</span>
      </div>
      <p><strong>Tech:</strong> ${project.tech || 'N/A'}</p>
      <p class="project-long">${project.summary || 'No summary yet.'}</p>
      ${detailed ? `<div class="detail-source hidden">${detailed}</div>` : ''}
      <div class="project-actions">
        ${project.repoUrl ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ''}
        ${project.demoUrl ? `<a class="btn ghost" href="${project.demoUrl}" target="_blank" rel="noreferrer">Live Demo</a>` : ''}
      </div>
      ${detailed ? `<div class="detail-actions-source hidden">${modalActions}</div>` : ''}
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

  grid.innerHTML = items.map((project, index) => projectTemplate(project, index)).join('');
}

function certificationTemplate(item = {}, index = 0) {
  const certImage = item.imageUrl || (Array.isArray(item.imageUrls) ? item.imageUrls[0] : '');
  const detailed = certificationDescriptionHtml(item);
  return `
    <article class="cert-card cert-card-featured motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 5) * 80}ms"
      ${detailed ? `data-modal="detail" data-modal-title="${escapeHtml(item.title || 'Certification')}" data-modal-meta="${escapeHtml(item.issuer || item.category || 'Certification')}${item.date ? ` | ${escapeHtml(item.date)}` : ''}"` : ''}>
      <div class="cert-media">
        ${certImage ? `<img class="cert-img" src="${certImage}" alt="${item.title || 'Certification'} image" loading="lazy">` : '<div class="cert-img cert-img-empty">No Image</div>'}
      </div>
      <div class="cert-meta">
        <h3 class="cert-title">${item.title || 'Certification'}</h3>
        <p class="cert-year">${item.date || 'Date not set'}</p>
      </div>
      ${detailed ? `<div class="detail-source hidden">${detailed}</div>` : ''}
      ${item.credentialUrl ? `<div class="detail-actions-source hidden"><a class="btn ghost" href="${escapeHtml(item.credentialUrl)}" target="_blank" rel="noreferrer">View Credential</a></div>` : ''}
    </article>
  `;
}

function renderCertifications(certifications = []) {
  const grid = document.getElementById('certificationsGrid');
  if (!grid) return;

  const items = certifications.slice(0, 3);

  if (!items.length) {
    grid.innerHTML = '<article class="cert-card"><h3>No certifications yet</h3><p>Add certifications from admin.</p></article>';
    return;
  }

  grid.innerHTML = items.map((item, index) => certificationTemplate(item, index)).join('');
}

function bookCardTemplate(book = {}, index = 0) {
  const image = book.imageUrl || book.profileImageUrl || book.coverUrl || '';
  const detailed = longDescriptionHtml(book);
  return `
    <article class="cert-card book-card motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 9) * 60}ms"
      ${detailed ? `data-modal="detail" data-modal-title="${escapeHtml(book.title || 'Book')}" data-modal-meta="${escapeHtml(book.author || '')}"` : ''}>
      ${image ? `<img class="card-image" src="${image}" alt="${book.title || 'Book'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${book.title || 'Book'}</h3>
        <span>${book.category || 'General'}</span>
      </div>
      <p>${book.author || ''}</p>
      ${detailed ? `<div class="detail-source hidden">${detailed}</div>` : ''}
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
          ${grouped[category].map((book, index) => bookCardTemplate(book, index)).join('')}
        </div>
      </section>
    `).join('');
}

function blogCardTemplate(blog = {}, index = 0) {
  const image = blog.imageUrl || '';
  const date = blog.date ? new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Date not set';
  const title = blog.title || 'Untitled Blog';
  const excerpt = blog.excerpt || '';
  const detailed = blogDescriptionHtml(blog);

  return `
    <article class="blog-card motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 7) * 70}ms"
      ${detailed ? `data-modal="detail" data-modal-title="${escapeHtml(title)}" data-modal-meta="${escapeHtml(date)}"` : ''}>
      <div class="blog-meta">
        <h3 class="blog-title">${title}</h3>
        <p class="blog-date">${date}</p>
        ${excerpt ? `<p class="blog-excerpt">${excerpt}</p>` : ''}
      </div>
      <div class="blog-media">
        ${image ? `<img class="blog-img" src="${image}" alt="${title} image" loading="lazy">` : '<div class="blog-img blog-img-empty">No Image</div>'}
      </div>
      ${detailed ? `<div class="detail-source hidden">${detailed}</div>` : ''}
      ${blog.url ? `<div class="detail-actions-source hidden"><a class="btn ghost" href="${escapeHtml(blog.url)}" target="_blank" rel="noreferrer">Read Full Blog</a></div>` : ''}
    </article>
  `;
}

function setupDetailPopups() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.project-actions a, .detail-actions a')) return;

    const card = target.closest('[data-modal="detail"]');
    if (!(card instanceof HTMLElement)) return;
    if (target.closest('a,button,input,textarea,select,label')) return;

    const title = card.dataset.modalTitle || 'Details';
    const meta = card.dataset.modalMeta || '';
    const source = card.querySelector('.detail-source');
    const actionsSource = card.querySelector('.detail-actions-source');
    const image = card.querySelector('img')?.getAttribute('src') || '';
    showDetailModal({
      title,
      meta,
      image,
      content: source?.innerHTML || '',
      actions: actionsSource?.innerHTML || ''
    });
  });
}

function renderFeaturedBlogs(blogs = []) {
  const grid = document.getElementById('blogsGrid');
  if (!grid) return;
  const items = [...blogs]
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 3);
  if (!items.length) {
    grid.innerHTML = '<article class="blog-card"><div class="blog-meta"><h3 class="blog-title">No blogs yet</h3><p class="blog-date">Add blog posts from your content source.</p></div></article>';
    return;
  }
  grid.innerHTML = items.map((blog, index) => blogCardTemplate(blog, index)).join('');
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
  setupDetailPopups();
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
    state.blogs = Array.isArray(content.blogs) ? content.blogs : [];

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
    renderFeaturedBlogs(state.blogs);

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
    renderFeaturedBlogs([]);
  }
})();


