# Deployment Guide: Backend (Render) + Mobile App (EAS Build)

## Part A — Push Code to GitHub

1. Create a new repo on GitHub (e.g. `socialapp`).
2. From your local `socialapp/` folder:
   ```bash
   cd socialapp
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/socialapp.git
   git push -u origin main
   ```
3. Add a `.gitignore` in both `backend/` and `frontend/` with at least:
   ```
   node_modules/
   .env
   .expo/
   ```
   (Never commit your real `.env` — only `.env.example`.)

---

## Part B — MongoDB Atlas (if not done yet)

1. Go to mongodb.com/atlas → create a free (M0) cluster.
2. **Database Access** → add a DB user with a strong password.
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — Render's IPs aren't static).
4. **Connect** → "Drivers" → copy the connection string, replace `<password>` with your DB user's password. This is your `MONGO_URI`.

## Cloudinary (if not done yet)

1. Sign up free at cloudinary.com.
2. Dashboard shows `Cloud name`, `API Key`, `API Secret` directly — copy all three.

---

## Part C — Deploy Backend on Render

1. Go to render.com → sign up/login with GitHub.
2. **New +** → **Web Service** → connect your `socialapp` GitHub repo.
3. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment Variables** — add each one from your `.env`:
   - `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLIENT_ORIGIN` (set to `*` for now, tighten later)
5. Click **Create Web Service**. Wait for the build/deploy logs to finish.
6. You'll get a URL like `https://socialapp-backend.onrender.com`. Test it — visiting it in browser should show `{"status":"ok"}`.

**Note:** Free Render services spin down after 15 min of inactivity and take ~30-50s to wake up on the next request. Fine for testing; for production consider a paid instance or Railway (similar steps, doesn't sleep on some plans).

**Railway alternative:** railway.app → New Project → Deploy from GitHub repo → set root directory to `backend` → add the same env vars → deploy. Very similar flow to Render.

---

## Part D — Point the Mobile App to Your Live Backend

Edit `frontend/src/api/api.js`:
```js
export const BASE_URL = "https://socialapp-backend.onrender.com/api";
```
Commit and push this change too.

---

## Part E — Build the Android App with EAS

1. Install EAS CLI globally:
   ```bash
   npm install -g eas-cli
   ```
2. Create a free Expo account at expo.dev if you don't have one, then log in:
   ```bash
   cd frontend
   eas login
   ```
3. Configure the project for builds:
   ```bash
   eas build:configure
   ```
   This creates an `eas.json` file and links the project to your Expo account.
4. Open `app.json` and make sure `android.package` is a unique reverse-domain string, e.g. `com.sajibhasan.socialapp` (must be unique across the Play Store).
5. Build a test APK (installable directly on any Android phone, no Play Store needed):
   ```bash
   eas build --platform android --profile preview
   ```
   If `eas.json` doesn't have a `preview` profile yet, add this inside `"build"`:
   ```json
   "preview": {
     "android": { "buildType": "apk" }
   }
   ```
6. The build runs on Expo's servers (~10-20 min). When done, the terminal gives a download link — open it on your phone or download the `.apk` and side-load it (enable "Install unknown apps" in Android settings).

### For Play Store submission later
```bash
eas build --platform android --profile production
```
This produces an `.aab` file (Play Store's required format) instead of a raw APK. You'd then need a Google Play Developer account ($25 one-time) to upload it.

### For iOS
`eas build --platform ios` needs an active Apple Developer account ($99/year) — can't produce a real device build without it. Expo Go can be used for development testing without this cost, just not for App Store submission.

---

## Quick Checklist
- [ ] Code pushed to GitHub (with `.env` excluded)
- [ ] MongoDB Atlas cluster + connection string ready
- [ ] Cloudinary credentials ready
- [ ] Backend live on Render/Railway, root URL returns `{"status":"ok"}`
- [ ] `BASE_URL` in frontend updated to live backend URL
- [ ] `eas build --platform android --profile preview` produces an installable APK
