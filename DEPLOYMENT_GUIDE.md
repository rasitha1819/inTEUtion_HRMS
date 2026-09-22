# Netlify Frontend Deployment Guide

This guide explains how to deploy the HRMS React Frontend to **Netlify**.

---

## Method 1: Deploy via GitHub / GitLab Repository (Recommended)

### 1. Push Code to GitHub
Ensure your repository is pushed to GitHub:
```bash
git add .
git commit -m "Configure Firebase data storage and Netlify deployment"
git push origin main
```

### 2. Connect to Netlify
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** > **"Import an existing project"**.
3. Select **GitHub** and authorize Netlify.
4. Choose your HRMS repository.

### 3. Configure Build Settings
Netlify will automatically detect the settings from [`netlify.toml`](./frontend/netlify.toml), but verify:
- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `frontend/dist` (or `dist` if base directory is set to `frontend`)

### 4. Add Environment Variables in Netlify
Go to **Site configuration** > **Environment variables** > **Add a variable** and add your Firebase credentials:

| Key | Example Value |
| --- | --- |
| `VITE_DATA_SOURCE` | `firebase` |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `my-hrms-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `my-hrms-app` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `my-hrms-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` |
| `VITE_FIREBASE_APP_ID` | `1:1234567890:web:abcdef` |

### 5. Deploy
Click **Deploy site**. Netlify will build and provide your live HTTPS URL (e.g. `https://my-hrms.netlify.app`).

---

## Method 2: Manual Drag & Drop (Netlify Drop)

If you prefer deploying without connecting Git:

1. In the `frontend` directory, ensure your `.env` contains your Firebase credentials.
2. Build the production package:
   ```bash
   cd frontend
   npm run build
   ```
3. Go to [Netlify Drop](https://app.netlify.com/drop).
4. Drag and drop the `frontend/dist` folder into the Netlify upload area.
5. Netlify instantly deploys your frontend!

---

## Notes on Routing
Client-side single-page application (SPA) routing is already pre-configured with:
- [`frontend/public/_redirects`](./frontend/public/_redirects)
- [`frontend/netlify.toml`](./frontend/netlify.toml)

All routes (`/dashboard`, `/employees`, `/attendance`, `/leaves`, `/profile`) will resolve cleanly without 404 errors on page reload.
