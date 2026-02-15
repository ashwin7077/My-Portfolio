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

function showDetailModal({ title = 'Details', meta = '', content = '', image = '' }) {
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

function bookTemplate(book = {}, index = 0) {
  const image = book.imageUrl || book.profileImageUrl || book.coverUrl || '';
  const detailed = longDescriptionHtml(book);
  return `
    <article class="cert-card motion-rise ${detailed ? 'clickable-card' : ''}" style="--delay:${Math.min(index, 8) * 65}ms"
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

function setupDetailPopups() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest('[data-modal="detail"]');
    if (!(card instanceof HTMLElement)) return;
    if (target.closest('a,button,input,textarea,select,label')) return;

    const title = card.dataset.modalTitle || 'Details';
    const meta = card.dataset.modalMeta || '';
    const source = card.querySelector('.detail-source');
    const image = card.querySelector('img')?.getAttribute('src') || '';
    showDetailModal({
      title,
      meta,
      image,
      content: source?.innerHTML || ''
    });
  });
}

(async function init() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;
  setupDetailPopups();
  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});
  const books = Array.isArray(data.content.books) ? data.content.books : [];
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = books.length ? books.map((b, index) => bookTemplate(b, index)).join('') : '<article class="cert-card"><h3>No books yet</h3></article>';
})();

