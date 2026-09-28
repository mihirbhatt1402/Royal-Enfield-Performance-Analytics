# GitHub Repository Setup

## Repository Structure

The deployed repository must have this exact structure:

```
<repository-root>/
├── index.html                              ← root redirect (meta-refresh)
├── .nojekyll                               ← disables Jekyll (required!)
├── ATHER_LDR/
│   └── ATHER_LDR_Dashboard_v1.0.html       ← the dashboard
└── .github/
    └── workflows/
        └── daily-refresh-check.yml         ← availability check
```

## Creating the Repository

### Option A: GitHub Web UI

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `Ather-Lead-performance-dashboard` (or your preferred name)
3. Description: `Ather Energy LDR Dashboard`
4. Visibility: **Private** (recommended)
5. Leave all initialization options unchecked
6. Click "Create repository"

### Option B: GitHub CLI

```bash
gh repo create Ather-Lead-performance-dashboard --private --description "Ather Energy LDR Dashboard"
```

## Initial Setup Commands

```bash
# Clone the empty repository
git clone https://github.com/<owner>/Ather-Lead-performance-dashboard.git
cd Ather-Lead-performance-dashboard

# Create the directory structure
mkdir -p ATHER_LDR .github/workflows

# Copy files (after making the 3 required source edits)
cp /path/to/migration/source/ATHER_LDR_Dashboard_v1.0.html ATHER_LDR/
cp /path/to/migration/source/index.html index.html

# Create .nojekyll
touch .nojekyll

# Copy GitHub Actions workflow
cp /path/to/migration/github/workflows/daily-refresh-check.yml .github/workflows/

# Stage all files
git add ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
git add index.html
git add .nojekyll
git add .github/workflows/daily-refresh-check.yml

# Commit
git commit -m "Initial Ather LDR Dashboard deployment"

# Push
git push -u origin main
```

## Enabling GitHub Pages

After the initial push:

1. Repository → Settings → Pages
2. Source: **Deploy from a branch**
3. Branch: `main`, Folder: `/ (root)`
4. Click Save
5. Wait 3–5 minutes for deployment

The site will be available at:
```
https://<owner>.github.io/<repo>/
```

Which redirects (via `index.html`) to:
```
https://<owner>.github.io/<repo>/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
```

## Updating the Dashboard

```bash
# Edit the source file
vim ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html

# Stage and commit
git add ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
git commit -m "Update dashboard: <describe change>"
git push origin main
```

GitHub Pages auto-deploys within seconds to a few minutes.

## Adding a New Month

```bash
# Open the source file and find ATHER_LEAD_MASTER_BY_MONTH (~line 232)
# Add: "Oct'2026": "https://docs.google.com/spreadsheets/d/NEW_SHEET_ID/edit?gid=2013005874#gid=2013005874",

git add ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
git commit -m "Add Oct'2026 Lead Master sheet"
git push origin main
```

## Branch Strategy

For this deployment:
- **main** — production. Push directly to main.
- No CI/CD pipeline needed — GitHub Pages serves files directly.

If you want to test changes before publishing:
1. Create a branch: `git checkout -b staging`
2. Make changes on staging
3. Test locally (open the HTML file directly)
4. Merge to main when ready

## Collaborator Access

To give team members repository access:
1. Repository → Settings → Collaborators
2. Add by GitHub username or email
3. Role: "Write" for developers, "Read" for viewers

## Security Considerations

- Keep the repository **Private** — the dashboard HTML contains the Firebase config (which is not secret but is not intended to be public) and Google Sheets URLs
- The Firebase config values themselves are not sensitive (they're just project identifiers), but the sheet URLs should not be public
- `.nojekyll` must always be present to avoid Jekyll stripping underscore-named files
