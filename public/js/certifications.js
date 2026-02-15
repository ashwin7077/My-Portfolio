function normalizeHexColor(value, fallback) {
  const color = String(value || '').trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : fallback;
}

function applyTheme(theme = {}) {
  const root = document.documentElement;
  root.style.setProperty('--bg', normalizeHexColor(theme.bg, '#080b14'));
  root.style.setProperty('--surface', normalizeHexColor(theme.surface, '#101625'));
  root.style.setProperty('--text', normalizeHexColor(theme.text, '#e9eefc'));
  root.style.setProperty('--muted', normalizeHexColor(theme.muted, '#a9b3cc'));
  root.style.setProperty('--accent', normalizeHexColor(theme.accent, '#4da3ff'));
  root.style.setProperty('--line', normalizeHexColor(theme.line, '#2a3958'));
}

function setBrand(profile = {}) {
  const textNode = document.getElementById('brandLogoText');
  const imageNode = document.getElementById('brandLogoImage');
  const logoText = String(profile.logoText || profile.name || 'AP').trim().slice(0, 2).toUpperCase();
  if (textNode) textNode.textContent = logoText || 'AP';
  if (!imageNode) return;
  if (profile.logoImageUrl) {
    imageNode.src = profile.logoImageUrl;
    imageNode.classList.add('visible');
    if (textNode) textNode.classList.add('hidden');
  }
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const CATEGORY_DEFS = [
  { slug: 'participations', title: 'Participations' },
  { slug: 'softskill', title: 'Softskill' },
  { slug: 'technical-skill', title: 'Technical Skill' }
];

function normalizeCategory(value = '') {
  const source = String(value || '').toLowerCase();
  if (source.includes('participation')) return 'participations';
  if (source.includes('soft')) return 'softskill';
  return 'technical-skill';
}

function categoryTitle(slug = '') {
  const found = CATEGORY_DEFS.find((item) => item.slug === slug);
  return found ? found.title : 'Category';
}

function certImage(item = {}) {
  return item.imageUrl || (Array.isArray(item.imageUrls) ? item.imageUrls[0] : '') || '';
}

function certificationDescriptionHtml(item = {}) {
  const rich = String(item.descriptionHtml || '').trim();
  if (rich) return rich;
  const plain = String(item.description || item.details || '').trim();
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
    if (target.classList.contains('detail-modal') || target.classList.contains('detail-close')) close();
  });
  document.addEventListener('keydown', onKeyDown);
}

function parseRoute() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'certifications') {
    return { view: 'root' };
  }
  if (segments.length === 1) {
    return { view: 'root' };
  }
  if (segments.length === 2) {
    return { view: 'category', category: segments[1] };
  }
  return { view: 'detail', category: segments[1], slug: segments[2] };
}

function enrichCertifications(items = []) {
  const used = new Set();
  return items.map((item, index) => {
    const cat = normalizeCategory(item.category || '');
    let slug = slugify(item.title || `certification-${index + 1}`) || `certification-${index + 1}`;
    while (used.has(slug)) {
      slug = `${slug}-${index + 1}`;
    }
    used.add(slug);
    return {
      ...item,
      _slug: slug,
      _category: cat
    };
  });
}

function renderRoot(app, titleNode, breadcrumbNode, allCerts) {
  titleNode.textContent = 'Certifications';
  breadcrumbNode.textContent = '/certifications';
  const counts = CATEGORY_DEFS.reduce((acc, category) => {
    acc[category.slug] = allCerts.filter((cert) => cert._category === category.slug).length;
    return acc;
  }, {});

  app.innerHTML = `
    <div class="cert-categories-grid">
      ${CATEGORY_DEFS.map((category, index) => `
        <a class="cert-category-tile motion-rise" style="--delay:${index * 90}ms" href="/certifications/${category.slug}">
          <h3>${category.title}</h3>
          <p>${counts[category.slug] || 0} certification${counts[category.slug] === 1 ? '' : 's'}</p>
        </a>
      `).join('')}
    </div>
  `;
}

function certificationCard(item, index = 0) {
  const image = certImage(item);
  const detailed = certificationDescriptionHtml(item);
  const modalMeta = `${categoryTitle(item._category)}${item.date ? ` | ${item.date}` : ''}`;
  return `
    <article class="cert-card motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 8) * 70}ms"
      ${detailed ? `data-modal="detail" data-modal-title="${escapeHtml(item.title || 'Certification')}" data-modal-meta="${escapeHtml(modalMeta)}"` : ''}>
      ${image ? `<img class="card-image" src="${escapeHtml(image)}" alt="${escapeHtml(item.title || 'Certification')} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${escapeHtml(item.title || 'Certification')}</h3>
        <span>${escapeHtml(categoryTitle(item._category))}</span>
      </div>
      <p>${escapeHtml(item.date || 'Date not set')}</p>
      ${detailed ? `<div class="detail-source hidden">${detailed}</div>` : ''}
      ${item.credentialUrl ? `<div class="detail-actions-source hidden"><a class="btn ghost" href="${escapeHtml(item.credentialUrl)}" target="_blank" rel="noreferrer">View Credential</a></div>` : ''}
    </article>
  `;
}

function setupDetailPopups() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest('.detail-actions a')) return;
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

function renderCategory(app, titleNode, breadcrumbNode, allCerts, route) {
  const categorySlug = route.category;
  const inCategory = allCerts.filter((item) => item._category === categorySlug);
  titleNode.textContent = categoryTitle(categorySlug);
  breadcrumbNode.textContent = `/certifications/${categorySlug}`;

  const placeholdersNeeded = Math.max(0, 3 - inCategory.length);
  const placeholders = Array.from({ length: placeholdersNeeded }, (_, i) => `
    <article class="cert-card placeholder">Placeholder ${i + 1}</article>
  `).join('');

  app.innerHTML = `
    <div class="section-header">
      <h3>${categoryTitle(categorySlug)} Certifications</h3>
      <a class="btn ghost" href="/certifications">Back to Categories</a>
    </div>
    <div class="certifications-grid">
      ${inCategory.length ? inCategory.map((item, index) => certificationCard(item, index)).join('') : '<article class="cert-card"><h3>No certifications in this category yet.</h3></article>'}
      ${placeholders}
    </div>
  `;
}

function renderDetail(app, titleNode, breadcrumbNode, allCerts, route) {
  const categorySlug = route.category;
  const item = allCerts.find((cert) => cert._category === categorySlug && cert._slug === route.slug);
  if (!item) {
    titleNode.textContent = 'Certification Not Found';
    breadcrumbNode.textContent = `/certifications/${categorySlug}/${route.slug}`;
    app.innerHTML = `
      <article class="cert-card">
        <h3>Certification not found</h3>
        <p>The requested certification detail does not exist.</p>
        <a class="btn ghost" href="/certifications/${categorySlug}">Back to ${categoryTitle(categorySlug)}</a>
      </article>
    `;
    return;
  }

  const description = String(item.description || item.details || item.descriptionHtml || '').trim();
  const fallbackDescription = `This certification was issued by ${item.issuer || 'an issuer'}${item.date ? ` on ${item.date}` : ''}.`;

  titleNode.textContent = item.title || 'Certification Details';
  breadcrumbNode.textContent = `/certifications/${categorySlug}/${item._slug}`;
  app.innerHTML = `
    <article class="cert-detail-panel motion-rise">
      <div class="cert-detail-head">
        <h3>${escapeHtml(item.title || 'Certification')}</h3>
        <a class="btn ghost" href="/certifications/${categorySlug}">Back to ${escapeHtml(categoryTitle(categorySlug))}</a>
      </div>
      ${certImage(item) ? `<img class="cert-detail-image" src="${escapeHtml(certImage(item))}" alt="${escapeHtml(item.title || 'Certification')} image">` : ''}
      <p class="cert-detail-meta">${escapeHtml(item.issuer || 'Issuer not set')}${item.date ? ` | ${escapeHtml(item.date)}` : ''}</p>
      <p class="cert-detail-description">${escapeHtml(description || fallbackDescription)}</p>
      ${item.credentialUrl ? `<p><a class="btn ghost" href="${escapeHtml(item.credentialUrl)}" target="_blank" rel="noreferrer">View Credential</a></p>` : ''}
    </article>
  `;
}

(async function init() {
  setupDetailPopups();
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;

  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});

  const app = document.getElementById('certificationsApp');
  const titleNode = document.getElementById('certPageTitle');
  const breadcrumbNode = document.getElementById('certBreadcrumb');
  if (!app || !titleNode || !breadcrumbNode) return;

  const certifications = enrichCertifications(Array.isArray(data.content.certifications) ? data.content.certifications : []);
  const route = parseRoute();

  if (route.view === 'root') {
    renderRoot(app, titleNode, breadcrumbNode, certifications);
    return;
  }

  if (route.view === 'category') {
    renderCategory(app, titleNode, breadcrumbNode, certifications, route);
    return;
  }

  renderDetail(app, titleNode, breadcrumbNode, certifications, route);
})();
