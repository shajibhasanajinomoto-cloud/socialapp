# Social App MVP — Full Stack Scaffold

Covers Phases 2–4 of the plan: Auth, Newsfeed (CRUD + likes + comments + pagination),
Real-time Chat (Socket.io), and core UI screens with navigation.

## Folder Structure
```
socialapp/
├── backend/     Express + MongoDB + Socket.io API
└── frontend/    React Native (Expo) app
```

## Backend Setup

1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and fill in:
   - `MONGO_URI` — from your MongoDB Atlas cluster (Database Access → connect string)
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
   - `CLOUDINARY_*` — from your Cloudinary dashboard (free tier works)
4. `npm run dev` (uses nodemon) or `npm start`
5. Server runs at `http://localhost:5000`. Test it: open `http://localhost:5000` in a browser — should return `{"status":"ok"}`.

## Frontend Setup

1. `cd frontend`
2. `npm install`
3. Open `src/api/api.js` and set `BASE_URL` to your backend address:
   - Simulator/emulator on same machine: `http://localhost:5000/api`
   - Physical phone via Expo Go: use your computer's LAN IP, e.g. `http://192.168.1.5:5000/api`
   - Deployed backend: `https://your-app.onrender.com/api`
4. `npx expo start`
5. Scan the QR code with Expo Go (Android) or Camera app (iOS), or press `a`/`i` for emulator.

## What's Implemented

- **Auth:** signup/login with bcrypt-hashed passwords, JWT access + refresh tokens, auto-refresh on 401 via axios interceptor.
- **Feed:** create post with optional image (Cloudinary), paginated FlatList feed with pull-to-refresh and infinite scroll, like/unlike, comments.
- **Chat:** Socket.io with JWT-authenticated handshake, deterministic conversation IDs, online/offline presence, typing indicator, read receipts, chat list + 1:1 chat screen.
- **Navigation:** Auth stack (Login/Signup) → Bottom tabs (Feed/Chats/Profile) → modal screens (Chat/Comments).

## Not Yet Done (Phase 5 — needs your accounts/credentials)

- **Testing:** no automated unit/integration tests yet.
- **Backend deployment:** push `backend/` to GitHub, connect to Render or Heroku, set the same env vars there.
- **Frontend build:** run `eas build --platform android` (requires a free Expo account, `eas login` first).
- **Chat list display:** currently shows the other user's raw ID as a placeholder name — wire up a `/api/users/:id` lookup (or batch-populate) to show real names/avatars.

## Known Simplifications (fine for MVP, revisit before production)

- No rate limiting or input validation library (e.g. Joi/Zod) yet on backend routes.
- No image resizing/compression before Cloudinary upload.
- Refresh tokens are single-session (one per user) — fine for MVP, but multi-device login will overwrite the stored refresh token.
