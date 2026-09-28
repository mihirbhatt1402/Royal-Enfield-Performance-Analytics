# QA Checklist — Ather LDR Dashboard

Pre-deployment and post-deployment quality checklist. Work top to bottom; do not mark an item done until you have personally verified it.

---

## Phase 1: Pre-Deployment Checks (Before Touching Firebase)

### 1.1 Source File Integrity

- [ ] `ATHER_LDR_Dashboard_v1.0.html` is present and file size is approximately 278 KB
- [ ] File contains exactly one `<script>` block (lines 221–4298)
- [ ] File contains `ATHER_BUILD_TS = '2026-09-23T00:00Z'` (confirms correct version)
- [ ] File contains `ATHER_BUILD_FEATURES` array with `'auto-qa'` entry
- [ ] File does NOT contain `Retail Dispersion` as a visible tab (it exists in TABS array but is excluded in `visibleTabs`)

### 1.2 Firebase Config Edits (Critical)

- [ ] `apiKey` value has been replaced (not `'REPLACE_WITH_ATHER_API_KEY'`)
- [ ] `messagingSenderId` value has been replaced (not `'REPLACE_WITH_MESSAGING_SENDER_ID'`)
- [ ] `appId` value has been replaced (not `'REPLACE_WITH_APP_ID'`)
- [ ] `authDomain` matches Firebase project (`ather-ldr-dashboard.firebaseapp.com`)
- [ ] `projectId` matches Firebase project (`ather-ldr-dashboard`)
- [ ] `databaseURL` is set to the correct RTDB URL

### 1.3 Admin Email List (Critical)

- [ ] `ADMIN_EMAILS` contains exactly 3 entries:
  - [ ] `mihir.bhatt@girnarsoft.com`
  - [ ] `pooja.chowdhury@girnarsoft.com`
  - [ ] `aditya.kumar@girnarsoft.com`

### 1.4 Security Bug Fix (Critical)

- [ ] Line ~4247: fallback role is `'viewer'`, NOT `'full'`
- [ ] Verified: `var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'viewer';`

### 1.5 Data Source URLs

- [ ] `ATHER_LEAD_MASTER_BY_MONTH` contains entries for: May'2026, Jun'2026, Jul'2026, Aug'2026, Sep'2026
- [ ] Each spreadsheet URL is reachable (test: open URL in browser, should load sheet)
- [ ] `RETAIL_URL` points to the correct Retail Master spreadsheet
- [ ] `AUTO_SYNC_ON_LOAD` is set to `true`

---

## Phase 2: Firebase Setup Checks

### 2.1 Firebase Project

- [ ] Firebase project `ather-ldr-dashboard` created (or confirmed to exist)
- [ ] Blaze (pay-as-you-go) plan activated
- [ ] Firebase project is in the correct Google account

### 2.2 Authentication

- [ ] Google sign-in provider enabled in Firebase Console → Authentication → Sign-in method
- [ ] Authorized domain for GitHub Pages added (e.g., `yourusername.github.io`)
- [ ] Test: sign-in popup works without "auth/unauthorized-domain" error

### 2.3 Firestore

- [ ] Firestore database created in `ather-ldr-dashboard` project
- [ ] Production mode selected (not test mode)
- [ ] Firestore rules deployed from `firebase/firestore.rules`
- [ ] Rules file contains `ather_users` collection rules
- [ ] Rules file does NOT use open `allow read, write: if true;` rules

### 2.4 Realtime Database

- [ ] RTDB created in `ather-ldr-dashboard` project
- [ ] RTDB rules deployed from `firebase/realtime-database.rules.json`
- [ ] RTDB URL matches `FIREBASE_CONFIG.databaseURL`

---

## Phase 3: GitHub Repository Setup

### 3.1 Repository

- [ ] New public GitHub repository created (e.g., `ather-ldr-dashboard`)
- [ ] Repository is PUBLIC (required for GitHub Pages free tier)
- [ ] `ATHER_LDR_Dashboard_v1.0.html` pushed to repository root as `ATHER_LDR_Dashboard_v1.0.html`
- [ ] `index.html` (redirect file) pushed to repository root
- [ ] `.nojekyll` file present at repository root

### 3.2 GitHub Pages

- [ ] GitHub Pages enabled: Settings → Pages → Source → Deploy from branch → main → /root
- [ ] Pages URL confirmed (e.g., `https://yourusername.github.io/ather-ldr-dashboard/`)
- [ ] Pages URL added as authorized domain in Firebase Console

### 3.3 Redirect

- [ ] `index.html` redirects to `ATHER_LDR_Dashboard_v1.0.html`
- [ ] Navigating to the Pages root URL lands on the dashboard (not a 404)

---

## Phase 4: First Login Validation

### 4.1 Admin Sign-In

- [ ] Sign in as `mihir.bhatt@girnarsoft.com` (or whichever admin is testing)
- [ ] No JavaScript console errors on page load
- [ ] No "unauthorized-domain" error from Firebase Auth
- [ ] No "permission-denied" error from Firestore
- [ ] Dashboard renders — header visible with "Sync Sheets" button
- [ ] User document created in Firestore `ather_users` collection with `role: 'admin'`

### 4.2 Non-Admin Pending Check

- [ ] Sign in as a `@girnarsoft.com` non-admin user
- [ ] "Access Pending" page appears
- [ ] No data is accessible to the pending user
- [ ] User document created in Firestore with `role: 'pending'`

---

## Phase 5: Data Sync Validation

### 5.1 Manual Sync

- [ ] Click "Sync Sheets" button as admin
- [ ] Spinner appears, then "✓ Synced" banner appears
- [ ] No error messages displayed
- [ ] Header shows Leads count and Retail count

### 5.2 Count Validation (Tolerance ±20%)

- [ ] Leads count is between 50,000 and 75,000 (reference: ~60,504)
- [ ] Retail count is between 1,000 and 3,000 (reference: ~1,531)
- [ ] L2R% is between 1% and 5% (reference: ~2.5%)
- [ ] States count is between 20 and 35 (reference: 28)

### 5.3 Month Filter Check

- [ ] Month filter dropdown shows exactly 5 months:
  - [ ] May'2026
  - [ ] Jun'2026
  - [ ] Jul'2026
  - [ ] Aug'2026
  - [ ] Sep'2026
- [ ] No "Unknown" or malformed month entries

### 5.4 Auto-Sync on Page Load

- [ ] Reload the page while signed in
- [ ] Data loads automatically without clicking "Sync Sheets"

---

## Phase 6: Tab-by-Tab Validation

### 6.1 Overview Tab

- [ ] Tab renders without error
- [ ] KPI cards show non-zero values (Leads, Retail, L2R%, States)
- [ ] Chart renders (bar + line chart)
- [ ] RT toggle (All / DMS / C&O) is present and functional
- [ ] Monthly breakdown table renders

### 6.2 Source Analysis Tab

- [ ] Tab renders without error
- [ ] Table has exactly 8 columns: Source, Leads, Enquiries, L.Contrib%, Retail, R.Contrib%, L2R%, Non-Scope R
- [ ] Source rows include: ADWORDS, MS FB, WHATSAPP (paid); ORGANIC, NON MS (organic+non-MS)
- [ ] CSV export works (file downloads)
- [ ] Detailed CSV export works (admin/full role)

### 6.3 LT × Source Tab

- [ ] Tab renders without error
- [ ] Lead Type dimension visible (rows)
- [ ] Source dimension visible (columns or sub-rows)
- [ ] Numbers reconcile with Overview KPIs

### 6.4 Model Performance Tab

- [ ] Tab renders without error
- [ ] Rows show canonical model names: Ather Rizta, Ather 450X, Ather 450S, Ather 450 Apex
- [ ] No KONARC SR2/SR3 entries (out-of-scope models excluded from Retail attribution)
- [ ] Out-of-scope models appear in leads count but not in retail attribution

### 6.5 State Performance Tab

- [ ] Tab renders without error
- [ ] States appear as top-level rows
- [ ] Source breakdown expandable per state
- [ ] 28 states (or fewer if some states have no data in current months)
- [ ] No "Unknown State" rows (if reference data is correct)

### 6.6 Geo & Dealer Tab

- [ ] Tab renders without error
- [ ] Table has EXACTLY these columns: Dealer Code, Dealer, State, Region, City, Leads, Retail, Conv%
- [ ] NO columns named: AO, WIP, Direct Push, L1 Nurtured (these are explicitly excluded)
- [ ] Dealer data visible with correct hierarchy
- [ ] CSV/Excel export works

### 6.7 Pivot Table Tab

- [ ] Tab renders without error
- [ ] Row dimension selector works (Model, State, Source, City, etc.)
- [ ] Column dimension selector works
- [ ] Table rebuilds when dimensions change
- [ ] Export works

### 6.8 Retail Dispersion Tab (Must NOT Exist)

- [ ] Tab bar does NOT show "Retail Dispersion" tab
- [ ] Exactly 7 tabs visible for admin user: Overview, Source Analysis, LT × Source, Model Performance, State Performance, Geo & Dealer, Pivot Table

---

## Phase 7: Filter Validation

### 7.1 Month Filter

- [ ] Selecting one month reduces all counts to single-month values
- [ ] Selecting all months restores full totals
- [ ] Clearing month filter shows 0 results (FILTER_CLEARED sentinel behavior)

### 7.2 Source Filter

- [ ] Selecting one source reduces data to that source only
- [ ] Clearing source filter shows 0 results

### 7.3 State Filter

- [ ] Selecting one state filters State Performance and Geo & Dealer tabs
- [ ] Clearing state filter shows 0 results

### 7.4 Model Filter

- [ ] Selecting one model filters Model Performance tab
- [ ] Clearing model filter shows 0 results

### 7.5 Lead Mode Toggle

- [ ] `leadsMode = 'create'` — groups by lead creation month
- [ ] `leadsMode = 'update'` — groups booked leads by booking month (default)
- [ ] Toggle switch or control is visible and functional

---

## Phase 8: Role-Based Access Validation

### 8.1 Viewer Role

- [ ] Set a test user to `viewer` role in Firestore
- [ ] Sign in as that user
- [ ] Only 3 tabs visible: Model Performance, State Performance, Geo & Dealer
- [ ] Overview, Source Analysis, LT × Source, Pivot Table are hidden

### 8.2 Client Role

- [ ] Set a test user to `client` role in Firestore
- [ ] Sign in as that user
- [ ] Only 2 tabs visible: Model Performance, Geo & Dealer
- [ ] All other tabs hidden

### 8.3 Full Role

- [ ] Set a test user to `full` role in Firestore
- [ ] Sign in as that user
- [ ] 7 tabs visible (same as admin minus Admin Panel access)
- [ ] No Admin panel visible

### 8.4 Admin Role

- [ ] Admin user sees 7 tabs + Admin panel (person icon in header)
- [ ] Admin can change other users' roles via Admin panel
- [ ] Admin can see online presence strip in header

---

## Phase 9: Security Checks

### 9.1 Fallback Role

- [ ] Block Firestore in DevTools Network tab
- [ ] Sign in
- [ ] User gets `viewer` tabs (not full admin access)

### 9.2 Cross-User Isolation

- [ ] User A cannot read User B's Firestore document (permission-denied)
- [ ] User A cannot write to User B's RTDB presence node (permission-denied)

### 9.3 Source Code

- [ ] HTML source contains Firebase config values (expected)
- [ ] HTML source does NOT contain passwords, service account keys, or private tokens
- [ ] Google Sheet URLs are visible in source (expected — sheets are publicly shared)

---

## Phase 10: Known Limitations (Acceptable)

These items are known and do not constitute failures:

- [ ] **Noted:** Firebase config visible in HTML source (normal for client-side Firebase)
- [ ] **Noted:** Google Sheet URLs visible in HTML source (required for GViz CSV to work)
- [ ] **Noted:** Role-based tab hiding is UI-only; a developer with browser tools could inspect the React tree
- [ ] **Noted:** Anyone with Google Sheet URLs can access raw data without authentication

---

## Sign-Off

| Phase | Status | Tester | Date |
|-------|--------|--------|------|
| Phase 1: Pre-Deployment | | | |
| Phase 2: Firebase Setup | | | |
| Phase 3: GitHub Setup | | | |
| Phase 4: First Login | | | |
| Phase 5: Data Sync | | | |
| Phase 6: Tab Validation | | | |
| Phase 7: Filter Validation | | | |
| Phase 8: Role Access | | | |
| Phase 9: Security | | | |
| Phase 10: Known Limitations Noted | | | |

**Overall: PASS / FAIL** ___________

**Notes:**
