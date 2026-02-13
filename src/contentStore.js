const admin = require('firebase-admin');

const COLLECTION = 'portfolio';
const DOC = 'siteContent';

const defaultContent = {
  profile: {
    name: 'Aswin Paudel',
    role: 'Full-Stack Developer',
    bio: 'I design and build high-impact digital products focused on performance, clarity, and real user outcomes.',
    location: 'United States',
    email: 'aswin@example.com',
    phone: '+1 (000) 000-0000',
    profileImageUrl: '',
    profileAudioUrl: '',
    profileVideoUrl: '',
    ctaLabel: 'Let\'s Build Together',
    ctaLink: 'mailto:aswin@example.com'
  },
  socials: [
    { platform: 'GitHub', url: 'https://github.com/' },
    { platform: 'LinkedIn', url: 'https://linkedin.com/' }
  ],
  skills: {
    technical: ['JavaScript', 'Node.js', 'React', 'Firebase'],
    soft: ['Communication', 'Team Collaboration', 'Problem Solving']
  },
  certifications: [
    {
      title: 'Meta Front-End Developer',
      issuer: 'Meta',
      year: '2025',
      credentialUrl: ''
    }
  ],
  experience: [
    {
      role: 'Full-Stack Developer',
      company: 'Freelance',
      period: '2024 - Present',
      description: 'Building production web apps with clean UX, performance-first architecture, and Firebase-backed admin workflows.'
    }
  ],
  projects: [
    {
      id: '1',
      title: 'Flagship Product Site',
      description: 'A conversion-focused marketing website with rapid load times and strong SEO foundations.',
      tech: 'Node.js, React, Firebase',
      demoUrl: 'https://example.com',
      repoUrl: 'https://github.com/',
      imageUrl: '',
      featured: true
    }
  ]
};

function sanitizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
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

function sanitizeContent(content = {}) {
  const profile = content.profile || {};
  const skills = normalizeSkills(content.skills);

  return {
    profile: {
      name: String(profile.name || '').trim(),
      role: String(profile.role || '').trim(),
      bio: String(profile.bio || '').trim(),
      location: String(profile.location || '').trim(),
      email: String(profile.email || '').trim(),
      phone: String(profile.phone || '').trim(),
      profileImageUrl: String(profile.profileImageUrl || '').trim(),
      profileAudioUrl: String(profile.profileAudioUrl || '').trim(),
      profileVideoUrl: String(profile.profileVideoUrl || '').trim(),
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
      issuer: String(item.issuer || '').trim(),
      year: String(item.year || '').trim(),
      credentialUrl: String(item.credentialUrl || '').trim()
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
      description: String(p.description || '').trim(),
      tech: String(p.tech || '').trim(),
      demoUrl: String(p.demoUrl || '').trim(),
      repoUrl: String(p.repoUrl || '').trim(),
      imageUrl: String(p.imageUrl || '').trim(),
      featured: Boolean(p.featured)
    })).filter((p) => p.title)
  };
}

function withDefaults(content) {
  const normalizedSkills = normalizeSkills(content.skills);
  return {
    ...defaultContent,
    ...content,
    profile: { ...defaultContent.profile, ...(content.profile || {}) },
    socials: sanitizeList(content.socials).length ? content.socials : defaultContent.socials,
    skills: {
      technical: normalizedSkills.technical.length ? normalizedSkills.technical : defaultContent.skills.technical,
      soft: normalizedSkills.soft.length ? normalizedSkills.soft : defaultContent.skills.soft
    },
    certifications: sanitizeList(content.certifications).length ? content.certifications : defaultContent.certifications,
    experience: sanitizeList(content.experience).length ? content.experience : defaultContent.experience,
    projects: sanitizeList(content.projects).length ? content.projects : defaultContent.projects
  };
}

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

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
    })
  });

  return true;
}

const usingFirebase = initFirebase();
const firestore = usingFirebase ? admin.firestore() : null;

function assertFirebaseReady() {
  if (!usingFirebase || !firestore) {
    throw new Error('Firebase is not configured correctly. Please set Firebase env values.');
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

module.exports = {
  getContent,
  saveContent,
  usingFirebase
};
