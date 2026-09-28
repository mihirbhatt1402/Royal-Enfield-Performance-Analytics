# TARGET CLAUDE PROMPT
# Ather LDR Dashboard — Complete Migration & Deployment

---

> **HOW TO USE THIS FILE:**
> Share this entire file as your first message to Claude.
> Everything Claude needs is in this migration package.

---

## Your Task

You are deploying the **Ather LDR (Lead Disposition Report) Dashboard** — a single-page React dashboard
that fetches lead and retail data from Google Sheets, shows 7 analytics tabs, and is protected by
Firebase Google Auth.

The colleague who prepared this migration package has already:
- Audited the full source code (4,300 lines)
- Documented all data schemas, Firebase config, and deployment steps
- Packaged the complete source file

**Your job is to:**
1. Apply 3 required source-file edits
2. Set up a new GitHub repository
3. Configure Firebase (Auth + Firestore + Realtime Database)
4. Deploy to GitHub Pages
5. Verify the deployment

---

## Migration Package Contents

```
ATHER_LDR_MIGRATION/
├── source/
│   ├── ATHER_LDR_Dashboard_v1.0.html    ← MAIN DASHBOARD (complete, 4300 lines)
│   └── index.html                        ← Root redirect
├── firebase/
│   ├── firestore.rules                   ← Firestore security rules
│   ├── realtime-database.rules.json      ← RTDB rules
│   ├── firebase-config.md                ← Firebase config guide
│   ├── firebase-setup.md                 ← Firebase setup steps
│   ├── firestore-schema.md               ← Firestore collection schema
│   └── rtdb-schema.md                    ← RTDB schema
├── github/
│   ├── workflows/daily-refresh-check.yml ← GitHub Actions workflow
│   ├── pages-setup.md                    ← GitHub Pages setup guide
│   └── repository-setup.md               ← Repository setup guide
├── data/
│   ├── lead-master-schema.md             ← Lead Master columns/parsing
│   ├── retail-master-schema.md           ← Retail Master columns/parsing
│   └── data-source-configuration.md     ← Sheet URLs and config
├── config/
│   └── app-config.md                     ← Application config reference
├── validation/
│   ├── FUNCTIONAL_TESTS.md               ← Functional test suite
│   ├── SECURITY_TESTS.md                 ← Security test suite
│   └── QA_CHECKLIST.md                   ← QA checklist
├── SECRETS_REQUIRED.md                   ← ALL credentials needed
├── AUTH_AND_ACCESS.md                    ← Auth flow + security bug
├── ARCHITECTURE.md                       ← Technical architecture
├── DATA_SOURCES.md                       ← Sheet URLs reference
├── MIGRATION_MANIFEST.md                 ← Full file manifest
├── SETUP_CHECKLIST.md                    ← Step-by-step checklist
├── TROUBLESHOOTING.md                    ← Common issues + fixes
└── AUDIT_ANSWERS.md                      ← Answers to 19 audit questions
```

---

## STEP 1: Secrets You Need (Collect These First)

Before you start, collect:

| Secret | Where to get it | Example |
|--------|-----------------|---------|
| Firebase API Key | Firebase Console → Project Settings → General → Web API Key | `AIzaSy...` |
| Firebase Messaging Sender ID | Firebase Console → Project Settings → General → Cloud Messaging tab | `123456789012` |
| Firebase App ID | Firebase Console → Project Settings → General → Your apps | `1:123...web:abc...` |

The Firebase project name is: **`ather-ldr-dashboard`**

---

## STEP 2: Required Source File Edits

Open `source/ATHER_LDR_Dashboard_v1.0.html` and make exactly these 3 changes:

### Change 1: Fill in Firebase config (lines ~4007–4014)

Find this block:
```js
var FIREBASE_CONFIG={
  apiKey:'REPLACE_WITH_ATHER_API_KEY',
  authDomain:'ather-ldr-dashboard.firebaseapp.com',
  databaseURL:'https://ather-ldr-dashboard-default-rtdb.firebaseio.com',
  projectId:'ather-ldr-dashboard',
  storageBucket:'ather-ldr-dashboard.firebasestorage.app',
  messagingSenderId:'REPLACE_WITH_MESSAGING_SENDER_ID',
  appId:'REPLACE_WITH_APP_ID',
};
```

Replace the three placeholder values:
- `REPLACE_WITH_ATHER_API_KEY` → your Firebase Web API Key
- `REPLACE_WITH_MESSAGING_SENDER_ID` → your Messaging Sender ID
- `REPLACE_WITH_APP_ID` → your App ID

**Leave `authDomain`, `databaseURL`, `projectId`, `storageBucket` exactly as they are.**

### Change 2: Add all 3 admin emails (line ~4016)

Find:
```js
var ADMIN_EMAILS=['mihir.bhatt@girnarsoft.com'];
```

Replace with:
```js
var ADMIN_EMAILS=['mihir.bhatt@girnarsoft.com','pooja.chowdhury@girnarsoft.com','aditya.kumar@girnarsoft.com'];
```

### Change 3: Fix the auth security bug (lines ~4245–4247)

Find this block inside the `handleUser` function within `AuthGate`:
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'full';
setRole(fallbackRole); setAuthState('authed');
```

Replace with:
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'viewer';
setRole(fallbackRole); setAuthState('authed');
```

**Why:** Without this fix, if Firestore is unreachable, every non-admin user gets `role='full'` (full access) instead of `role='viewer'` (read-only). The fix limits the fallback to the least-privileged role.

---

## STEP 3: Firebase Project Setup

### 3a. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Project name: **`ather-ldr-dashboard`** (exact — this matches the hardcoded config)
4. Disable Google Analytics (not needed)
5. Click "Create project"

### 3b. Enable Google Auth

1. Firebase Console → Authentication → Get started
2. Sign-in method → Google → Enable
3. Project support email: `mihir.bhatt@girnarsoft.com`
4. Click Save

### 3c. Add Authorized Domain

1. Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Enter: `mihirbhatt1402.github.io` (replace with actual GitHub username)
4. Click Add

### 3d. Enable Firestore

1. Firebase Console → Firestore Database → Create database
2. Select "Start in production mode"
3. Choose region: `asia-south1` (Mumbai) — recommended for Indian users
4. Click "Create"

### 3e. Deploy Firestore Rules

Copy the rules from `firebase/firestore.rules` and paste them at:
Firebase Console → Firestore → Rules → Edit rules → Publish

Or using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

The rules enforce:
- Users can only read/write their own document in `ather_users/{uid}`
- Only admins (verified by email match) can read all documents
- Users cannot self-assign admin role

### 3f. Enable Realtime Database

1. Firebase Console → Realtime Database → Create database
2. Select region: `asia-south1` (or nearest)
3. Start in locked mode
4. After creation, go to Rules tab
5. Replace the rules with the content from `firebase/realtime-database.rules.json`
6. Click Publish

### 3g. Get Firebase Config Values

1. Firebase Console → Project Settings (gear icon) → General tab
2. Scroll to "Your apps" → if no app exists, click "Add app" → Web
3. App nickname: `ather-ldr-web`
4. Do NOT enable Firebase Hosting
5. Copy the config values (apiKey, messagingSenderId, appId)

---

## STEP 4: GitHub Repository Setup

### 4a. Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `Ather-Lead-performance-dashboard` (or your choice)
3. Visibility: **Private** (recommended — contains data URLs)
4. Initialize with README: No
5. Click "Create repository"

### 4b. Set Up Local Clone

```bash
git clone https://github.com/<owner>/Ather-Lead-performance-dashboard.git
cd Ather-Lead-performance-dashboard
```

### 4c. Create Repository Structure

```bash
mkdir -p ATHER_LDR .github/workflows
```

### 4d. Copy Files

```bash
# Copy the dashboard (already edited in Step 2)
cp path/to/source/ATHER_LDR_Dashboard_v1.0.html ATHER_LDR/

# Copy the root redirect
cp path/to/source/index.html index.html

# Create .nojekyll (required for GitHub Pages)
touch .nojekyll

# Copy the workflow
cp path/to/github/workflows/daily-refresh-check.yml .github/workflows/
```

### 4e. Initial Commit

```bash
git add ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html index.html .nojekyll .github/
git commit -m "Initial Ather LDR Dashboard deployment"
git push origin main
```

---

## STEP 5: Enable GitHub Pages

1. Go to your repository → Settings → Pages
2. Under "Build and deployment":
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
3. Click Save
4. Wait 2–5 minutes

Your dashboard will be at:
```
https://<owner>.github.io/<repo>/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html
```

The root URL `https://<owner>.github.io/<repo>/` redirects to the dashboard via `index.html`.

---

## STEP 6: Verify Deployment

### 6a. Open the Dashboard

Navigate to: `https://<owner>.github.io/<repo>/`

You should see the Ather LDR login page with:
- Title: "Ather · LDR"
- Subtitle: "LEAD DISPOSITION DASHBOARD v1.0 · Ather Energy"
- "Continue with Google" button

### 6b. Sign In as Admin

1. Click "Continue with Google"
2. Sign in with `mihir.bhatt@girnarsoft.com` (or another admin email)
3. You should be redirected to the dashboard (not the "pending" page)

### 6c. Sync Data

1. Click "Sync Sheets" button in the header
2. Wait for sync to complete (may take 30–60 seconds)
3. Verify the header shows: Leads, Bookings, L2R%, Months, Retail Till

### 6d. Validate Key Numbers

After sync, check the Overview tab for these approximate values:
- **Total Leads:** ~60,504 (across all configured months)
- **Retail:** ~1,531
- **L2R%:** ~2.5%
- **States:** ~28

> Note: These are reference values from May–Sep 2026. Actual values depend on the current data.

---

## Data Architecture (Reference)

### Sheet Structure

| Sheet | Purpose | Granularity |
|-------|---------|-------------|
| Lead Master (per month) | Lead enquiries | One row per lead |
| Retail Master (all months) | Retail/booking events | One row per retail |

### Join Logic

```
Lead Master.opty_id = Retail Master.sourceLeadId
```

### Retail Attribution Rule

A lead is counted as "retailed" (in-scope) when ALL of these are true:
1. The lead has a retail record (`isBooked = true`)
2. `d = atherMonthOrder(booking_month) - atherMonthOrder(lead_month)`
3. `d` must be 0, 1, or 2 (same month, +1 month, or +2 months)
4. The purchased model must be one of: `Ather Rizta`, `Ather 450X`, `Ather 450S`, `Ather 450 Apex`

KONARC SR2 and SR3 are **out-of-scope** and never count as retails.

### Data Cutoff

Leads before **01-May-2026** are excluded. This is hardcoded as:
```js
const DATA_CUTOFF = new Date(2026, 4, 1);
```

### Source Classification

| Raw Medium value | Source Group |
|-----------------|-------------|
| contains adword/google/sem/ppc | PAID → ADWORDS |
| contains facebook/fb/meta/msfb | PAID → MS FB |
| contains whatsapp | PAID → WHATSAPP |
| contains organic | ORG+NON MS → ORGANIC |
| anything else | ORG+NON MS → NON MS |

---

## Dashboard Tabs (7 Tabs — Production)

| Tab ID | Label | Role Visibility |
|--------|-------|----------------|
| overview | Overview | admin, full, viewer |
| source | Source Analysis | admin, full, viewer |
| ltxsrc | LT × Source | admin, full, viewer |
| modelxsrc | Model Performance | ALL roles including client |
| statexsrc | State Performance | admin, full, viewer |
| geodealer | Geo & Dealer | ALL roles including client |
| pivot | Pivot Table | admin, full, viewer |

> **IMPORTANT:** The source file contains an 8th tab (`dispersion` — Retail Dispersion) in the TABS array.
> It is NOT removed from TABS but is excluded by the role-based visibility logic for all production roles.
> Do NOT add it back to `visibleTabs` in `App`.

### Role Access

| Role | Tab Access | Notes |
|------|------------|-------|
| `admin` | All 7 tabs | Can manage users via Admin panel |
| `full` | All 7 tabs | Read-only, all data |
| `viewer` | modelxsrc, statexsrc, geodealer | Limited view |
| `client` | modelxsrc, geodealer | Client-facing view |
| `pending` | Login page only | Awaiting role assignment |

---

## Adding a New Month

When a new month's data is ready:

1. Open `ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`
2. Find `ATHER_LEAD_MASTER_BY_MONTH` (near line 232)
3. Add a new entry:
   ```js
   "Oct'2026": "https://docs.google.com/spreadsheets/d/YOUR_NEW_SHEET_ID/edit?gid=2013005874#gid=2013005874",
   ```
4. Ensure the sheet is shared as "Anyone with the link → Viewer"
5. Commit and push — GitHub Pages auto-deploys

---

## User Management

Users are stored in Firestore collection: `ather_users`

Each user document has:
```
{
  email: "user@girnarsoft.com",
  displayName: "User Name",
  photoURL: "...",
  role: "pending" | "viewer" | "full" | "admin" | "client",
  createdAt: Timestamp
}
```

**To grant access:** Firebase Console → Firestore → `ather_users` → find user document → change `role` field.

**Roles granted automatically:**
- Admin emails → `admin` on first login
- All others → `pending` (must be manually upgraded)

---

## Critical Warnings

### ⚠ Firebase Config Is Public

The Firebase config values (`apiKey`, etc.) will be visible in the HTML source. This is normal and expected — they are not secret credentials. Security is enforced by Firestore rules and RTDB rules, not by hiding the config.

### ⚠ Sheet Access Required

All Google Sheets must be shared as "Anyone with the link → Viewer". If a sheet is private, syncing will fail with a CORS/network error.

### ⚠ GitHub Pages URL Must Be Authorized in Firebase

If you use a custom GitHub username/repository, you must add `<owner>.github.io` to Firebase Auth authorized domains. Failure to do so results in `auth/unauthorized-domain` on login.

### ⚠ Do Not Use unpkg.com for React in Production

The current source loads React from `unpkg.com`. This is acceptable for this deployment model but note it creates a CDN dependency. If unpkg is down, the dashboard won't load.

---

## Troubleshooting Quick Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Login popup says "unauthorized-domain" | GitHub Pages domain not in Firebase Auth | Add `<owner>.github.io` to authorized domains |
| "Access Pending" after login | User exists but role is `pending` | Manually set role in Firestore |
| Sync fails with "Access denied" | Sheet not publicly shared | Share sheet → "Anyone with link → Viewer" |
| Sync fails with "Sheet returned HTML" | Same as above | Same fix |
| Dashboard shows blank/white page | Firebase config not filled in | Complete Step 2 Change 1 |
| Admin users get "pending" role | `ADMIN_EMAILS` not updated | Complete Step 2 Change 2 |

---

## Files You Must NOT Modify

- `firebase/firestore.rules` — provided as final, do not change security logic
- `firebase/realtime-database.rules.json` — provided as final
- `.github/workflows/daily-refresh-check.yml` — update the URL to match your deployment

---

## Verification Checklist

After deployment, confirm each item:

- [ ] Dashboard URL loads the login page
- [ ] Google Sign-In works without `auth/unauthorized-domain` error
- [ ] Admin user lands on dashboard (not pending page)
- [ ] "Sync Sheets" completes without error
- [ ] Overview tab shows Leads, Retail, L2R% numbers
- [ ] All 7 tabs are visible (admin user)
- [ ] Source Analysis tab shows Source, Leads, Enquiries, Retail, Non-Scope R columns
- [ ] Month filter works
- [ ] Geo & Dealer tab shows: Dealer Code, Dealer, State, Region, City, Leads, Retail, Conv%
- [ ] Export buttons work (Excel, CSV)
- [ ] Admin panel accessible from user badge (admin role)

---

*Migration package prepared from source: `mihirbhatt1402/Ather-Lead-performance-dashboard`, branch `main`*
*Dashboard version: v1.0 · Build: 2026-09-23*
