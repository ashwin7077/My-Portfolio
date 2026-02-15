require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const { getContent, saveContent, usingFirebase, uploadFileToStorage } = require('./src/contentStore');

const app = express();
const port = process.env.PORT || 3000;
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-this';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const uploadLimitMb = Number(process.env.UPLOAD_IMAGE_LIMIT_MB || 15);
const uploadLimitBytes = Math.max(1, uploadLimitMb) * 1024 * 1024;
const adminSessions = new Map();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadLimitBytes }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index > -1) {
        acc[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      }
      return acc;
    }, {});
}

function signSessionToken(payload) {
  return crypto.createHmac('sha256', sessionSecret).update(payload).digest('hex');
}

function makeSessionValue(token) {
  return `${token}.${signSessionToken(token)}`;
}

function isValidSessionValue(value = '') {
  const [token, signature] = value.split('.');
  if (!token || !signature) {
    return false;
  }
  const expected = signSessionToken(token);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, Date.now() + sessionTtlMs);
  return makeSessionValue(token);
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const cookieValue = cookies.admin_session;
  if (!cookieValue || !isValidSessionValue(cookieValue)) {
    return null;
  }

  const token = cookieValue.split('.')[0];
  const expiresAt = adminSessions.get(token);
  if (!expiresAt || expiresAt < Date.now()) {
    adminSessions.delete(token);
    return null;
  }

  return token;
}

function requireAdminAuth(req, res, next) {
  const token = getSessionToken(req);
  if (!token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }
  next();
}

app.get('/api/content', async (_req, res) => {
  try {
    const content = await getContent();
    res.json({ ok: true, usingFirebase, content });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('NOT_FOUND')) {
      return res.status(500).json({
        ok: false,
        message: 'Firestore database not found. Create a Firestore database in Firebase Console and try again.'
      });
    }
    res.status(500).json({ ok: false, message: message || 'Failed to load portfolio content.' });
  }
});

app.get('/api/admin/session', (req, res) => {
  const token = getSessionToken(req);
  res.json({ ok: true, authenticated: Boolean(token) });
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username !== adminUsername || password !== adminPassword) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  const sessionValue = createSession();
  res.setHeader('Set-Cookie', `admin_session=${encodeURIComponent(sessionValue)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionTtlMs / 1000}`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (_req, res) => {
  res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/admin/content', requireAdminAuth, async (_req, res) => {
  try {
    const content = await getContent();
    res.json({ ok: true, usingFirebase, content });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('NOT_FOUND')) {
      return res.status(500).json({
        ok: false,
        message: 'Firestore database not found. Create a Firestore database in Firebase Console and try again.'
      });
    }
    res.status(500).json({ ok: false, message: message || 'Failed to load portfolio content.' });
  }
});

app.put('/api/admin/content', requireAdminAuth, async (req, res) => {
  try {
    const updated = await saveContent(req.body);
    res.json({ ok: true, usingFirebase, content: updated });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message || 'Failed to save content.' });
  }
});

app.post('/api/admin/upload-image', requireAdminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'No file uploaded.' });
    }

    const type = String(req.body?.type || 'profile').toLowerCase();
    const folderMap = {
      profile: 'portfolio/profile',
      logo: 'portfolio/logo',
      project: 'portfolio/projects',
      certification: 'portfolio/certifications',
      book: 'portfolio/books',
      blog: 'portfolio/blogs'
    };
    const folder = folderMap[type] || folderMap.profile;

    if (!String(req.file.mimetype || '').startsWith('image/')) {
      return res.status(400).json({ ok: false, message: 'Only image uploads are allowed.' });
    }

    const uploaded = await uploadFileToStorage({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      folder
    });

    res.json({ ok: true, url: uploaded.url, path: uploaded.path });
  } catch (error) {
    const message = String(error.message || '');
    if (message.includes('File too large')) {
      return res.status(400).json({ ok: false, message: `Image exceeds ${uploadLimitMb}MB limit.` });
    }
    res.status(400).json({ ok: false, message: message || 'Upload failed.' });
  }
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/contact', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/projects', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'projects.html'));
});

app.get('/certifications', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'certifications.html'));
});

app.get('/certifications/:category', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'certifications.html'));
});

app.get('/certifications/:category/:slug', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'certifications.html'));
});

app.get('/books', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'books.html'));
});

app.get('/blog', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((error, _req, res, _next) => {
  if (error?.name === 'MulterError' && error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, message: `Image exceeds ${uploadLimitMb}MB limit.` });
  }

  if (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Unexpected server error.' });
  }
});

app.listen(port, () => {
  const storeMode = usingFirebase ? 'Firebase Firestore' : 'Firebase not configured';
  console.log(`Portfolio running on http://localhost:${port} (${storeMode})`);
});
