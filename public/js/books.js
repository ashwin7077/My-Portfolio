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

function bookTemplate(book = {}) {
  const image = book.imageUrl || book.profileImageUrl || book.coverUrl || '';
  return `
    <article class="cert-card">
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

(async function init() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;
  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});
  const books = Array.isArray(data.content.books) ? data.content.books : [];
  const grid = document.getElementById('booksGrid');
  grid.innerHTML = books.length ? books.map((b) => bookTemplate(b)).join('') : '<article class="cert-card"><h3>No books yet</h3></article>';
})();

