# Troubleshooting Guide

Common issues and their solutions.

---

## Authentication Issues

### `auth/unauthorized-domain`

**Symptom:** Google Sign-In popup shows "This domain is not authorised to run this operation."

**Cause:** The GitHub Pages domain (`<owner>.github.io`) has not been added to Firebase Auth authorized domains.

**Fix:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Click "Add domain"
3. Enter: `<owner>.github.io` (the exact GitHub username, not a full URL)
4. Click Add
5. Retry login — takes effect immediately

---

### "Access Pending" after login

**Symptom:** User signs in successfully but sees "Access Pending" page.

**Cause:** The user's Firestore document exists with `role: "pending"`.

**Fix (for admin user managing others):**
1. Sign in as an admin
2. Click the user avatar/badge in the top right
3. Click "User Access Management" icon
4. Find the user by email
5. Change role from `pending` to `viewer`, `full`, or `admin`

**Fix (for first-time admin — if admin user also gets pending):**
The `ADMIN_EMAILS` array was not updated. Check that your email is in the array at line ~4016.
If not, edit the source file, add your email, commit and push.

---

### Popup blocked by browser

**Symptom:** Sign-in button does nothing, or error says "Pop-up blocked."

**Fix:**
1. Allow popups for the dashboard domain in browser settings
2. On Chrome: click the popup-blocked icon in address bar → allow
3. Try again

---

### Auth loop / infinite loading

**Symptom:** Page shows "Authenticating…" indefinitely.

**Possible causes:**
1. Firebase config is wrong (`apiKey` is still the placeholder value)
2. Firebase project doesn't exist yet
3. Firebase Auth is not enabled

**Fix:**
1. Open browser DevTools → Console
2. Look for Firebase error messages
3. If `apiKey` is `REPLACE_WITH_ATHER_API_KEY` — the source file edits weren't applied
4. If "app/no-app" error — Firebase project name mismatch

---

## Data Sync Issues

### "Access denied — share sheet as Anyone → Viewer"

**Symptom:** Sync fails with this specific error message.

**Cause:** The Google Sheet is not publicly shared.

**Fix:**
1. Open the Google Sheet
2. Click Share → Change to "Anyone with the link" → Viewer
3. Copy the URL and verify it matches what's in `ATHER_LEAD_MASTER_BY_MONTH`
4. Retry sync

---

### "Sheet returned HTML"

**Symptom:** Sync error says "Sheet returned HTML."

**Cause:** The GViz CSV export URL returns an HTML login/error page — usually because the sheet is private.

**Fix:** Same as above — share the sheet publicly.

---

### "No Lead Master sheets configured"

**Symptom:** Sync fails immediately with this error.

**Cause:** `ATHER_LEAD_MASTER_BY_MONTH` object is empty.

**Fix:** Check that the month entries are in the source file (around line 232):
```js
const ATHER_LEAD_MASTER_BY_MONTH = {
  "May'2026": "https://...",
  ...
};
```

---

### Sync completes but shows 0 leads

**Symptom:** Sync button disappears (no error) but dashboard shows 0 leads.

**Possible causes:**
1. The sheet's `lead_month` column uses a format not recognized by `normalizeAtherMonth`
2. The `duplicate check` column is not `"Unique"` for any row
3. All leads are before the data cutoff (01-May-2026)

**Debug steps:**
1. Open browser DevTools → Console
2. Look for `[ATHER LDR] Lead Master actual columns:` log — confirms column detection
3. Look for `[ATHER QA]` logs — shows counts at each processing stage
4. Try: `window.atherRetailDiag()` in the console after sync

---

### Leads show but Retail shows 0

**Symptom:** Lead count is correct but Retail column is always 0.

**Possible causes:**
1. The Retail Master sheet URL is wrong or sheet is private
2. The join key column in Retail Master is not being found
3. The `performance_month` column format is not recognized
4. All purchased models map to out-of-scope (KONARC, etc.)

**Debug:**
1. Console → look for `[ATHER LDR] Retail Master actual columns:` log
2. Verify the Retail Master sheet has a column matching aliases for `sourceLeadId`
   (e.g., `sourcelead id`, `lead id`, `opty_id`)
3. Check that `performance_month` values match `Mon'YYYY` format after normalization

---

### Non-Scope Retail is 0

**Symptom:** The "Non-Scope R" column in Source Analysis is always 0.

**This may be expected:** Non-Scope retail only counts rows where `d < 0 || d > 2` OR purchased model is out-of-scope. If all retail records meet the d=0,1,2 criterion with in-scope models, this column will be 0.

---

## GitHub Pages Issues

### Page shows 404

**Symptom:** Dashboard URL returns 404.

**Possible causes:**
1. GitHub Pages hasn't been enabled yet
2. Pages is enabled but branch/folder is wrong
3. Pages deployment hasn't completed yet (wait 5 minutes)
4. The file path is wrong (case-sensitive on Linux-based GitHub Pages)

**Fix:**
1. Verify repository → Settings → Pages shows "Your site is published at..."
2. Verify the file is at `ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html` (exact case)
3. Verify `.nojekyll` exists at repository root

---

### Page shows raw HTML code

**Symptom:** Browser shows the HTML source instead of rendering the page.

**Cause:** This should not happen with GitHub Pages unless MIME type is wrong. If it does, check the file extension is `.html`.

---

### Underscores in filenames are excluded

**Symptom:** Some files return 404, specifically files with underscores in the name.

**Cause:** `.nojekyll` file is missing.

**Fix:** Create an empty `.nojekyll` file at the repository root:
```bash
touch .nojekyll
git add .nojekyll
git commit -m "Add .nojekyll"
git push
```

---

## Dashboard UI Issues

### Blank white page

**Symptom:** Dashboard URL loads but shows only a white page.

**Possible causes:**
1. JavaScript error on load
2. Firebase config not filled in (still has placeholder values)
3. React script not loaded (CDN failure)

**Debug:**
1. Open DevTools → Console
2. Look for red errors
3. If "REPLACE_WITH_ATHER_API_KEY" appears in errors → edit source file

---

### "Retail Dispersion" tab is missing (expected)

**Correct behavior.** The Retail Dispersion tab (`dispersion`) is in the TABS array but the
`visibleTabs` computed value excludes it for all production roles. This is intentional.
Do NOT add it back to `visibleTabs`.

---

### Filters not updating data

**Symptom:** Changing a filter doesn't update the table/charts.

**This is usually a UX expectation issue.** Filters take effect immediately in all tables.
However, some tables may need to be scrolled into view to see the updated data.

If filters truly have no effect, check the browser console for React errors.

---

### Export buttons do nothing

**Symptom:** Clicking CSV or Excel export produces no file download.

**Possible causes:**
1. Browser is blocking downloads
2. SheetJS (XLSX) library failed to load from CDN

**Fix:**
1. Check browser's download blocking settings
2. Open DevTools → Network tab → look for failed CDN requests
3. If `https://cdn.sheetjs.com/...` is blocked, the Excel export will fail silently

---

## Firebase Console Issues

### "Permission denied" when reading Firestore

**Symptom:** Console shows Firestore permission errors.

**Cause:** The Firestore rules don't match the collection structure, OR the user is not authenticated.

**Fix:** Verify rules match the template in `firebase/firestore.rules`. Key rule: users can only read their own `ather_users/{uid}` document.

---

### Users can't change their own role

**Correct behavior.** Users cannot change their own role. Only admins can change roles via the Admin panel (or directly in Firestore console).

---

### Admin panel shows no users

**Symptom:** Admin panel opens but shows no users in the list.

**Cause:** Firestore rules may not allow admin to read all documents.

**Fix:** Verify `firebase/firestore.rules` is deployed correctly. The admin rule is:
```
allow read: if isAdmin();
```
where `isAdmin()` checks the requesting user's email against `ADMIN_EMAILS`.

---

## Common Errors Quick Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `auth/unauthorized-domain` | Domain not in Firebase Auth | Add domain to authorized domains |
| `auth/popup-blocked` | Browser blocked popup | Allow popups |
| `auth/network-request-failed` | Network issue | Check connection |
| `Permission denied` in console | Firestore rules | Deploy correct rules |
| `app/no-app` | Firebase init failed | Check config values |
| `sheet returned HTML` | Sheet is private | Share publicly |
| `0 leads after sync` | Column name mismatch | Check console logs |
| White page | JS error | Check console |
| 404 on dashboard | Pages not enabled or path wrong | Check Pages settings |
