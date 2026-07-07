# MedLink — Deployment Guide

This guide covers deploying MedLink to **Railway** (API + PostgreSQL) and **Netlify** (frontend).

**Time to complete:** ~30 minutes  
**Cost:** Free (Railway free tier + Netlify free tier)

---

## Prerequisites (Personal Laptop)

Install these tools before starting:

| Tool | Install |
|------|---------|
| Node.js 20+ | https://nodejs.org → download LTS |
| pnpm | `npm install -g pnpm` |
| Git | https://git-scm.com/download/win |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/jitendra189/Medlink.git
cd Medlink
pnpm install
```

---

## Step 2: Deploy PostgreSQL + API on Railway

### 2.1 Create Railway account
1. Go to https://railway.app
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub

### 2.2 Create a new project
1. Click **"New Project"**
2. Select **"Empty Project"**
3. Name it `medlink`

### 2.3 Add PostgreSQL database
1. Inside the `medlink` project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Wait for it to provision (30 seconds)
4. Click on the PostgreSQL service → **"Variables"** tab
5. Copy the `DATABASE_URL` value — you'll need it later

### 2.4 Deploy the API
1. Inside the `medlink` project, click **"+ New"** again
2. Select **"GitHub Repo"**
3. Select your `jitendra189/Medlink` repository
4. Railway will detect the `railway.json` in the repo root

### 2.5 Set environment variables for the API service
Click on the API service → **"Variables"** tab → Add these:

```
DATABASE_URL         = <paste from PostgreSQL service above>
NODE_ENV             = production
PORT                 = 3000
JWT_SECRET           = <run this to generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_ACCESS_EXPIRY    = 15m
JWT_REFRESH_EXPIRY_DAYS = 7
FRONTEND_URL         = https://YOUR_NETLIFY_URL (update after Step 3)
```

### 2.6 Trigger deploy
Click **"Deploy"** on the API service. Watch the build logs — it should complete in 3-5 minutes.

### 2.7 Get your Railway API URL
Once deployed, click on the API service → **"Settings"** → copy the public URL.
It looks like: `https://medlink-api-production-xxxx.up.railway.app`

### 2.8 Seed the Railway database
Run this from your laptop (replace with your actual Railway DATABASE_URL):

```bash
cd Medlink/apps/api
DATABASE_URL="postgresql://postgres:xxxx@xxxx.railway.app:5432/railway" pnpm seed
```

Expected output:
```
✓ Connected to database
✓ Seeded 3 patients
✓ Seeded 5 hospitals
✓ Seeded 10 doctors
✓ Seeded 6 blood donors
✓ Seeded 4 ambulance drivers
✓ Seeded 2 emergency requests
✓ Seeded 2 blood requests
✓ Seeded 2 bookings

✅ Seed complete!
```

### 2.9 Verify API is live
```bash
curl https://YOUR_RAILWAY_URL/health
```
Expected: `{"success":true,"data":{"status":"ok"}}`

---

## Step 3: Deploy Frontend on Netlify

### 3.1 Update the API URL in netlify.toml
Edit `netlify.toml` in the repo root — replace `YOUR_RAILWAY_URL` with your actual Railway URL:
```toml
[[redirects]]
  from   = "/api/*"
  to     = "https://YOUR_ACTUAL_RAILWAY_URL/api/:splat"
```

Commit and push:
```bash
git add netlify.toml
git commit -m "chore: set Railway API URL in netlify.toml"
git push origin main
```

### 3.2 Create Netlify account
1. Go to https://app.netlify.com
2. Click **"Sign up"** → **"Sign up with GitHub"**
3. Authorize Netlify

### 3.3 Create new site
1. Click **"Add new site"** → **"Import an existing project"**
2. Select **"GitHub"**
3. Find and select `jitendra189/Medlink`

### 3.4 Configure build settings
Netlify will auto-detect the `netlify.toml`. Verify:
- **Base directory:** `apps/web`
- **Build command:** `pnpm build`
- **Publish directory:** `apps/web/dist`

### 3.5 Set environment variables
In Netlify → Site settings → Environment variables → Add:
```
VITE_API_URL = https://YOUR_RAILWAY_URL
```

### 3.6 Deploy
Click **"Deploy site"**. Build takes 2-3 minutes.

### 3.7 Get your Netlify URL
After deploy, Netlify shows your URL: `https://medlink-xxxx.netlify.app`

You can also set a custom site name: Site settings → General → Change site name.

---

## Step 4: Update Railway FRONTEND_URL

1. Go back to Railway → API service → Variables
2. Update `FRONTEND_URL` = `https://YOUR_NETLIFY_URL`
3. Railway will auto-redeploy

---

## Step 5: Verify Everything Works

1. Open your Netlify URL — landing page should load
2. Click "Get Started" → Register a patient account
3. Login with `amit@medlink.demo` / `Test@12345`
4. You should see 5 hospitals in the hospital list
5. Open API docs: `https://YOUR_RAILWAY_URL/api/docs`

---

## Troubleshooting

**API not starting on Railway:**
- Check build logs for errors
- Verify all environment variables are set
- Make sure `DATABASE_URL` is correct

**Frontend shows blank page:**
- Open browser DevTools → Console tab
- Check for CORS errors — verify `FRONTEND_URL` in Railway matches your Netlify URL exactly

**Seed fails with connection error:**
- Double-check `DATABASE_URL` — Railway PostgreSQL URL format: `postgresql://postgres:password@host:port/railway`

**Login not working after deploy:**
- Verify `FRONTEND_URL` in Railway env vars matches Netlify URL (including https://)
- Check API logs in Railway dashboard

---

## Demo Accounts

All use password: `Test@12345`

| Role | Email |
|------|-------|
| Patient | amit@medlink.demo |
| Hospital Admin | apollo_hospital@medlink.demo |
| Blood Donor | kiran@medlink.demo |
| Ambulance Driver | driver1@medlink.demo |
