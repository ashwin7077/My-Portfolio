const admin = require('firebase-admin');
const crypto = require('crypto');

const COLLECTION = 'portfolio';
const DOC = 'siteContent';

const defaultContent = {
  projectCategories: ['Cybersecurity', 'Web Security', 'Forensics', 'Tools'],
  bookCategories: ['Security', 'Psychology', 'Productivity', 'Networking'],
  credibility: [
    { label: 'CTF', value: 4 },
    { label: 'Bug Bounty', value: 3 },
    { label: 'Forensics', value: 5 },
    { label: 'Projects', value: 1 }
  ],
  theme: {
    bg: '#080b14',
    surface: '#101625',
    text: '#e9eefc',
    muted: '#a9b3cc',
    accent: '#4da3ff',
    line: '#2a3958'
  },
  profile: {
    name: 'Aswin Paudel',
    role: 'Cybersecurity Engineer',
    niche: 'Web Security, CTF, Digital Forensics',
    bio: 'I build secure web products and solve real-world offensive and defensive security challenges.',
    logoText: 'AP',
    logoImageUrl: '',
    location: 'United States',
    email: 'aswin@example.com',
    phone: '+1 (000) 000-0000',
    profileImageUrl: '',
    profileAudioUrl: '',
    profileVideoUrl: '',
    cvUrl: '',
    ctaLabel: 'Let\'s Build Together',
    ctaLink: 'mailto:aswin@example.com'
  },
  socials: [
    { platform: 'GitHub', url: 'https://github.com/' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/' }
  ],
  skills: {
    technical: ['Next.js', 'Node.js', 'Firebase', 'Web Security', 'CTF'],
    soft: ['Communication', 'Team Collaboration', 'Problem Solving']
  },
  certifications: [
    {
      title: 'Meta Front-End Developer',
      category: 'technical cert',
      issuer: 'Meta',
      date: '2025',
      imageUrl: '',
      credentialUrl: '',
    }
  ],
  experience: [
    {
      role: 'Cybersecurity Engineer',
      company: 'Freelance',
      period: '2024 - Present',
      description: 'Delivered secure applications, penetration testing workflows, and forensics-driven reporting for clients.'
    }
  ],
  projects: [
    {
      id: '1',
      title: 'CTF Ops Dashboard',
      category: 'cybersecurity',
      tech: 'Next.js, Node.js, Firebase',
      summary: 'A focused dashboard for offensive security workflows.',
      descriptionHtml: '<p>Built a focused dashboard to track CTF workflows and security tasks.</p>',
      demoUrl: 'https://example.com',
      repoUrl: 'https://github.com/',
      imageUrl: '',
    }
  ],
  books: [
    {
      imageUrl: '',
      title: 'The Web Application Hacker\'s Handbook',
      author: 'Dafydd Stuttard, Marcus Pinto',
      category: 'Security',
      descriptionHtml: '<p>Practical methodology for finding and exploiting web vulnerabilities.</p>',
    }
  ]
};

function sanitizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

function sanitizeColor(value, fallback) {
  const color = String(value || '').trim();
  const isSafeColor = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
  return isSafeColor ? color : fallback;
}

function normalizeTheme(theme = {}) {
  const source = theme && typeof theme === 'object' ? theme : {};
  return {
    bg: sanitizeColor(source.bg, defaultContent.theme.bg),
    surface: sanitizeColor(source.surface, defaultContent.theme.surface),
    text: sanitizeColor(source.text, defaultContent.theme.text),
    muted: sanitizeColor(source.muted, defaultContent.theme.muted),
    accent: sanitizeColor(source.accent, defaultContent.theme.accent),
    line: sanitizeColor(source.line, defaultContent.theme.line)
  };
}

function normalizeSkills(skills) {
  if (Array.isArray(skills)) {
    return {
      technical: skills.map((s) => String(s).trim()).filter(Boolean),
      soft: []
    };
  }

  const technical = sanitizeList(skills?.technical).map((s) => String(s).trim()).filter(Boolean);
  const soft = sanitizeList(skills?.soft).map((s) => String(s).trim()).filter(Boolean);
  return { technical, soft };
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }

  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeMediaList(values) {
  if (Array.isArray(values)) {
    return values.map((v) => String(v).trim()).filter(Boolean);
  }

  return String(values || '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
}

function normalizeContentBlocks(values, fallbackText = '') {
  if (Array.isArray(values) && values.length) {
    return values
      .map((item) => {
        const type = item?.type === 'image' ? 'image' : 'paragraph';
        if (type === 'image') {
          return {
            type,
            url: String(item.url || '').trim(),
            alt: String(item.alt || '').trim()
          };
        }
        return {
          type,
          text: String(item.text || '').trim()
        };
      })
      .filter((item) => (item.type === 'image' ? item.url : item.text));
  }

  return String(fallbackText || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }));
}

function normalizeCredibility(values) {
  return sanitizeList(values).map((item) => ({
    label: String(item.label || '').trim(),
    value: Number.isFinite(Number(item.value)) ? Number(item.value) : 0
  })).filter((item) => item.label);
}

function normalizeCategories(values) {
  return sanitizeList(values).map((v) => String(v).trim()).filter(Boolean);
}

function sanitizeContent(content = {}) {
  const profile = content.profile || {};
  const skills = normalizeSkills(content.skills);
  const theme = normalizeTheme(content.theme);

  return {
    projectCategories: normalizeCategories(content.projectCategories),
    bookCategories: normalizeCategories(content.bookCategories),
    credibility: normalizeCredibility(content.credibility),
    theme,
    profile: {
      name: String(profile.name || '').trim(),
      role: String(profile.role || '').trim(),
      niche: String(profile.niche || '').trim(),
      bio: String(profile.bio || '').trim(),
      logoText: String(profile.logoText || '').trim(),
      logoImageUrl: String(profile.logoImageUrl || '').trim(),
      location: String(profile.location || '').trim(),
      email: String(profile.email || '').trim(),
      phone: String(profile.phone || '').trim(),
      profileImageUrl: String(profile.profileImageUrl || '').trim(),
      profileAudioUrl: String(profile.profileAudioUrl || '').trim(),
      profileVideoUrl: String(profile.profileVideoUrl || '').trim(),
      cvUrl: String(profile.cvUrl || '').trim(),
      ctaLabel: String(profile.ctaLabel || '').trim(),
      ctaLink: String(profile.ctaLink || '').trim()
    },
    socials: sanitizeList(content.socials).map((s) => ({
      platform: String(s.platform || '').trim(),
      url: String(s.url || '').trim()
    })).filter((s) => s.platform || s.url),
    skills: {
      technical: skills.technical,
      soft: skills.soft
    },
    certifications: sanitizeList(content.certifications).map((item) => ({
      title: String(item.title || '').trim(),
      category: String(item.category || '').trim(),
      issuer: String(item.issuer || '').trim(),
      date: String(item.date || item.year || '').trim(),
      imageUrl: String(item.imageUrl || (Array.isArray(item.imageUrls) ? item.imageUrls[0] : '') || '').trim(),
      credentialUrl: String(item.credentialUrl || '').trim(),
    })).filter((item) => item.title),
    experience: sanitizeList(content.experience).map((item) => ({
      role: String(item.role || '').trim(),
      company: String(item.company || '').trim(),
      period: String(item.period || '').trim(),
      description: String(item.description || '').trim()
    })).filter((item) => item.role || item.company),
    projects: sanitizeList(content.projects).map((p, index) => ({
      id: String(p.id || index + 1),
      title: String(p.title || '').trim(),
      category: String(p.category || '').trim(),
      tech: String(p.tech || '').trim(),
      summary: String(p.summary || p.description || '').trim(),
      descriptionHtml: String(p.descriptionHtml || '').trim(),
      demoUrl: String(p.demoUrl || '').trim(),
      repoUrl: String(p.repoUrl || '').trim(),
      imageUrl: String(p.imageUrl || '').trim(),
    })).filter((p) => p.title),
    books: sanitizeList(content.books).map((book) => ({
      imageUrl: String(book.imageUrl || book.profileImageUrl || book.coverUrl || '').trim(),
      title: String(book.title || '').trim(),
      author: String(book.author || '').trim(),
      category: String(book.category || '').trim(),
      descriptionHtml: String(book.descriptionHtml || '').trim(),
    })).filter((book) => book.title)
  };
}

function withDefaults(content) {
  const normalizedSkills = normalizeSkills(content.skills);
  const normalizedTheme = normalizeTheme(content.theme);
  return {
    ...defaultContent,
    ...content,
    projectCategories: normalizeCategories(content.projectCategories).length ? normalizeCategories(content.projectCategories) : defaultContent.projectCategories,
    bookCategories: normalizeCategories(content.bookCategories).length ? normalizeCategories(content.bookCategories) : defaultContent.bookCategories,
    credibility: normalizeCredibility(content.credibility).length ? normalizeCredibility(content.credibility) : defaultContent.credibility,
    theme: { ...defaultContent.theme, ...normalizedTheme },
    profile: { ...defaultContent.profile, ...(content.profile || {}) },
    socials: sanitizeList(content.socials).length ? content.socials : defaultContent.socials,
    skills: {
      technical: normalizedSkills.technical.length ? normalizedSkills.technical : defaultContent.skills.technical,
      soft: normalizedSkills.soft.length ? normalizedSkills.soft : defaultContent.skills.soft
    },
    certifications: sanitizeList(content.certifications).length ? content.certifications : defaultContent.certifications,
    experience: sanitizeList(content.experience).length ? content.experience : defaultContent.experience,
    projects: sanitizeList(content.projects).length ? content.projects : defaultContent.projects,
    books: sanitizeList(content.books).length ? content.books : defaultContent.books
  };
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);

  if (!projectId || !clientEmail || !privateKey) {
    return false;
  }

  if (admin.apps.length) {
    return true;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n')
    }),
    storageBucket
  });

  return true;
}

const usingFirebase = initFirebase();
const firestore = usingFirebase ? admin.firestore() : null;
const storage = usingFirebase ? admin.storage() : null;

function assertFirebaseReady() {
  if (!usingFirebase || !firestore) {
    throw new Error('Firebase is not configured correctly. Please set Firebase env values.');
  }
}

function assertStorageReady() {
  if (!usingFirebase || !storage) {
    throw new Error('Firebase Storage is not configured correctly.');
  }
}

async function getContent() {
  assertFirebaseReady();

  const snapshot = await firestore.collection(COLLECTION).doc(DOC).get();
  if (!snapshot.exists) {
    await firestore.collection(COLLECTION).doc(DOC).set(defaultContent);
    return defaultContent;
  }

  return withDefaults(snapshot.data());
}

async function saveContent(content) {
  assertFirebaseReady();

  const sanitized = sanitizeContent(content);

  if (!sanitized.profile.name) {
    throw new Error('Profile name is required.');
  }

  await firestore.collection(COLLECTION).doc(DOC).set(sanitized, { merge: true });

  return sanitized;
}

async function uploadFileToStorage({ buffer, mimeType, originalName, folder = 'portfolio' }) {
  assertStorageReady();

  if (!buffer || !buffer.length) {
    throw new Error('Uploaded file is empty.');
  }

  const safeName = String(originalName || 'upload.bin')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .toLowerCase();
  const objectPath = `${folder}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeName}`;
  const bucket = storage.bucket();
  const token = crypto.randomUUID();
  const file = bucket.file(objectPath);

  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType || 'application/octet-stream',
      metadata: {
        firebaseStorageDownloadTokens: token
      }
    }
  });

  return {
    path: objectPath,
    url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
  };
}

module.exports = {
  getContent,
  saveContent,
  usingFirebase,
  uploadFileToStorage
};
