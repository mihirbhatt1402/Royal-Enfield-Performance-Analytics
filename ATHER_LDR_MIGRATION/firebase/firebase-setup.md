# Firebase Setup Guide

Step-by-step instructions for setting up the Firebase project for the Ather LDR Dashboard.

## Prerequisites

- Access to Firebase project `ather-ldr-dashboard` (or create a new one)
- Firebase CLI installed: `npm install -g firebase-tools`
- Admin Google account: `pooja.chowdhury@girnarsoft.com`, `mihir.bhatt@girnarsoft.com`, or `aditya.kumar@girnarsoft.com`

---

## Step 1: Firebase Project Access

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open project `ather-ldr-dashboard`
3. Confirm you have Owner or Editor role

---

## Step 2: Enable Google Authentication

1. Firebase Console → Authentication → Sign-in method
2. Click "Google" → Enable → Save
3. Set project support email (use an admin email)
4. **Do NOT** add other sign-in providers

---

## Step 3: Create Firestore Database

1. Firebase Console → Firestore Database → Create database
2. Choose **Production mode** (not Test mode)
3. Select a region close to users (e.g., `asia-south1` for India)
4. Click Done

---

## Step 4: Deploy Firestore Security Rules

```bash
firebase login
firebase use ather-ldr-dashboard
firebase deploy --only firestore:rules
```

Or paste the contents of `firebase/firestore.rules` directly in:
Firebase Console → Firestore → Rules → Edit rules → Publish

---

## Step 5: Enable Realtime Database

1. Firebase Console → Realtime Database → Create database
2. Choose **Locked mode** (we'll set rules next)
3. Select region (e.g., `us-central1` — note the URL this creates)
4. If the URL differs from `https://ather-ldr-dashboard-default-rtdb.firebaseio.com`,
   update the `databaseURL` in `FIREBASE_CONFIG`

---

## Step 6: Deploy RTDB Security Rules

```bash
firebase deploy --only database
```

Or paste the contents of `firebase/realtime-database.rules.json` in:
Firebase Console → Realtime Database → Rules → Edit → Publish

---

## Step 7: Get Web App Config

1. Firebase Console → Project Settings → General
2. Scroll to "Your apps" → Add app → Web (`</>`)
3. Register app name: "Ather LDR Dashboard"
4. Copy the `firebaseConfig` object
5. Update `FIREBASE_CONFIG` in `dashboard/ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`

---

## Step 8: Add Authorized Domain

After deploying to GitHub Pages:

1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your GitHub Pages domain: `<username>.github.io`
3. Also add your custom domain if applicable

---

## Step 9: Initial Admin Sign-In

1. Open the deployed dashboard
2. Sign in with `pooja.chowdhury@girnarsoft.com`, `mihir.bhatt@girnarsoft.com`, or `aditya.kumar@girnarsoft.com`
3. The `ensureUserDoc` function will create the admin's Firestore document with `role: 'admin'`
4. Verify in Firebase Console → Firestore → `ather_users` collection

---

## Step 10: Grant Access to Other Users

1. Ask other users to sign in (they'll see "Access Pending")
2. Go to the Admin Panel (⚙ button in the header)
3. Find each user in the list and assign their role:
   - `viewer` — sees all tabs, totals only (no source breakdowns)
   - `full` — sees all tabs with full data
   - `client` — sees only Model Performance and Geo & Dealer tabs
   - `admin` — full access + Admin Panel (only assignable via Firebase Console)
