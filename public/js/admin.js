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
  bio: document.getElementById('bio'),
  location: document.getElementById('location'),
  email: document.getElementById('email'),
  phone: document.getElementById('phone'),
  profileImageUrl: document.getElementById('profileImageUrl'),
  profileAudioUrl: document.getElementById('profileAudioUrl'),
  profileVideoUrl: document.getElementById('profileVideoUrl'),
  ctaLabel: document.getElementById('ctaLabel'),
  ctaLink: document.getElementById('ctaLink'),
  technicalSkillsContainer: document.getElementById('technicalSkillsContainer'),
  softSkillsContainer: document.getElementById('softSkillsContainer'),
  socialsContainer: document.getElementById('socialsContainer'),
  experienceContainer: document.getElementById('experienceContainer'),
  certificationsContainer: document.getElementById('certificationsContainer'),
  projectsContainer: document.getElementById('projectsContainer'),
  status: document.getElementById('status')
};

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
  const wrapper = document.createElement('div');
  wrapper.className = 'project-editor';
  wrapper.innerHTML = `
    <div class="grid">
      <label class="field"><span>Certification Title</span><input class="c-title" type="text" value="${escapeHtml(certification.title || '')}"></label>
      <label class="field"><span>Issuer</span><input class="c-issuer" type="text" value="${escapeHtml(certification.issuer || '')}"></label>
      <label class="field"><span>Year</span><input class="c-year" type="text" value="${escapeHtml(certification.year || '')}"></label>
      <label class="field"><span>Credential URL</span><input class="c-url" type="text" value="${escapeHtml(certification.credentialUrl || '')}"></label>
    </div>
  `;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Certification';
  remove.addEventListener('click', () => wrapper.remove());

  wrapper.appendChild(remove);
  return wrapper;
}

function projectCard(project = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'project-editor';
  wrapper.innerHTML = `
    <div class="grid">
      <label class="field"><span>Title</span><input class="p-title" type="text" value="${escapeHtml(project.title || '')}"></label>
      <label class="field"><span>Tech Stack</span><input class="p-tech" type="text" value="${escapeHtml(project.tech || '')}"></label>
      <label class="field full"><span>Description</span><textarea class="p-description" rows="3">${escapeHtml(project.description || '')}</textarea></label>
      <label class="field"><span>Demo URL</span><input class="p-demo" type="text" value="${escapeHtml(project.demoUrl || '')}"></label>
      <label class="field"><span>Repository URL</span><input class="p-repo" type="text" value="${escapeHtml(project.repoUrl || '')}"></label>
      <label class="field"><span>Image URL</span><input class="p-image" type="text" value="${escapeHtml(project.imageUrl || '')}"></label>
      <label class="field"><span>Featured</span><input class="p-featured" type="checkbox" ${project.featured ? 'checked' : ''}></label>
    </div>
  `;

  const remove = document.createElement('button');
  remove.className = 'btn ghost';
  remove.type = 'button';
  remove.textContent = 'Remove Project';
  remove.addEventListener('click', () => wrapper.remove());

  wrapper.appendChild(remove);
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

function fillForm(content) {
  const { profile, socials, projects, certifications = [], experience = [] } = content;
  const skills = normalizeSkills(content.skills);

  refs.name.value = profile.name || '';
  refs.role.value = profile.role || '';
  refs.bio.value = profile.bio || '';
  refs.location.value = profile.location || '';
  refs.email.value = profile.email || '';
  refs.phone.value = profile.phone || '';
  refs.profileImageUrl.value = profile.profileImageUrl || '';
  refs.profileAudioUrl.value = profile.profileAudioUrl || '';
  refs.profileVideoUrl.value = profile.profileVideoUrl || '';
  refs.ctaLabel.value = profile.ctaLabel || '';
  refs.ctaLink.value = profile.ctaLink || '';

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
      issuer: row.querySelector('.c-issuer').value.trim(),
      year: row.querySelector('.c-year').value.trim(),
      credentialUrl: row.querySelector('.c-url').value.trim()
    }))
    .filter((item) => item.title);
}

function getProjects() {
  return [...refs.projectsContainer.querySelectorAll('.project-editor')]
    .map((row, index) => ({
      id: String(index + 1),
      title: row.querySelector('.p-title').value.trim(),
      description: row.querySelector('.p-description').value.trim(),
      tech: row.querySelector('.p-tech').value.trim(),
      demoUrl: row.querySelector('.p-demo').value.trim(),
      repoUrl: row.querySelector('.p-repo').value.trim(),
      imageUrl: row.querySelector('.p-image').value.trim(),
      featured: row.querySelector('.p-featured').checked
    }))
    .filter((p) => p.title);
}

function buildPayload() {
  return {
    profile: {
      name: refs.name.value.trim(),
      role: refs.role.value.trim(),
      bio: refs.bio.value.trim(),
      location: refs.location.value.trim(),
      email: refs.email.value.trim(),
      phone: refs.phone.value.trim(),
      profileImageUrl: refs.profileImageUrl.value.trim(),
      profileAudioUrl: refs.profileAudioUrl.value.trim(),
      profileVideoUrl: refs.profileVideoUrl.value.trim(),
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
    projects: getProjects()
  };
}

async function saveContent() {
  refs.status.textContent = 'Saving...';

  try {
    const { response, data } = await requestJson('/api/admin/content', {
      method: 'PUT',
      body: JSON.stringify(buildPayload())
    });

    if (response.status === 401) {
      setView('locked');
      return;
    }

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Save failed');
    }

    refs.status.textContent = 'Saved successfully.';
  } catch (error) {
    refs.status.textContent = error.message;
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
    await loadEditor();
    refs.adminPassword.value = '';
  } catch (error) {
    setLoginStatus(error.message);
  }
}

async function logout() {
  await requestJson('/api/admin/logout', { method: 'POST' });
  setView('login');
  refs.status.textContent = '';
  setLoginStatus('Logged out.');
}

async function loadEditor() {
  try {
    const content = await fetchContent();
    fillForm(content);
    setView('editor');
    refs.status.textContent = '';
    setLoginStatus('');
  } catch (error) {
    if (error?.status === 401) {
      setView('locked');
      return;
    }

    setView('login');
    setLoginStatus(error?.message || 'Failed to load admin content.');
  }
}

document.getElementById('addTechnicalSkill').addEventListener('click', () => {
  refs.technicalSkillsContainer.appendChild(rowInput('', 'Technical skill'));
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
  refs.certificationsContainer.appendChild(certificationCard({}));
});

document.getElementById('addProject').addEventListener('click', () => {
  refs.projectsContainer.appendChild(projectCard({}));
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

(async function init() {
  try {
    const authenticated = await checkSession();
    if (!authenticated) {
      setView('login');
      return;
    }
    await loadEditor();
  } catch {
    setView('login');
  }
})();
