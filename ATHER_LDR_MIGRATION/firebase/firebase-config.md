# Firebase Configuration

The dashboard source file (`source/ATHER_LDR_Dashboard_v1.0.html`) contains placeholder values for the Firebase
API key, messaging sender ID, and app ID. These **must be replaced** before deployment.

## Current State in Source File (lines ~4007–4015)

```js
var FIREBASE_CONFIG = {
  apiKey:            'REPLACE_WITH_ATHER_API_KEY',
  authDomain:        'ather-ldr-dashboard.firebaseapp.com',
  databaseURL:       'https://ather-ldr-dashboard-default-rtdb.firebaseio.com',
  projectId:         'ather-ldr-dashboard',
  storageBucket:     'ather-ldr-dashboard.firebasestorage.app',
  messagingSenderId: 'REPLACE_WITH_MESSAGING_SENDER_ID',
  appId:             'REPLACE_WITH_APP_ID',
};
var ADMIN_EMAILS = ['mihir.bhatt@girnarsoft.com'];
```

## ⚠ TWO MANDATORY CHANGES BEFORE DEPLOYMENT

### 1. Replace Firebase config placeholders

Go to Firebase Console → Project Settings → General → "Your apps" → Web app.
Copy the actual config values and replace the three `REPLACE_WITH_*` strings.

### 2. Update ADMIN_EMAILS

The source currently has only one admin email. Per requirements, it must have three:

```js
var ADMIN_EMAILS = [
  'pooja.chowdhury@girnarsoft.com',
  'mihir.bhatt@girnarsoft.com',
  'aditya.kumar@girnarsoft.com'
];
```

This is the **only** change needed in the dashboard source (besides the config placeholders).

## What each field is for

| Field | Value | Purpose |
|-------|-------|---------|
| `apiKey` | obtained from Console | Identifies the Firebase app — NOT a secret (security is in rules) |
| `authDomain` | `ather-ldr-dashboard.firebaseapp.com` | OAuth redirect domain for Google Sign-In |
| `databaseURL` | `https://ather-ldr-dashboard-default-rtdb.firebaseio.com` | Realtime Database URL |
| `projectId` | `ather-ldr-dashboard` | Firebase project identifier |
| `storageBucket` | `ather-ldr-dashboard.firebasestorage.app` | Not used by this dashboard |
| `messagingSenderId` | obtained from Console | Not used (Cloud Messaging not enabled) |
| `appId` | obtained from Console | Web app registration identifier |

## Firebase Services Used

| Service | Used for | Required |
|---------|---------|----------|
| Firebase Auth (Google provider) | User authentication | Yes |
| Firestore | User role storage (`ather_users`) | Yes |
| Realtime Database | Online presence (`ather_presence`) | Yes |
| Firebase Storage | Not used | No |
| Cloud Functions | Not used | No |
| Analytics | Not used | No |

## ALLOWED_DOMAINS

The source also defines:
```js
var ALLOWED_DOMAINS = ['@girnarsoft.com', '@girnarcare.com'];
```

**Note:** This variable is **defined but not actively enforced** in the JavaScript application code.
Access control is enforced via Firestore — new users start with `role: 'pending'` and cannot access
the dashboard until an admin promotes them. The `ALLOWED_DOMAINS` variable is informational documentation
of the intended email domain policy; actual domain enforcement would require Firebase Auth email domain restrictions.
