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

function blogTemplate(blog = {}, index = 0) {
  const image = blog.imageUrl || '';
  const date = blog.date
    ? new Date(blog.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Date not set';
  const title = blog.title || 'Untitled Blog';
  const excerpt = blog.excerpt || '';
  const openTag = blog.url
    ? `<a class="blog-card motion-rise" style="--delay:${Math.min(index, 10) * 65}ms" href="${blog.url}" target="_blank" rel="noreferrer">`
    : `<article class="blog-card motion-rise" style="--delay:${Math.min(index, 10) * 65}ms">`;
  const closeTag = blog.url ? '</a>' : '</article>';

  return `
    ${openTag}
      <div class="blog-meta">
        <h3 class="blog-title">${title}</h3>
        <p class="blog-date">${date}</p>
        ${excerpt ? `<p class="blog-excerpt">${excerpt}</p>` : ''}
      </div>
      <div class="blog-media">
        ${image ? `<img class="blog-img" src="${image}" alt="${title} image" loading="lazy">` : '<div class="blog-img blog-img-empty">No Image</div>'}
      </div>
    ${closeTag}
  `;
}

(async function init() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;
  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});
  const blogs = (Array.isArray(data.content.blogs) ? data.content.blogs : [])
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const grid = document.getElementById('blogsGrid');
  grid.innerHTML = blogs.length
    ? blogs.map((blog, index) => blogTemplate(blog, index)).join('')
    : '<article class="blog-card"><div class="blog-meta"><h3 class="blog-title">No blogs yet</h3><p class="blog-date">Add blogs to content source.</p></div></article>';
})();
