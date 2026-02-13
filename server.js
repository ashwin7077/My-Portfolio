require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');

const { getContent, saveContent, usingFirebase } = require('./src/contentStore');

const app = express();
const port = process.env.PORT || 3000;
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'dev-secret-change-this';
const sessionTtlMs = 1000 * 60 * 60 * 12;
const adminSessions = new Map();

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

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/contact', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  const storeMode = usingFirebase ? 'Firebase Firestore' : 'Firebase not configured';
  console.log(`Portfolio running on http://localhost:${port} (${storeMode})`);
});
