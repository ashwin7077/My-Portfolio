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

function projectTemplate(project = {}, index = 0) {
  const image = project.imageUrl || project.coverUrl || '';
  return `
    <article class="project-card motion-rise" style="--delay:${Math.min(index, 8) * 70}ms">
      ${image ? `<img class="card-image" src="${image}" alt="${project.title || 'Project'} image" loading="lazy">` : ''}
      <div class="cert-head">
        <h3>${project.title || 'Untitled Project'}</h3>
        <span>${project.category || 'General'}</span>
      </div>
      <p><strong>Tech:</strong> ${project.tech || 'N/A'}</p>
      <p>${project.summary || ''}</p>
      ${project.descriptionHtml ? `<div class="project-long">${project.descriptionHtml}</div>` : ''}
      <div class="project-actions">
        ${project.repoUrl ? `<a class="btn ghost" href="${project.repoUrl}" target="_blank" rel="noreferrer">GitHub</a>` : ''}
        ${project.demoUrl ? `<a class="btn ghost" href="${project.demoUrl}" target="_blank" rel="noreferrer">Live Demo</a>` : ''}
      </div>
    </article>
  `;
}

(async function init() {
  const res = await fetch('/api/content');
  const data = await res.json();
  if (!res.ok || !data.ok) return;
  applyTheme(data.content.theme || {});
  setBrand(data.content.profile || {});
  const projects = Array.isArray(data.content.projects) ? data.content.projects : [];
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = projects.length ? projects.map((p, index) => projectTemplate(p, index)).join('') : '<article class="project-card"><h3>No projects yet</h3></article>';
})();

