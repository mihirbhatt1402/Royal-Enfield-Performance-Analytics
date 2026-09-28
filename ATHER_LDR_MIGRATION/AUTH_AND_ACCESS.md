# Authentication and Access Control

## Overview

The dashboard uses Firebase Auth (Google Sign-In) for authentication and Firestore for role-based access control.

---

## Authentication Flow

1. User visits the dashboard URL
2. `AuthGate` component checks Firebase Auth state
3. If `authState === 'loading'` → shows "Authenticating…" spinner
4. If `authState === 'unauth'` → shows `LoginPage` (Google Sign-In button)
5. User clicks "Sign in with Google" → `signInWithPopup` with `GoogleAuthProvider`
   - Provider configured with `prompt: 'select_account'` (always shows account picker)
6. On successful sign-in → `handleUser()` is called
7. `ensureUserDoc(user)` creates the Firestore document if it doesn't exist:
   - New user: `{ email, displayName, photoURL, role: 'pending', createdAt }`
   - Admin email: `{ ..., role: 'admin' }` 
8. Firestore `onSnapshot` listener watches `ather_users/{uid}` for role changes
9. If role is `'pending'` → shows `PendingPage`
10. If role is any other value → shows the dashboard

---

## Roles and Access

| Role | Dashboard | Tab Access | Column Detail | Admin Panel |
|------|-----------|-----------|---------------|-------------|
| `pending` | No | None | N/A | No |
| `viewer` | Yes | All 7 tabs | Totals only (no source breakdown columns) | No |
| `full` | Yes | All 7 tabs | All columns | No |
| `admin` | Yes | All 7 tabs | All columns | Yes |
| `client` | Yes | 2 tabs only (Model Performance, Geo & Dealer) | All columns | No |

**Tab visibility per role (from source lines ~3875–3882):**
```js
// client: only model performance + geo & dealer
if (clientMode) tabs = TABS.filter(t => ['modelxsrc', 'geodealer'].includes(t.id));
// viewer: model performance + state performance + geo & dealer
else if (viewerMode) tabs = TABS.filter(t => ['modelxsrc', 'statexsrc', 'geodealer'].includes(t.id));
// full/admin: all tabs (minus dispersion which is removed per deployment requirements)
else tabs = TABS;
```

---

## Admin Identity

Admin identity is determined **only** by comparing the Firebase Auth token email against `ADMIN_EMAILS`:

```js
var ADMIN_EMAILS = [
  'pooja.chowdhury@girnarsoft.com',
  'mihir.bhatt@girnarsoft.com',
  'aditya.kumar@girnarsoft.com'
];

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email);
}
```

**Key design principle:** The stored `role` field in Firestore is NEVER used to determine admin identity.
Firestore rules use `request.auth.token.email` directly — not the stored role.

---

## Security Bug (MUST FIX BEFORE PRODUCTION)

**Location:** Lines ~4245–4247 of `ATHER_LDR_Dashboard_v1.0.html`

**Current code (insecure):**
```js
var fallbackRole = isAdminEmail(user.email) ? 'admin' : 'full';
setRole(fallbackRole);
setAuthState('authed');
```

**Problem:** If Firestore returns a `permission-denied` error when reading the user's role, this code
grants `role='full'` to ANY authenticated Google user. An attacker who signs in with any Google account
would get full dashboard access if the Firestore read fails.

**Required fix:**
```js
// Keep the user in 'pending' state on Firestore error — do NOT grant access
setRole('pending');
setAuthState('pending');
```

**After the fix:** A Firestore error leaves the user on the "Access Pending" page. They cannot access
the dashboard until an admin approves them AND Firestore is accessible.

---

## Firebase Auth Config Variables

```js
var USERS_COL    = 'ather_users';    // Firestore collection name
var PRESENCE_PATH = 'ather_presence'; // RTDB path prefix
```

---

## ALLOWED_DOMAINS

The source defines `ALLOWED_DOMAINS = ['@girnarsoft.com', '@girnarcare.com']` but this is **informational only**
— it is not actively enforced by the JavaScript code. All users who sign in start as `pending` and
cannot access the dashboard until an admin approves them regardless of domain.

---

## Presence (Online Users)

Online presence is tracked via Firebase RTDB at path `ather_presence/{uid}`:
- Created on sign-in via `setupPresence(user)`
- Node fields: `{ uid, email, name, photo, ts }`
- Removed automatically on disconnect via `onDisconnect().remove()`
- Displayed in the header as user avatars (PresenceStrip component)
