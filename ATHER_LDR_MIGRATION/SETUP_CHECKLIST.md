# Setup Checklist

Step-by-step deployment checklist. Check off each item as you complete it.

---

## Phase 1: Prerequisites

- [ ] You have a GitHub account with access to create repositories
- [ ] You have access to Firebase Console (Google account)
- [ ] You have access to the source Google Sheets (or know who does)
- [ ] You have collected the 3 Firebase credentials (see `SECRETS_REQUIRED.md`)

---

## Phase 2: Firebase Project

- [ ] Created Firebase project named `ather-ldr-dashboard`
- [ ] Google Analytics disabled on the project
- [ ] Authentication enabled with Google provider
- [ ] Support email set to `mihir.bhatt@girnarsoft.com`
- [ ] Firestore Database created in production mode
- [ ] Region selected: `asia-south1` (or nearest available)
- [ ] Realtime Database created
- [ ] Firestore rules deployed (from `firebase/firestore.rules`)
- [ ] RTDB rules deployed (from `firebase/realtime-database.rules.json`)
- [ ] Firebase Web app created in project settings
- [ ] API Key recorded: `AIzaSy...`
- [ ] Messaging Sender ID recorded: `___________`
- [ ] App ID recorded: `1:...:web:...`

---

## Phase 3: Source File Edits

Open `source/ATHER_LDR_Dashboard_v1.0.html` in a text editor.

- [ ] Change 1: Replaced `REPLACE_WITH_ATHER_API_KEY` with actual API key
- [ ] Change 1: Replaced `REPLACE_WITH_MESSAGING_SENDER_ID` with actual sender ID
- [ ] Change 1: Replaced `REPLACE_WITH_APP_ID` with actual app ID
- [ ] Change 1: Left `authDomain`, `databaseURL`, `projectId`, `storageBucket` unchanged
- [ ] Change 2: Updated `ADMIN_EMAILS` to include all 3 admin email addresses
- [ ] Change 3: Changed fallback role from `'full'` to `'viewer'` in AuthGate
- [ ] Verified no other changes were made (diff against original if unsure)
- [ ] Saved the file

---

## Phase 4: GitHub Repository

- [ ] Created new GitHub repository
- [ ] Repository visibility set (Private recommended)
- [ ] Cloned repository locally
- [ ] Created `ATHER_LDR/` directory
- [ ] Copied edited `ATHER_LDR_Dashboard_v1.0.html` to `ATHER_LDR/`
- [ ] Copied `index.html` to repository root
- [ ] Created `.nojekyll` file at repository root
- [ ] Created `.github/workflows/` directory
- [ ] Copied `daily-refresh-check.yml` to `.github/workflows/`
- [ ] Updated dashboard URL in `daily-refresh-check.yml` to match actual URL
- [ ] Committed all files
- [ ] Pushed to `main` branch

---

## Phase 5: GitHub Pages

- [ ] Navigated to repository → Settings → Pages
- [ ] Source set to "Deploy from a branch"
- [ ] Branch set to `main`, Folder set to `/ (root)`
- [ ] Saved Pages settings
- [ ] Waited 3–5 minutes
- [ ] Confirmed dashboard URL is accessible (HTTP 200)

---

## Phase 6: Firebase Auth Domain

- [ ] Firebase Console → Authentication → Settings → Authorized domains
- [ ] Added `<owner>.github.io` (replace with actual GitHub username)
- [ ] Confirmed domain is listed in authorized domains

---

## Phase 7: First Login Verification

- [ ] Navigated to dashboard URL
- [ ] Login page appeared (not blank, not error)
- [ ] Clicked "Continue with Google"
- [ ] No `auth/unauthorized-domain` error
- [ ] Admin user landed on dashboard (not pending page)
- [ ] "Sync Sheets" button is visible in header

---

## Phase 8: Data Sync Verification

- [ ] Clicked "Sync Sheets"
- [ ] Sync completed without error message
- [ ] Header shows non-zero Leads and Bookings
- [ ] Overview tab loaded with KPI cards
- [ ] Source Analysis tab shows data table
- [ ] Model Performance tab shows data
- [ ] Geo & Dealer tab shows data with: Dealer Code, Dealer, State, Region, City, Leads, Retail, Conv%
- [ ] Pivot Table tab loads

---

## Phase 9: Filter Verification

- [ ] Month filter: selecting a specific month updates all tabs
- [ ] Source filter: filtering by a source updates numbers
- [ ] Lead Type filter: works
- [ ] State filter: works
- [ ] "Clear" button resets filters (shows all data)

---

## Phase 10: Export Verification

- [ ] CSV export button on Source Analysis tab works
- [ ] Excel export produces a downloadable file
- [ ] Detailed CSV export works (for admin/full roles)

---

## Phase 11: Role Verification

- [ ] Admin user can access all 7 tabs
- [ ] Admin panel opens (user badge → admin panel icon)
- [ ] Can change another user's role in Admin panel

---

## Phase 12: Non-Admin User Verification

- [ ] Signed in with a non-admin `@girnarsoft.com` email
- [ ] New user lands on "Access Pending" page
- [ ] Upgraded role to `full` via Admin panel
- [ ] After role upgrade, user sees all tabs
- [ ] Downgraded to `viewer` — only 3 tabs visible (modelxsrc, statexsrc, geodealer)

---

## Phase 13: Daily Workflow

- [ ] GitHub Actions → daily-refresh-check workflow is visible
- [ ] Triggered manually to verify it runs
- [ ] Workflow completes with green checkmark

---

## Deployment Complete

When all items above are checked, the deployment is complete.

Document the following for handoff:
- Dashboard URL: `___________________________________`
- Firebase Project URL: `___________________________________`
- GitHub Repository URL: `___________________________________`
- Date deployed: `___________________________________`
- Deployed by: `___________________________________`
