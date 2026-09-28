# Secrets and Credentials Required

This document lists everything that must be obtained or configured before the dashboard can go live.
None of these values are in the migration package — they come from the actual Firebase project.

---

## 1. Firebase Config Values (MANDATORY — dashboard won't load without these)

These three values must be obtained from the Firebase Console:

| Variable | Where to find it | Where to put it |
|----------|-----------------|-----------------|
| `apiKey` | Firebase Console → Project Settings → General → Your apps → Web app | Line ~4008 of `dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html` |
| `messagingSenderId` | Same location | Line ~4013 |
| `appId` | Same location | Line ~4014 |

**How to get them:**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open project `ather-ldr-dashboard`
3. Click the gear icon → Project Settings → General tab
4. Scroll to "Your apps" section → click the web app (or create one)
5. Copy the `firebaseConfig` object

**Current state in source:**
```js
var FIREBASE_CONFIG = {
  apiKey:            'REPLACE_WITH_ATHER_API_KEY',   // ← MUST REPLACE
  authDomain:        'ather-ldr-dashboard.firebaseapp.com',
  databaseURL:       'https://ather-ldr-dashboard-default-rtdb.firebaseio.com',
  projectId:         'ather-ldr-dashboard',
  storageBucket:     'ather-ldr-dashboard.firebasestorage.app',
  messagingSenderId: 'REPLACE_WITH_MESSAGING_SENDER_ID',  // ← MUST REPLACE
  appId:             'REPLACE_WITH_APP_ID',           // ← MUST REPLACE
};
```

---

## 2. ADMIN_EMAILS Update (MANDATORY — security and access depend on this)

The source file currently has only ONE admin email. Update to THREE:

**Current (wrong):**
```js
var ADMIN_EMAILS = ['mihir.bhatt@girnarsoft.com'];
```

**Required:**
```js
var ADMIN_EMAILS = [
  'pooja.chowdhury@girnarsoft.com',
  'mihir.bhatt@girnarsoft.com',
  'aditya.kumar@girnarsoft.com'
];
```

**Location:** Line ~4016 of `dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`

---

## 3. Auth Security Fix (MANDATORY — prevents unauthorized access)

**Location:** Lines ~4245–4247 of `dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`

**Current (insecure):**
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'full';
setRole(fallbackRole); setAuthState('authed');
```

**Required fix:**
```js
// On Firestore error, keep user in pending state (do NOT grant 'full' to unknown users)
setRole('pending'); setAuthState('pending');
```

---

## 4. Google Sheets Access (MANDATORY — data won't load without this)

Each of the following sheets must be shared as "Anyone with the link → Viewer":

**Lead Master sheets (5 sheets):**
- May'2026: `https://docs.google.com/spreadsheets/d/1jnhdvPUEefW7HrD44ffvH2k3v0eUe2JGolXkX6EIKbQ/...`
- Jun'2026: `https://docs.google.com/spreadsheets/d/1qAvzs6ucsPtk3joTsYeHijk2Tx_JRcCBsXzKDbnEOPc/...`
- Jul'2026: `https://docs.google.com/spreadsheets/d/1t29vI-JdKu7HDaaLX33N3wFnhylFLbOkwPhyWc6ZKiA/...`
- Aug'2026: `https://docs.google.com/spreadsheets/d/1WgyRvNW02UxCYyhQDLfaFa86RciciSeGXeQmBF7ymIg/...`
- Sep'2026: `https://docs.google.com/spreadsheets/d/1MdlYzXsJ1rAZ1PfVDNXE7n8IGaHQuoW25QHh3tq6XRc/...`

**Retail Master sheet:**
- `https://docs.google.com/spreadsheets/d/1gnVRakNMws0OjshRTVYTeSFQkJlnt4IvDMEAzuakl4M/...`

**How to share each sheet:**
1. Open the spreadsheet in Google Sheets
2. Click Share → Change to "Anyone with the link" → Set to "Viewer"
3. Click Done

---

## 5. Firebase Admin Initial Sign-In (MANDATORY — creates first admin account)

After deployment, one of the admin emails must sign in first to initialize their Firestore document.
This cannot be automated — a person must physically sign in.

---

## 6. GitHub Pages (MANDATORY — deployment target)

The repository must have GitHub Pages enabled:
1. GitHub → Repository Settings → Pages
2. Source: "Deploy from a branch"
3. Branch: `main` / root `/`

The deployed URL will be: `https://<owner>.github.io/<repo>/`

---

## Summary Checklist

- [ ] Firebase config: `apiKey`, `messagingSenderId`, `appId` replaced in source
- [ ] `ADMIN_EMAILS` updated to three addresses in source
- [ ] Auth security fix applied (fallbackRole → pending)
- [ ] All 6 Google Sheets shared as "Anyone with link → Viewer"
- [ ] Firebase Auth → Google provider enabled
- [ ] Firestore rules deployed
- [ ] RTDB rules deployed
- [ ] GitHub Pages enabled on repository
- [ ] GitHub Pages domain added to Firebase Auth authorized domains
- [ ] Admin sign-in verified
