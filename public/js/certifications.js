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

(async function init() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;
  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});
  const certifications = Array.isArray(data.content.certifications) ? data.content.certifications : [];
  const grid = document.getElementById('certificationsGrid');
  grid.innerHTML = certifications.length ? certifications.map((c) => certificationTemplate(c)).join('') : '<article class="cert-card"><h3>No certifications yet</h3></article>';
})();

