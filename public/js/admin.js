const refs = {
  loginSection: document.getElementById('loginSection'),
  editorSection: document.getElementById('editorSection'),
  lockedSection: document.getElementById('lockedSection'),
  adminUsername: document.getElementById('adminUsername'),
  adminPassword: document.getElementById('adminPassword'),
  loginBtn: document.getElementById('loginBtn'),
  loginStatus: document.getElementById('loginStatus'),
  reloginBtn: document.getElementById('reloginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  name: document.getElementById('name'),
  role: document.getElementById('role'),
  niche: document.getElementById('niche'),
  bio: document.getElementById('bio'),
  logoText: document.getElementById('logoText'),
  logoImageUrl: document.getElementById('logoImageUrl'),
  logoImageFile: document.getElementById('logoImageFile'),
  uploadLogoBtn: document.getElementById('uploadLogoBtn'),
  location: document.getElementById('location'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  profileImageUrl: document.getElementById('profileImageUrl'),
  profileImageFile: document.getElementById('profileImageFile'),
  uploadProfileBtn: document.getElementById('uploadProfileBtn'),
  profileAudioUrl: document.getElementById('profileAudioUrl'),
  profileVideoUrl: document.getElementById('profileVideoUrl'),
  cvUrl: document.getElementById('cvUrl'),
  themeBg: document.getElementById('themeBg'),
  themeBgHex: document.getElementById('themeBgHex'),
  themeSurface: document.getElementById('themeSurface'),
  themeSurfaceHex: document.getElementById('themeSurfaceHex'),
  themeText: document.getElementById('themeText'),
  themeTextHex: document.getElementById('themeTextHex'),
  themeMuted: document.getElementById('themeMuted'),
  themeMutedHex: document.getElementById('themeMutedHex'),
  themeAccent: document.getElementById('themeAccent'),
  themeAccentHex: document.getElementById('themeAccentHex'),
  themeLine: document.getElementById('themeLine'),
  themeLineHex: document.getElementById('themeLineHex'),
  themePreview: document.getElementById('themePreview'),
  ctaLabel: document.getElementById('ctaLabel'),
  ctaLink: document.getElementById('ctaLink'),
  credibilityContainer: document.getElementById('credibilityContainer'),
  technicalSkillsContainer: document.getElementById('technicalSkillsContainer'),
  softSkillsContainer: document.getElementById('softSkillsContainer'),
  socialsContainer: document.getElementById('socialsContainer'),
  experienceContainer: document.getElementById('experienceContainer'),
  certificationsContainer: document.getElementById('certificationsContainer'),
  bookCategoriesContainer: document.getElementById('bookCategoriesContainer'),
  projectCategoriesContainer: document.getElementById('projectCategoriesContainer'),
  booksContainer: document.getElementById('booksContainer'),
  blogsContainer: document.getElementById('blogsContainer'),
  projectsContainer: document.getElementById('projectsContainer'),
  searchCertifications: document.getElementById('searchCertifications'),
  searchBooks: document.getElementById('searchBooks'),
  searchBlogsPosts: document.getElementById('searchBlogsPosts'),
  searchProjects: document.getElementById('searchProjects'),
  expandCertifications: document.getElementById('expandCertifications'),
  collapseCertifications: document.getElementById('collapseCertifications'),
  expandBooks: document.getElementById('expandBooks'),
  collapseBooks: document.getElementById('collapseBooks'),
  expandBlogs: document.getElementById('expandBlogs'),
  collapseBlogs: document.getElementById('collapseBlogs'),
  expandProjects: document.getElementById('expandProjects'),
  collapseProjects: document.getElementById('collapseProjects'),
  addBookCategory: document.getElementById('addBookCategory'),
  addProjectCategory: document.getElementById('addProjectCategory'),
  kpiProjects: document.getElementById('kpiProjects'),
  kpiBooks: document.getElementById('kpiBooks'),
  kpiBlogs: document.getElementById('kpiBlogs'),
  kpiCertifications: document.getElementById('kpiCertifications'),
  kpiExperience: document.getElementById('kpiExperience'),
  saveBtn: document.getElementById('saveBtn'),
  status: document.getElementById('status'),
  toastStack: document.getElementById('toastStack')
};

let isEditorDirty = false;
let isSaveInFlight = false;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setView(mode) {
  refs.loginSection.classList.toggle('hidden', mode !== 'login');
  refs.editorSection.classList.toggle('hidden', mode !== 'editor');
  refs.lockedSection.classList.toggle('hidden', mode !== 'locked');
}

function setLoginStatus(message = '') {
  refs.loginStatus.textContent = message;
}

function showToast(message, tone = 'info') {
  if (!refs.toastStack || !message) return;
  const toast = document.createElement('div');
  toast.className = `toast ${tone}`;
  toast.textContent = message;
  refs.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function setEditorStatus(message = '', tone = 'info', withToast = false) {
  if (refs.status) {
    refs.status.textContent = message;
    refs.status.dataset.tone = tone;
  }
  if (withToast && message) {
    showToast(message, tone);
  }
}

function setSaveButtonState() {
  if (!refs.saveBtn) return;
  refs.saveBtn.disabled = isSaveInFlight;
  refs.saveBtn.textContent = isSaveInFlight
    ? 'Publishing...'
    : (isEditorDirty ? 'Publish Site *' : 'Publish Site');
  refs.saveBtn.classList.toggle('is-dirty', isEditorDirty && !isSaveInFlight);
}

function markEditorDirty(value = true) {
  if (value && !isEditorDirty) {
    setEditorStatus('You have unsaved changes.', 'info');
  }
  isEditorDirty = value;
  setSaveButtonState();
}

async function requestJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const hasFormData = options.body instanceof FormData;
  if (!hasFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { ok: false, message: 'Invalid server response' };
  }
  return { response, data };
}

async function checkSession() {
  const { data } = await requestJson('/api/admin/session', { method: 'GET' });
  return Boolean(data.authenticated);
}

async function fetchContent() {
  const { response, data } = await requestJson('/api/admin/content', { method: 'GET' });

  if (!response.ok || !data.ok) {
    const error = new Error(data.message || 'Unable to load content');
    error.status = response.status;
    throw error;
  }

  return data.content;
}

function normalizeBlocks(blocks, fallbackText = '') {
  if (Array.isArray(blocks) && blocks.length) {
    return blocks
      .map((block) => {
        const type = block?.type === 'image' ? 'image' : 'paragraph';
        if (type === 'image') {
          return { type, url: String(block.url || '').trim(), alt: String(block.alt || '').trim() };
        }
        return { type, text: String(block.text || '').trim() };
      })
      .filter((block) => (block.type === 'image' ? block.url : block.text));
  }

  return String(fallbackText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }));
}

function normalizeImageUrl(value = '') {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('/')) return url;
  return '';
}

function managedEditor(title = 'Item', badge = '', imageUrl = '') {
  const wrapper = document.createElement('details');
  wrapper.className = 'project-editor managed-item';
  wrapper.draggable = true;
  wrapper.innerHTML = `
    <summary class="editor-summary">
      <span class="editor-summary-main">
        <img class="editor-summary-thumb" alt="" src="${escapeHtml(normalizeImageUrl(imageUrl) || '/profile.png')}">
        <span class="editor-summary-text">
          <span class="editor-summary-title">${escapeHtml(title)}</span>
          <span class="editor-summary-hint">Drag to reorder</span>
        </span>
      </span>
      <span class="editor-summary-badge">${escapeHtml(badge || 'Item')}</span>
    </summary>
    <div class="editor-body"></div>
  `;
  return wrapper;
}

function setManagedSummary(wrapper, title, badge, imageUrl = '') {
  const titleNode = wrapper.querySelector('.editor-summary-title');
  const badgeNode = wrapper.querySelector('.editor-summary-badge');
  const thumbNode = wrapper.querySelector('.editor-summary-thumb');
  if (titleNode) titleNode.textContent = title || 'Untitled';
  if (badgeNode) badgeNode.textContent = badge || 'Item';
  if (thumbNode) {
    thumbNode.src = normalizeImageUrl(imageUrl) || '/profile.png';
  }
}

function createBlockItem(block = {}, type = 'paragraph') {
  const item = document.createElement('div');
  item.className = 'block-item';
  item.dataset.type = type;
  item.innerHTML = `
    <div class="block-item-head">
      <span>${type}</span>
      <div class="section-tools">
        <button class="btn ghost block-up" type="button">Up</button>
        <button class="btn ghost block-down" type="button">Down</button>
        <button class="btn ghost block-remove" type="button">Remove</button>
      </div>
    </div>
  `;

  if (type === 'paragraph') {
    const area = document.createElement('textarea');
    area.className = 'block-text';
    area.rows = 3;
    area.value = block.text || '';
    item.appendChild(area);
  } else {
    const wrap = document.createElement('div');
    wrap.className = 'upload-row';
    wrap.innerHTML = `
      <input class="block-image-url" type="text" placeholder="https://.../image.jpg" value="${escapeHtml(block.url || '')}">
      <input class="block-image-file" type="file" accept="image/*">
      <button class="btn ghost block-upload" type="button">Upload</button>
    `;
    const alt = document.createElement('input');
    alt.className = 'block-image-alt';
    alt.type = 'text';
    alt.placeholder = 'Alt text (optional)';
    alt.value = block.alt || '';
    item.appendChild(wrap);
    item.appendChild(alt);
  }

  return item;
}

function getBlocksFromEditor(editor) {
  if (!editor) return [];
  return [...editor.querySelectorAll('.block-item')]
    .map((item) => {
      const type = item.dataset.type;
      if (type === 'image') {
        const url = item.querySelector('.block-image-url')?.value.trim() || '';
        const alt = item.querySelector('.block-image-alt')?.value.trim() || '';
        return url ? { type: 'image', url, alt } : null;
      }
      const text = item.querySelector('.block-text')?.value.trim() || '';
      return text ? { type: 'paragraph', text } : null;
    })
    .filter(Boolean);
}

function mountBlockEditor(host, initialBlocks = [], uploadType = 'project') {
  if (!host) return;
  host.innerHTML = `
    <div class="block-editor">
      <div class="block-toolbar">
        <button class="btn ghost add-paragraph" type="button">+ Paragraph</button>
        <button class="btn ghost add-image" type="button">+ Image</button>
      </div>
      <div class="block-list"></div>
    </div>
  `;

  const list = host.querySelector('.block-list');
  const push = (block, type) => list.appendChild(createBlockItem(block, type));
  (initialBlocks || []).forEach((block) => push(block, block.type));

  host.querySelector('.add-paragraph').addEventListener('click', () => push({ text: '' }, 'paragraph'));
  host.querySelector('.add-image').addEventListener('click', () => push({ url: '' }, 'image'));

  host.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const item = target.closest('.block-item');
    if (!item) return;

    if (target.classList.contains('block-remove')) {
      item.remove();
      return;
    }
    if (target.classList.contains('block-up')) {
      const prev = item.previousElementSibling;
      if (prev) item.parentNode.insertBefore(item, prev);
      return;
    }
    if (target.classList.contains('block-down')) {
      const next = item.nextElementSibling;
      if (next) item.parentNode.insertBefore(next, item);
      return;
    }
    if (target.classList.contains('block-upload')) {
      const fileInput = item.querySelector('.block-image-file');
      const urlInput = item.querySelector('.block-image-url');
      const file = fileInput?.files?.[0];
      if (!file) {
        setEditorStatus('Choose an image file first.', 'error', true);
        return;
      }
      setEditorStatus('Uploading block image...', 'info');
      try {
        const url = await uploadImage(file, uploadType);
        urlInput.value = url;
        setEditorStatus('Block image uploaded.', 'success', true);
      } catch (error) {
        setEditorStatus(error.message, 'error', true);
      }
    }
  });
}

function setupSearchFilter(input, container) {
  if (!input || !container) return;
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    [...container.querySelectorAll('.managed-item')].forEach((item) => {
      const text = item.textContent.toLowerCase();
      item.classList.toggle('hidden', Boolean(query) && !text.includes(query));
    });
  });
}

function toggleAllManaged(container, open) {
  if (!container) return;
  [...container.querySelectorAll('.managed-item')].forEach((item) => {
    item.open = open;
  });
}

function setupManagedReorder(container) {
  if (!container) return;
  let dragging = null;

  container.addEventListener('dragstart', (event) => {
    const card = event.target.closest('.managed-item');
    if (!card) return;
    dragging = card;
    card.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
  });

  container.addEventListener('dragend', () => {
    if (dragging) dragging.classList.remove('dragging');
    dragging = null;
  });

  container.addEventListener('dragover', (event) => {
    if (!dragging) return;
    event.preventDefault();
    const after = [...container.querySelectorAll('.managed-item:not(.dragging)')]
      .find((node) => event.clientY < node.getBoundingClientRect().top + (node.offsetHeight / 2));
    if (!after) {
      container.appendChild(dragging);
      return;
    }
    container.insertBefore(dragging, after);
  });
}

function setupClusterNavigation() {
  const links = [...document.querySelectorAll('.cluster-link')];
  const sections = links
    .map((link) => document.getElementById(link.dataset.target))
    .filter(Boolean);
  const dashboard = document.getElementById('admin-dashboard');
  const allPanels = [dashboard, ...sections].filter(Boolean);
  const panelById = new Map(allPanels.map((panel) => [panel.id, panel]));
  const firstTarget = links[0]?.dataset.target || 'admin-dashboard';

  const activate = (id) => {
    allPanels.forEach((panel) => panel.classList.toggle('hidden', panel.id !== id));
    links.forEach((link) => link.classList.toggle('active', link.dataset.target === id));
  };

  links.forEach((link) => {
    link.addEventListener('click', () => {
      if (!panelById.has(link.dataset.target)) return;
      activate(link.dataset.target);
    });
  });

  activate(firstTarget);
  return activate;
}

function categoryRow(value = '', valueClass = 'book-category-value') {
  const row = document.createElement('div');
  row.className = 'item-row';
  row.innerHTML = `
    <input class="${valueClass}" type="text" value="${escapeHtml(value)}" placeholder="Category name">
    <div class="section-tools">
      <button class="btn ghost cat-up" type="button">Up</button>
      <button class="btn ghost cat-down" type="button">Down</button>
      <button class="btn ghost cat-remove" type="button">Remove</button>
    </div>
  `;

  row.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.classList.contains('cat-remove')) {
      row.remove();
      return;
    }
    if (target.classList.contains('cat-up')) {
      const prev = row.previousElementSibling;
      if (prev) row.parentNode.insertBefore(row, prev);
      return;
    }
    if (target.classList.contains('cat-down')) {
      const next = row.nextElementSibling;
      if (next) row.parentNode.insertBefore(next, row);
    }
  });

  return row;
}

function getBookCategories() {
  return [...refs.bookCategoriesContainer.querySelectorAll('.book-category-value')]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function getProjectCategories() {
  return [...refs.projectCategoriesContainer.querySelectorAll('.project-category-value')]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function refreshCategorySelects() {
  const bookCategories = getBookCategories();
  const projectCategories = getProjectCategories();

  refs.booksContainer.querySelectorAll('.b-category').forEach((select) => {
    const current = select.value;
    select.innerHTML = buildCategoryOptions(bookCategories, current);
  });

  refs.projectsContainer.querySelectorAll('.p-category').forEach((select) => {
    const current = select.value;
    select.innerHTML = buildCategoryOptions(projectCategories, current);
  });
}

function buildCategoryOptions(categories = [], selected = '') {
  const list = categories.length ? [...categories] : ['General'];
  if (selected && !list.includes(selected)) {
    list.push(selected);
  }
  return list.map((category) => {
    const active = category === selected ? 'selected' : '';
    return `<option value="${escapeHtml(category)}" ${active}>${escapeHtml(category)}</option>`;
  }).join('');
}

function setupRichEditor(wrapper, initialValue = '') {
  if (!wrapper) return;
  wrapper.innerHTML = `
    <div class="rich-toolbar">
      <button type="button" class="btn ghost" data-cmd="bold">B</button>
      <button type="button" class="btn ghost" data-cmd="italic">I</button>
      <button type="button" class="btn ghost" data-cmd="underline">U</button>
      <button type="button" class="btn ghost" data-cmd="insertUnorderedList">• List</button>
      <button type="button" class="btn ghost" data-cmd="insertOrderedList">1. List</button>
      <button type="button" class="btn ghost" data-cmd="createLink">Link</button>
      <button type="button" class="btn ghost" data-cmd="removeFormat">Clear</button>
    </div>
    <div class="rich-editor" contenteditable="true"></div>
  `;

  const editor = wrapper.querySelector('.rich-editor');
  editor.innerHTML = initialValue || '';
  wrapper.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const cmd = target.dataset.cmd;
    if (!cmd) return;
    editor.focus();
    if (cmd === 'createLink') {
      const url = window.prompt('Enter URL');
      if (!url) return;
      document.execCommand('createLink', false, url);
      return;
    }
    document.execCommand(cmd, false, null);
  });
}

function getRichEditorValue(host) {
  const editor = host?.querySelector('.rich-editor');
  return editor ? editor.innerHTML.trim() : '';
}

function updateDashboardStats(payload) {
  if (refs.kpiProjects) refs.kpiProjects.textContent = String(payload.projects.length);
  if (refs.kpiBooks) refs.kpiBooks.textContent = String(payload.books.length);
  if (refs.kpiBlogs) refs.kpiBlogs.textContent = String((payload.blogs || []).length);
  if (refs.kpiCertifications) refs.kpiCertifications.textContent = String(payload.certifications.length);
  if (refs.kpiExperience) refs.kpiExperience.textContent = String(payload.experience.length);
}

function rowInput(value = '', placeholder = 'Value') {
  const row = document.createElement('div');
  row.className = 'item-row';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove';
  remove.addEventListener('click', () => row.remove());

  row.append(input, remove);
  return row;
}

function credibilityRow(item = {}) {
  const row = document.createElement('div');
  row.className = 'project-editor';
  row.innerHTML = `
    <div class="grid">
      <label class="field"><span>Label</span><input class="cred-label" type="text" value="${escapeHtml(item.label || '')}" placeholder="CTF"></label>
      <label class="field"><span>Value</span><input class="cred-value" type="number" value="${Number(item.value || 0)}" min="0" step="1"></label>
    </div>
  `;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Metric';
  remove.addEventListener('click', () => row.remove());
  row.appendChild(remove);
  return row;
}

function socialRow(social = {}) {
  const row = document.createElement('div');
  row.className = 'project-editor';
  row.innerHTML = `
    <div class="grid">
      <label class="field"><span>Platform</span><input class="social-platform" type="text" value="${escapeHtml(social.platform || '')}"></label>
      <label class="field"><span>URL</span><input class="social-url" type="text" value="${escapeHtml(social.url || '')}"></label>
    </div>
  `;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Link';
  remove.addEventListener('click', () => row.remove());

  row.appendChild(remove);
  return row;
}

function experienceCard(experience = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'project-editor';
  wrapper.innerHTML = `
    <div class="grid">
      <label class="field"><span>Role</span><input class="e-role" type="text" value="${escapeHtml(experience.role || '')}"></label>
      <label class="field"><span>Company</span><input class="e-company" type="text" value="${escapeHtml(experience.company || '')}"></label>
      <label class="field"><span>Period</span><input class="e-period" type="text" value="${escapeHtml(experience.period || '')}" placeholder="e.g. 2023 - Present"></label>
      <label class="field full"><span>Description</span><textarea class="e-description" rows="3">${escapeHtml(experience.description || '')}</textarea></label>
    </div>
  `;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Experience';
  remove.addEventListener('click', () => wrapper.remove());

  wrapper.appendChild(remove);
  return wrapper;
}

function certificationCard(certification = {}) {
  const certImage = certification.imageUrl || (Array.isArray(certification.imageUrls) ? certification.imageUrls[0] : '');
  const wrapper = managedEditor(certification.title || 'Certification', certification.category || 'cert', certImage || '');
  const body = wrapper.querySelector('.editor-body');
  body.innerHTML = `
    <div class="grid">
      <label class="field"><span>Certification Title</span><input class="c-title" type="text" value="${escapeHtml(certification.title || '')}"></label>
      <label class="field"><span>Category</span><input class="c-category" type="text" value="${escapeHtml(certification.category || '')}" placeholder="technical cert / soft skills cert / participation cert"></label>
      <label class="field"><span>Issuer</span><input class="c-issuer" type="text" value="${escapeHtml(certification.issuer || '')}"></label>
      <label class="field"><span>Date</span><input class="c-date" type="text" value="${escapeHtml(certification.date || certification.year || '')}" placeholder="2025 or Jan 2025"></label>
      <label class="field full"><span>Image URL</span><input class="c-image" type="text" value="${escapeHtml(certImage || '')}" placeholder="https://.../certificate.jpg"></label>
      <label class="field full"><span>Credential URL</span><input class="c-url" type="text" value="${escapeHtml(certification.credentialUrl || '')}" placeholder="https://..."></label>
    </div>
  `;

  const uploadBox = document.createElement('div');
  uploadBox.className = 'field upload-box full';
  uploadBox.innerHTML = `
    <span>Upload Certificate Image (or use URL above)</span>
    <div class="upload-row">
      <input class="c-image-file" type="file" accept="image/*">
      <button class="btn ghost c-upload-image" type="button">Upload Certificate Image</button>
    </div>
  `;
  body.appendChild(uploadBox);

  body.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('c-upload-image')) return;
    const fileInput = body.querySelector('.c-image-file');
    const urlInput = body.querySelector('.c-image');
    const file = fileInput?.files?.[0];
    if (!file) {
      setEditorStatus('Choose a certificate image first.', 'error', true);
      return;
    }
    setEditorStatus('Uploading certificate image...', 'info');
    try {
      const url = await uploadImage(file, 'certification');
      urlInput.value = url;
      setManagedSummary(
        wrapper,
        titleInput.value.trim() || 'Certification',
        categoryInput.value.trim() || 'cert',
        url
      );
      setEditorStatus('Certificate image uploaded.', 'success', true);
    } catch (error) {
      setEditorStatus(error.message, 'error', true);
    }
  });

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Certification';
  remove.addEventListener('click', () => wrapper.remove());

  body.appendChild(remove);
  const titleInput = body.querySelector('.c-title');
  const categoryInput = body.querySelector('.c-category');
  const imageInput = body.querySelector('.c-image');
  const refreshSummary = () => setManagedSummary(
    wrapper,
    titleInput.value.trim() || 'Certification',
    categoryInput.value.trim() || 'cert',
    imageInput.value.trim()
  );
  titleInput.addEventListener('input', refreshSummary);
  categoryInput.addEventListener('input', refreshSummary);
  imageInput.addEventListener('input', refreshSummary);
  wrapper.open = false;
  return wrapper;
}

function projectCard(project = {}) {
  const wrapper = managedEditor(project.title || 'Project', project.category || 'project', project.imageUrl || '');
  const categories = getProjectCategories();
  const body = wrapper.querySelector('.editor-body');
  body.innerHTML = `
    <div class="grid">
      <label class="field"><span>Title</span><input class="p-title" type="text" value="${escapeHtml(project.title || '')}"></label>
      <label class="field"><span>Category</span><select class="p-category">${buildCategoryOptions(categories, project.category || '')}</select></label>
      <label class="field"><span>Tech Stack</span><input class="p-tech" type="text" value="${escapeHtml(project.tech || '')}"></label>
      <label class="field"><span>GitHub Link</span><input class="p-repo" type="text" value="${escapeHtml(project.repoUrl || '')}"></label>
      <label class="field"><span>Demo Link (if available)</span><input class="p-demo" type="text" value="${escapeHtml(project.demoUrl || '')}"></label>
      <label class="field full"><span>A Short Summary</span><textarea class="p-summary" rows="3">${escapeHtml(project.summary || project.description || '')}</textarea></label>
      <label class="field full"><span>Detailed Description</span><div class="p-rich-editor"></div></label>
      <label class="field full"><span>Image URL</span><input class="p-image" type="text" value="${escapeHtml(project.imageUrl || '')}" placeholder="https://.../project.jpg"></label>
    </div>
  `;
  setupRichEditor(body.querySelector('.p-rich-editor'), project.descriptionHtml || '');

  const uploadBox = document.createElement('div');
  uploadBox.className = 'field upload-box full';
  uploadBox.innerHTML = `
    <span>Upload Project Image (or use URL above)</span>
    <div class="upload-row">
      <input class="p-image-file" type="file" accept="image/*">
      <button class="btn ghost p-upload-image" type="button">Upload Project Image</button>
    </div>
  `;
  body.appendChild(uploadBox);

  body.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('p-upload-image')) return;
    const fileInput = body.querySelector('.p-image-file');
    const urlInput = body.querySelector('.p-image');
    const file = fileInput?.files?.[0];
    if (!file) {
      setEditorStatus('Choose a project image first.', 'error', true);
      return;
    }
    setEditorStatus('Uploading project image...', 'info');
    try {
      const url = await uploadImage(file, 'project');
      urlInput.value = url;
      setManagedSummary(
        wrapper,
        titleInput.value.trim() || 'Project',
        categoryInput.value.trim() || 'project',
        url
      );
      setEditorStatus('Project image uploaded.', 'success', true);
    } catch (error) {
      setEditorStatus(error.message, 'error', true);
    }
  });

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Project';
  remove.addEventListener('click', () => wrapper.remove());

  body.appendChild(remove);
  const titleInput = body.querySelector('.p-title');
  const categoryInput = body.querySelector('.p-category');
  const imageInput = body.querySelector('.p-image');
  const refreshSummary = () => setManagedSummary(
    wrapper,
    titleInput.value.trim() || 'Project',
    categoryInput.value.trim() || 'project',
    imageInput.value.trim()
  );
  titleInput.addEventListener('input', refreshSummary);
  categoryInput.addEventListener('input', refreshSummary);
  imageInput.addEventListener('input', refreshSummary);
  wrapper.open = false;
  return wrapper;
}

function bookCard(book = {}) {
  const categories = getBookCategories();
  const bookImage = book.imageUrl || book.profileImageUrl || book.coverUrl || '';
  const wrapper = managedEditor(book.title || 'Book', book.category || 'book', bookImage);
  const body = wrapper.querySelector('.editor-body');
  body.innerHTML = `
    <div class="grid">
      <label class="field full"><span>Image Link</span><input class="b-image" type="text" value="${escapeHtml(bookImage)}" placeholder="https://.../book.jpg"></label>
      <label class="field"><span>Book Name</span><input class="b-title" type="text" value="${escapeHtml(book.title || '')}"></label>
      <label class="field"><span>Author</span><input class="b-author" type="text" value="${escapeHtml(book.author || '')}"></label>
      <label class="field"><span>Select Category</span><select class="b-category">${buildCategoryOptions(categories, book.category || '')}</select></label>
      <label class="field full"><span>Description</span><div class="b-rich-editor"></div></label>
      <div class="field upload-box">
        <span>Upload Book Image (or use URL above)</span>
        <div class="upload-row">
          <input class="b-image-file" type="file" accept="image/*">
          <button class="btn ghost b-upload-image" type="button">Upload Book Image</button>
        </div>
      </div>
    </div>
  `;
  setupRichEditor(body.querySelector('.b-rich-editor'), book.descriptionHtml || '');

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Book';
  remove.addEventListener('click', () => wrapper.remove());

  body.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('b-upload-image')) return;
    const fileInput = body.querySelector('.b-image-file');
    const urlInput = body.querySelector('.b-image');
    const file = fileInput?.files?.[0];
    if (!file) {
      setEditorStatus('Choose a book image first.', 'error', true);
      return;
    }
    setEditorStatus('Uploading book image...', 'info');
    try {
      const url = await uploadImage(file, 'book');
      urlInput.value = url;
      setManagedSummary(
        wrapper,
        titleInput.value.trim() || 'Book',
        categoryInput.value.trim() || 'book',
        url
      );
      setEditorStatus('Book image uploaded.', 'success', true);
    } catch (error) {
      setEditorStatus(error.message, 'error', true);
    }
  });

  body.appendChild(remove);
  const titleInput = body.querySelector('.b-title');
  const categoryInput = body.querySelector('.b-category');
  const imageInput = body.querySelector('.b-image');
  const refreshSummary = () => setManagedSummary(
    wrapper,
    titleInput.value.trim() || 'Book',
    categoryInput.value.trim() || 'book',
    imageInput.value.trim()
  );
  titleInput.addEventListener('input', refreshSummary);
  categoryInput.addEventListener('input', refreshSummary);
  imageInput.addEventListener('input', refreshSummary);
  wrapper.open = false;
  return wrapper;
}

function blogCard(blog = {}) {
  const wrapper = managedEditor(blog.title || 'Blog', 'blog', blog.imageUrl || '');
  const body = wrapper.querySelector('.editor-body');
  body.innerHTML = `
    <div class="grid">
      <label class="field full"><span>Image URL</span><input class="blog-image" type="text" value="${escapeHtml(blog.imageUrl || '')}" placeholder="https://.../blog.jpg"></label>
      <label class="field"><span>Blog Title</span><input class="blog-title" type="text" value="${escapeHtml(blog.title || '')}"></label>
      <label class="field"><span>Date</span><input class="blog-date" type="date" value="${escapeHtml(blog.date || '')}"></label>
      <label class="field full"><span>Excerpt</span><textarea class="blog-excerpt" rows="3" placeholder="Short preview shown on cards">${escapeHtml(blog.excerpt || '')}</textarea></label>
      <label class="field full"><span>External URL (optional)</span><input class="blog-url" type="text" value="${escapeHtml(blog.url || '')}" placeholder="https://..."></label>
      <div class="field upload-box">
        <span>Upload Blog Image (or use URL above)</span>
        <div class="upload-row">
          <input class="blog-image-file" type="file" accept="image/*">
          <button class="btn ghost blog-upload-image" type="button">Upload Blog Image</button>
        </div>
      </div>
    </div>
  `;

  body.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.classList.contains('blog-upload-image')) return;
    const fileInput = body.querySelector('.blog-image-file');
    const urlInput = body.querySelector('.blog-image');
    const file = fileInput?.files?.[0];
    if (!file) {
      setEditorStatus('Choose a blog image first.', 'error', true);
      return;
    }
    setEditorStatus('Uploading blog image...', 'info');
    try {
      const url = await uploadImage(file, 'blog');
      urlInput.value = url;
      setManagedSummary(wrapper, titleInput.value.trim() || 'Blog', 'blog', url);
      setEditorStatus('Blog image uploaded.', 'success', true);
    } catch (error) {
      setEditorStatus(error.message, 'error', true);
    }
  });

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Blog';
  remove.addEventListener('click', () => wrapper.remove());
  body.appendChild(remove);

  const titleInput = body.querySelector('.blog-title');
  const imageInput = body.querySelector('.blog-image');
  const refreshSummary = () => setManagedSummary(wrapper, titleInput.value.trim() || 'Blog', 'blog', imageInput.value.trim());
  titleInput.addEventListener('input', refreshSummary);
  imageInput.addEventListener('input', refreshSummary);
  wrapper.open = false;
  return wrapper;
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return { technical: skills, soft: [] };
  }

  return {
    technical: Array.isArray(skills?.technical) ? skills.technical : [],
    soft: Array.isArray(skills?.soft) ? skills.soft : []
  };
}

function normalizeHexColor(value, fallback) {
  const color = String(value || '').trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(color)) {
    return fallback;
  }
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return color;
}

function getThemeFromInputs() {
  return {
    bg: refs.themeBg.value,
    surface: refs.themeSurface.value,
    text: refs.themeText.value,
    muted: refs.themeMuted.value,
    accent: refs.themeAccent.value,
    line: refs.themeLine.value
  };
}

function syncThemeHexInputs(theme) {
  refs.themeBgHex.value = theme.bg;
  refs.themeSurfaceHex.value = theme.surface;
  refs.themeTextHex.value = theme.text;
  refs.themeMutedHex.value = theme.muted;
  refs.themeAccentHex.value = theme.accent;
  refs.themeLineHex.value = theme.line;
}

function applyThemePreview(theme) {
  if (!refs.themePreview) return;
  refs.themePreview.style.background = theme.surface;
  refs.themePreview.style.borderColor = theme.line;
  refs.themePreview.style.color = theme.text;

  const primary = refs.themePreview.querySelector('.btn.primary');
  if (primary) {
    primary.style.background = theme.accent;
    primary.style.color = '#ffffff';
  }

  const ghost = refs.themePreview.querySelector('.btn.ghost');
  if (ghost) {
    ghost.style.borderColor = theme.line;
    ghost.style.color = theme.text;
    ghost.style.background = 'transparent';
  }
}

function fillForm(content) {
  const { profile, socials, projects, certifications = [], experience = [], credibility = [], books = [], blogs = [], bookCategories = [], projectCategories = [] } = content;
  const skills = normalizeSkills(content.skills);
  const theme = {
    bg: normalizeHexColor(content.theme?.bg, '#080b14'),
    surface: normalizeHexColor(content.theme?.surface, '#101625'),
    text: normalizeHexColor(content.theme?.text, '#e9eefc'),
    muted: normalizeHexColor(content.theme?.muted, '#a9b3cc'),
    accent: normalizeHexColor(content.theme?.accent, '#4da3ff'),
    line: normalizeHexColor(content.theme?.line, '#2a3958')
  };

  refs.themeBg.value = theme.bg;
  refs.themeSurface.value = theme.surface;
  refs.themeText.value = theme.text;
  refs.themeMuted.value = theme.muted;
  refs.themeAccent.value = theme.accent;
  refs.themeLine.value = theme.line;
  syncThemeHexInputs(theme);
  applyThemePreview(theme);

  refs.name.value = profile.name || '';
  refs.role.value = profile.role || '';
  refs.niche.value = profile.niche || '';
  refs.bio.value = profile.bio || '';
  refs.logoText.value = profile.logoText || '';
  refs.logoImageUrl.value = profile.logoImageUrl || '';
  refs.location.value = profile.location || '';
  refs.email.value = profile.email || '';
  refs.phone.value = profile.phone || '';
  refs.profileImageUrl.value = profile.profileImageUrl || '';
  refs.profileAudioUrl.value = profile.profileAudioUrl || '';
  refs.profileVideoUrl.value = profile.profileVideoUrl || '';
  refs.cvUrl.value = profile.cvUrl || '';
  refs.ctaLabel.value = profile.ctaLabel || '';
  refs.ctaLink.value = profile.ctaLink || '';

  refs.credibilityContainer.innerHTML = '';
  (credibility || []).forEach((item) => refs.credibilityContainer.appendChild(credibilityRow(item)));

  refs.technicalSkillsContainer.innerHTML = '';
  skills.technical.forEach((skill) => refs.technicalSkillsContainer.appendChild(rowInput(skill, 'Technical skill')));

  refs.softSkillsContainer.innerHTML = '';
  skills.soft.forEach((skill) => refs.softSkillsContainer.appendChild(rowInput(skill, 'Soft skill')));

  refs.socialsContainer.innerHTML = '';
  (socials || []).forEach((social) => refs.socialsContainer.appendChild(socialRow(social)));

  refs.experienceContainer.innerHTML = '';
  (experience || []).forEach((item) => refs.experienceContainer.appendChild(experienceCard(item)));

  refs.certificationsContainer.innerHTML = '';
  (certifications || []).forEach((item) => refs.certificationsContainer.appendChild(certificationCard(item)));

  refs.booksContainer.innerHTML = '';
  (books || []).forEach((book) => refs.booksContainer.appendChild(bookCard(book)));

  refs.blogsContainer.innerHTML = '';
  (blogs || []).forEach((blog) => refs.blogsContainer.appendChild(blogCard(blog)));

  refs.bookCategoriesContainer.innerHTML = '';
  const categories = Array.isArray(bookCategories) && bookCategories.length
    ? bookCategories
    : [...new Set((books || []).map((b) => b.category).filter(Boolean))];
  categories.forEach((category) => refs.bookCategoriesContainer.appendChild(categoryRow(category)));

  refs.projectCategoriesContainer.innerHTML = '';
  const pCategories = Array.isArray(projectCategories) && projectCategories.length
    ? projectCategories
    : [...new Set((projects || []).map((p) => p.category).filter(Boolean))];
  pCategories.forEach((category) => refs.projectCategoriesContainer.appendChild(categoryRow(category, 'project-category-value')));

  refs.projectsContainer.innerHTML = '';
  (projects || []).forEach((project) => refs.projectsContainer.appendChild(projectCard(project)));
}

function getSkillValues(container) {
  return [...container.querySelectorAll('input')]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function getSocials() {
  return [...refs.socialsContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      platform: row.querySelector('.social-platform').value.trim(),
      url: row.querySelector('.social-url').value.trim()
    }))
    .filter((s) => s.platform || s.url);
}

function getCredibility() {
  return [...refs.credibilityContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      label: row.querySelector('.cred-label').value.trim(),
      value: Number(row.querySelector('.cred-value').value || 0)
    }))
    .filter((item) => item.label);
}

function getExperience() {
  return [...refs.experienceContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      role: row.querySelector('.e-role').value.trim(),
      company: row.querySelector('.e-company').value.trim(),
      period: row.querySelector('.e-period').value.trim(),
      description: row.querySelector('.e-description').value.trim()
    }))
    .filter((item) => item.role || item.company);
}

function getCertifications() {
  return [...refs.certificationsContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      title: row.querySelector('.c-title').value.trim(),
      category: row.querySelector('.c-category').value.trim(),
      issuer: row.querySelector('.c-issuer').value.trim(),
      date: row.querySelector('.c-date').value.trim(),
      imageUrl: row.querySelector('.c-image').value.trim(),
      credentialUrl: row.querySelector('.c-url').value.trim(),
    }))
    .filter((item) => item.title);
}

function getBooks() {
  return [...refs.booksContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      imageUrl: row.querySelector('.b-image').value.trim(),
      title: row.querySelector('.b-title').value.trim(),
      author: row.querySelector('.b-author').value.trim(),
      category: row.querySelector('.b-category').value.trim(),
      descriptionHtml: getRichEditorValue(row.querySelector('.b-rich-editor'))
    }))
    .filter((book) => book.title);
}

function getProjects() {
  return [...refs.projectsContainer.querySelectorAll('.project-editor')]
    .map((row, index) => ({
      id: String(index + 1),
      title: row.querySelector('.p-title').value.trim(),
      category: row.querySelector('.p-category').value.trim(),
      tech: row.querySelector('.p-tech').value.trim(),
      summary: row.querySelector('.p-summary').value.trim(),
      descriptionHtml: getRichEditorValue(row.querySelector('.p-rich-editor')),
      demoUrl: row.querySelector('.p-demo').value.trim(),
      repoUrl: row.querySelector('.p-repo').value.trim(),
      imageUrl: row.querySelector('.p-image').value.trim(),
    }))
    .filter((p) => p.title);
}

function getBlogs() {
  return [...refs.blogsContainer.querySelectorAll('.project-editor')]
    .map((row) => ({
      title: row.querySelector('.blog-title')?.value.trim() || '',
      date: row.querySelector('.blog-date')?.value.trim() || '',
      imageUrl: row.querySelector('.blog-image')?.value.trim() || '',
      excerpt: row.querySelector('.blog-excerpt')?.value.trim() || '',
      url: row.querySelector('.blog-url')?.value.trim() || ''
    }))
    .filter((blog) => blog.title);
}

function buildPayload() {
  return {
    credibility: getCredibility(),
    bookCategories: getBookCategories(),
    projectCategories: getProjectCategories(),
    theme: {
      bg: refs.themeBg.value,
      surface: refs.themeSurface.value,
      text: refs.themeText.value,
      muted: refs.themeMuted.value,
      accent: refs.themeAccent.value,
      line: refs.themeLine.value
    },
    profile: {
      name: refs.name.value.trim(),
      role: refs.role.value.trim(),
      niche: refs.niche.value.trim(),
      bio: refs.bio.value.trim(),
      logoText: refs.logoText.value.trim(),
      logoImageUrl: refs.logoImageUrl.value.trim(),
      location: refs.location.value.trim(),
      email: refs.email.value.trim(),
      phone: refs.phone.value.trim(),
      profileImageUrl: refs.profileImageUrl.value.trim(),
      profileAudioUrl: refs.profileAudioUrl.value.trim(),
      profileVideoUrl: refs.profileVideoUrl.value.trim(),
      cvUrl: refs.cvUrl.value.trim(),
      ctaLabel: refs.ctaLabel.value.trim(),
      ctaLink: refs.ctaLink.value.trim()
    },
    skills: {
      technical: getSkillValues(refs.technicalSkillsContainer),
      soft: getSkillValues(refs.softSkillsContainer)
    },
    socials: getSocials(),
    experience: getExperience(),
    certifications: getCertifications(),
    books: getBooks(),
    blogs: getBlogs(),
    projects: getProjects()
  };
}

async function saveContent() {
  if (isSaveInFlight) return;
  isSaveInFlight = true;
  setSaveButtonState();
  const payload = buildPayload();
  updateDashboardStats(payload);
  setEditorStatus('Publishing changes...', 'info');

  try {
    const { response, data } = await requestJson('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      setView('locked');
      return;
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Save failed');
    }

    markEditorDirty(false);
    setEditorStatus('Changes published successfully.', 'success', true);
  } catch (error) {
    setEditorStatus(error.message, 'error', true);
  } finally {
    isSaveInFlight = false;
    setSaveButtonState();
  }
}

async function uploadImage(file, type) {
  const body = new FormData();
  body.append('file', file);
  body.append('type', type);

  const { response, data } = await requestJson('/api/admin/upload-image', {
    method: 'POST',
    body
  });

  if (response.status === 401) {
    setView('locked');
    throw new Error('Session expired.');
  }

  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data.url;
}

async function handleUpload(fileInput, targetInput, type) {
  const file = fileInput.files?.[0];
  if (!file) {
    setEditorStatus('Choose an image first.', 'error', true);
    return;
  }

  setEditorStatus('Uploading image...', 'info');
  try {
    const url = await uploadImage(file, type);
    targetInput.value = url;
    setEditorStatus('Image uploaded successfully.', 'success', true);
  } catch (error) {
    setEditorStatus(error.message, 'error', true);
  }
}

async function login() {
  setLoginStatus('Checking credentials...');

  try {
    const { response, data } = await requestJson('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        username: refs.adminUsername.value.trim(),
        password: refs.adminPassword.value
      })
    });

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setLoginStatus('Login successful. Loading editor...');
    showToast('Login successful.', 'success');
    await loadEditor();
    refs.adminPassword.value = '';
  } catch (error) {
    setLoginStatus(error.message);
    showToast(error.message, 'error');
  }
}

async function logout() {
  if (isEditorDirty && !window.confirm('You have unsaved changes. Logout anyway?')) {
    return;
  }
  await requestJson('/api/admin/logout', { method: 'POST' });
  setView('login');
  markEditorDirty(false);
  setEditorStatus('', 'info');
  setLoginStatus('Logged out.');
  showToast('Logged out.', 'info');
}

async function loadEditor() {
  try {
    const content = await fetchContent();
    fillForm(content);
    setView('editor');
    markEditorDirty(false);
    setEditorStatus('Ready', 'info');
    setLoginStatus('');
  } catch (error) {
    if (error?.status === 401) {
      setView('locked');
      return;
    }

    setView('login');
    setLoginStatus(error?.message || 'Failed to load admin content.');
    showToast(error?.message || 'Failed to load admin content.', 'error');
  }
}

document.getElementById('addTechnicalSkill').addEventListener('click', () => {
  refs.technicalSkillsContainer.appendChild(rowInput('', 'Technical skill'));
});

document.getElementById('addCredibility').addEventListener('click', () => {
  refs.credibilityContainer.appendChild(credibilityRow({ label: '', value: 0 }));
});

document.getElementById('addSoftSkill').addEventListener('click', () => {
  refs.softSkillsContainer.appendChild(rowInput('', 'Soft skill'));
});

document.getElementById('addSocial').addEventListener('click', () => {
  refs.socialsContainer.appendChild(socialRow({}));
});

document.getElementById('addExperience').addEventListener('click', () => {
  refs.experienceContainer.appendChild(experienceCard({}));
});

document.getElementById('addCertification').addEventListener('click', () => {
  const item = certificationCard({});
  item.open = true;
  refs.certificationsContainer.appendChild(item);
  showToast('Certification added.', 'success');
});

document.getElementById('addBook').addEventListener('click', () => {
  const item = bookCard({});
  item.open = true;
  refs.booksContainer.appendChild(item);
  showToast('Book added.', 'success');
});

document.getElementById('addBlog').addEventListener('click', () => {
  const item = blogCard({});
  item.open = true;
  refs.blogsContainer.appendChild(item);
  showToast('Blog added.', 'success');
});

document.getElementById('addProject').addEventListener('click', () => {
  const item = projectCard({});
  item.open = true;
  refs.projectsContainer.appendChild(item);
  showToast('Project added.', 'success');
});

document.getElementById('saveBtn').addEventListener('click', saveContent);
refs.loginBtn.addEventListener('click', login);
refs.logoutBtn.addEventListener('click', logout);
refs.reloginBtn.addEventListener('click', () => setView('login'));
refs.adminPassword.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    login();
  }
});
refs.adminUsername.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    login();
  }
});

[
  refs.themeBg,
  refs.themeSurface,
  refs.themeText,
  refs.themeMuted,
  refs.themeAccent,
  refs.themeLine
].forEach((input) => {
  input.addEventListener('input', () => {
    const theme = getThemeFromInputs();
    syncThemeHexInputs(theme);
    applyThemePreview(theme);
  });
});

[
  [refs.themeBgHex, refs.themeBg],
  [refs.themeSurfaceHex, refs.themeSurface],
  [refs.themeTextHex, refs.themeText],
  [refs.themeMutedHex, refs.themeMuted],
  [refs.themeAccentHex, refs.themeAccent],
  [refs.themeLineHex, refs.themeLine]
].forEach(([hexInput, colorInput]) => {
  hexInput.addEventListener('input', () => {
    const value = normalizeHexColor(hexInput.value, colorInput.value);
    if (value !== colorInput.value) {
      colorInput.value = value;
      applyThemePreview(getThemeFromInputs());
    }
  });
  hexInput.addEventListener('blur', () => {
    hexInput.value = colorInput.value;
  });
});

refs.uploadProfileBtn.addEventListener('click', () => {
  handleUpload(refs.profileImageFile, refs.profileImageUrl, 'profile');
});

refs.uploadLogoBtn.addEventListener('click', () => {
  handleUpload(refs.logoImageFile, refs.logoImageUrl, 'logo');
});

refs.addBookCategory.addEventListener('click', () => {
  refs.bookCategoriesContainer.appendChild(categoryRow('', 'book-category-value'));
  refreshCategorySelects();
  showToast('Book category added.', 'info');
});

refs.addProjectCategory.addEventListener('click', () => {
  refs.projectCategoriesContainer.appendChild(categoryRow('', 'project-category-value'));
  refreshCategorySelects();
  showToast('Project category added.', 'info');
});

refs.editorSection.addEventListener('input', () => {
  markEditorDirty(true);
  updateDashboardStats(buildPayload());
  refreshCategorySelects();
});

refs.expandCertifications.addEventListener('click', () => toggleAllManaged(refs.certificationsContainer, true));
refs.collapseCertifications.addEventListener('click', () => toggleAllManaged(refs.certificationsContainer, false));
refs.expandBooks.addEventListener('click', () => toggleAllManaged(refs.booksContainer, true));
refs.collapseBooks.addEventListener('click', () => toggleAllManaged(refs.booksContainer, false));
refs.expandBlogs.addEventListener('click', () => toggleAllManaged(refs.blogsContainer, true));
refs.collapseBlogs.addEventListener('click', () => toggleAllManaged(refs.blogsContainer, false));
refs.expandProjects.addEventListener('click', () => toggleAllManaged(refs.projectsContainer, true));
refs.collapseProjects.addEventListener('click', () => toggleAllManaged(refs.projectsContainer, false));

setupSearchFilter(refs.searchCertifications, refs.certificationsContainer);
setupSearchFilter(refs.searchBooks, refs.booksContainer);
setupSearchFilter(refs.searchBlogsPosts, refs.blogsContainer);
setupSearchFilter(refs.searchProjects, refs.projectsContainer);
setupManagedReorder(refs.certificationsContainer);
setupManagedReorder(refs.booksContainer);
setupManagedReorder(refs.blogsContainer);
setupManagedReorder(refs.projectsContainer);
const activateEditorPanel = setupClusterNavigation();
document.querySelectorAll('.dashboard-link').forEach((button) => {
  button.addEventListener('click', () => {
    if (typeof activateEditorPanel === 'function') {
      activateEditorPanel(button.dataset.target);
    }
  });
});

window.addEventListener('beforeunload', (event) => {
  if (!isEditorDirty) return;
  event.preventDefault();
  event.returnValue = '';
});

window.addEventListener('keydown', (event) => {
  const isSaveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's';
  if (!isSaveShortcut) return;
  if (refs.editorSection.classList.contains('hidden')) return;
  event.preventDefault();
  saveContent();
});

(async function init() {
  try {
    const authenticated = await checkSession();
    if (!authenticated) {
      setView('login');
      return;
    }
    await loadEditor();
    updateDashboardStats(buildPayload());
  } catch {
    setView('login');
  }
})();
