# Aswin Paudel Portfolio (Node.js + Firebase)

A responsive portfolio website with an `/admin` panel to edit all short details from background data:
- Profile (name, role, bio, contact, CTA)
- Skills (technical and soft)
- Experience
- Certifications
- Media URLs (image/audio/video)
- Social links
- Projects

The app uses Firebase Firestore via Node.js backend.

## Stack
- Node.js + Express
- Firebase Admin SDK (Firestore)
- Vanilla HTML/CSS/JS frontend

## Run locally
1. Install dependencies
```bash
npm install
```
2. Copy environment template
```bash
cp .env.example .env
```
3. Fill `.env` values:
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` for admin panel login
- `ADMIN_SESSION_SECRET` for signing admin session cookies
- Firebase Admin credentials (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)

Note:
- Your Firebase Web config (`apiKey`, `authDomain`, `appId`, etc.) is not enough for this backend.
- This app writes Firestore from Node.js, so it needs a Firebase service account key.
- Host media files in GitHub and paste the raw URLs in admin fields.

4. Start app
```bash
npm run dev
```

Open:
- Portfolio: `http://localhost:3000`
- Admin panel: `http://localhost:3000/admin`

## Firestore structure
Collection: `portfolio`
Document: `siteContent`

Document fields:
- `profile` object
- `skills` object with `technical` and `soft` arrays
- `experience` array of objects
- `certifications` array of objects
- `socials` array of objects
- `projects` array of objects

## Security note
For production, keep strong `ADMIN_PASSWORD`, run over HTTPS, and lock down server/network access. For stricter security you can swap password auth for Firebase Auth + session middleware.
