# Security Test Suite

15 security tests to verify access control and data protection.

---

## Firestore Rules Tests

### ST-01: User Cannot Read Another User's Document
- **Method:** Authenticated as user A, try to read `ather_users/{uid_B}`
- **Expected:** Firestore permission denied
- **Test:** In browser console: `firebase.firestore().collection('ather_users').doc('some_other_uid').get()`
- **Pass if:** Promise rejects with `permission-denied`

### ST-02: User Cannot Self-Assign Admin Role
- **Method:** Authenticated as non-admin, try to update own document with `role: 'admin'`
- **Expected:** Firestore write denied
- **Test:** `firebase.firestore().collection('ather_users').doc(uid).update({role: 'admin'})`
- **Pass if:** Promise rejects with `permission-denied`

### ST-03: Admin Can Read All Documents
- **Method:** Authenticated as admin, list `ather_users` collection
- **Expected:** Returns all user documents
- **Test:** `firebase.firestore().collection('ather_users').get()`
- **Pass if:** Returns array with multiple documents

### ST-04: Unauthenticated Cannot Read Firestore
- **Method:** Not signed in, attempt to read `ather_users/{uid}`
- **Expected:** Permission denied
- **Pass if:** Rejected before any data is returned

### ST-05: Admin Cannot Be Demoted by Regular User
- **Method:** Authenticated as non-admin user, try to update admin user's document
- **Expected:** Firestore write denied
- **Pass if:** Promise rejects with `permission-denied`

---

## RTDB Rules Tests

### ST-06: User Cannot Write to Another User's Presence
- **Method:** Authenticated as user A, try to write to `ather_presence/{uid_B}`
- **Expected:** RTDB permission denied
- **Test:** `firebase.database().ref('ather_presence/some_other_uid').set({fake: true})`
- **Pass if:** Rejected

### ST-07: User Can Write Own Presence
- **Method:** Authenticated as user A, write to `ather_presence/{uid_A}`
- **Expected:** Succeeds
- **Pass if:** No error

### ST-08: Unauthenticated Cannot Write Presence
- **Method:** Not signed in, try to write presence node
- **Expected:** Permission denied
- **Pass if:** Rejected

---

## Auth Tests

### ST-09: Fallback Role Is Viewer (Security Bug Fixed)
- **Method:** Simulate Firestore failure during role lookup (e.g., block Firestore in DevTools)
- **Expected:** User gets `viewer` role, not `full`
- **Test:** Open DevTools → Network → block `firestore.googleapis.com` → sign in
- **Pass if:** User sees limited tabs (viewer role tabs, not all tabs)

### ST-10: Admin Emails List Is Complete
- **Method:** Check the source file's `ADMIN_EMAILS` array
- **Expected:** Contains exactly: `mihir.bhatt@girnarsoft.com`, `pooja.chowdhury@girnarsoft.com`, `aditya.kumar@girnarsoft.com`
- **Pass if:** All 3 emails present in the array

### ST-11: Non-GirnarSoft Email Cannot Access Dashboard
- **Method:** Sign in with a Gmail or non-GirnarSoft address
- **Expected:** User gets `pending` role and sees "Access Pending" page
- **Pass if:** No dashboard data is accessible

### ST-12: Signed-Out User Cannot Access Data
- **Method:** Sign out, then navigate directly to dashboard URL
- **Expected:** Login page, no data visible
- **Pass if:** No data tables or charts rendered before sign-in

---

## Data Exposure Tests

### ST-13: Firebase Config Visible in Source (Expected/Acceptable)
- **Method:** View dashboard HTML source in browser
- **Observation:** Firebase config values (`apiKey`, etc.) are visible
- **Status:** This is EXPECTED behavior for client-side Firebase apps
- **Mitigation:** Security is enforced by Firestore rules + RTDB rules, not by hiding config
- **Pass if:** Config values are present (confirms edits were applied)

### ST-14: Google Sheet URLs Visible in Source
- **Method:** View dashboard HTML source in browser
- **Observation:** Sheet URLs are visible
- **Status:** Expected — sheets must be publicly accessible for GViz CSV to work
- **Pass if:** URLs are present and match expected sheets

### ST-15: No Credentials in HTML Source
- **Method:** Search HTML source for patterns like passwords, tokens, service account keys
- **Expected:** No credentials found
- **Pass if:** Only Firebase config values (which are not credentials) are present

---

## Security Test Results Template

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| ST-01 | | | |
| ST-02 | | | |
| ST-03 | | | |
| ST-04 | | | |
| ST-05 | | | |
| ST-06 | | | |
| ST-07 | | | |
| ST-08 | | | |
| ST-09 | | | |
| ST-10 | | | |
| ST-11 | | | |
| ST-12 | | | |
| ST-13 | | | |
| ST-14 | | | |
| ST-15 | | | |

---

## Security Architecture Summary

The dashboard uses a defense-in-depth approach:

1. **Firebase Auth (Layer 1):** Only Google accounts with authorized domain can initiate sign-in
2. **Firestore Rules (Layer 2):** Users can only read their own document; admins use email-verified rules
3. **Role-Based UI (Layer 3):** React code hides tabs based on Firestore role
4. **Data Access (Layer 4):** No server-side API — data comes from publicly shared Google Sheets

**Known limitation:** The role-based tab hiding is a UI-only control. A determined user could inspect and modify the React component tree to see hidden tabs. For stronger data security, consider a server-side API that enforces role-based filtering.

**Not protected by this architecture:**
- Someone who knows the Google Sheet URLs can access the raw data without authentication
- Firebase config values are visible in the page source (this is normal and expected)
