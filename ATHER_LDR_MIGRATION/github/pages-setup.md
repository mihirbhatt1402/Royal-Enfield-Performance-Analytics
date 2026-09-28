# GitHub Pages Setup

## Overview

The Ather LDR Dashboard is deployed as a static GitHub Pages site. There is **no build step** — files
are served directly as static HTML.

## Repository File Structure

```
repository root/
├── index.html                              ← meta-refresh redirect to dashboard
├── .nojekyll                               ← prevents Jekyll processing (required!)
└── ATHER_LDR/
    └── ATHER_LDR_Dashboard_v1.0.html       ← the dashboard
```

## Enabling GitHub Pages

1. Go to your GitHub repository → Settings → Pages
2. Under "Build and deployment" → Source: **Deploy from a branch**
3. Branch: **main** / Folder: **/ (root)**
4. Click Save
5. After a few minutes, the site will be available at: `https://<owner>.github.io/<repo>/`

## .nojekyll File

The `.nojekyll` file at the repository root prevents GitHub Pages from processing files with Jekyll.
Without it, files with underscores in their names may be excluded.

**Create it if it doesn't exist:**
```bash
touch .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll to disable Jekyll processing"
git push
```

## Deployed URL

The dashboard URL will be:
```
https://<owner>.github.io/<repo>/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
```

The root URL (`https://<owner>.github.io/<repo>/`) redirects to the dashboard via `index.html`.

## Adding the Domain to Firebase Auth

After enabling GitHub Pages:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Enter: `<owner>.github.io`
4. Click Add

Without this step, Google Sign-In will fail with `auth/unauthorized-domain`.

## Deploying Updates

To update the dashboard:
```bash
# Edit source/ATHER_LDR_Dashboard_v1.0.html with your changes
# Copy to the deployment location
cp source/ATHER_LDR_Dashboard_v1.0.html dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
git add dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
git commit -m "Update dashboard"
git push origin main
```

GitHub Pages automatically serves the new version within seconds to a few minutes.

## GitHub Actions Workflow

The only workflow is a daily availability check:
- File: `.github/workflows/daily-refresh-check.yml`
- Schedule: 04:00 UTC (09:30 IST) daily
- What it does: Checks that the dashboard URL returns HTTP 200
- On failure: The workflow run fails (visible in Actions tab)

**There is no deploy workflow** — deployment is done by pushing files directly to `main`.

## Custom Domain (Optional)

To use a custom domain (e.g., `ather-ldr.example.com`):
1. Add a `CNAME` file to the repository root with just the domain name
2. Configure DNS for the domain to point to GitHub Pages
3. Add the custom domain to Firebase Auth authorized domains
4. GitHub Settings → Pages → Custom domain → enter the domain
