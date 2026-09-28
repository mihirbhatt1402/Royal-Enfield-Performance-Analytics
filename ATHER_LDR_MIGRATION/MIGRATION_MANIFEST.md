# Migration Manifest

## Complete File Listing

All files in this migration package, with descriptions.

---

### Root Level

| File | Description |
|------|-------------|
| `README.md` | Package overview and quick start |
| `TARGET_CLAUDE_PROMPT.md` | **MAIN PROMPT** — give to Claude for end-to-end deployment |
| `MIGRATION_MANIFEST.md` | This file — complete file listing |
| `SETUP_CHECKLIST.md` | Step-by-step deployment checklist |
| `TROUBLESHOOTING.md` | Common issues and solutions |
| `SECRETS_REQUIRED.md` | All credentials needed before deployment |
| `AUTH_AND_ACCESS.md` | Auth flow, role system, security bug |
| `ARCHITECTURE.md` | Technical architecture reference |
| `DATA_SOURCES.md` | Google Sheets URLs and data source config |
| `AUDIT_ANSWERS.md` | Answers to 19 technical audit questions |

---

### source/

| File | Description | Status |
|------|-------------|--------|
| `source/ATHER_LDR_Dashboard_v1.0.html` | Complete dashboard source — 4,300 lines, 278KB. Requires 3 edits before deploy (Firebase config, admin emails, security bug fix). | **COMPLETE — REQUIRES 3 EDITS** |
| `source/index.html` | Root redirect: `<meta http-equiv="refresh">` pointing to the dashboard. Goes in repo root. | Complete |

---

### firebase/

| File | Description |
|------|-------------|
| `firebase/firestore.rules` | Production Firestore security rules. Path A: user reads own doc. Path B: user writes own doc (cannot self-assign admin). Path C: admin reads all docs. |
| `firebase/realtime-database.rules.json` | RTDB rules. Each user can only read/write their own `ather_presence/{uid}` node. Admins can read all. |
| `firebase/firebase-config.md` | Explains which config values are placeholders vs. hardcoded, and what ALLOWED_DOMAINS means. |
| `firebase/firebase-setup.md` | Step-by-step Firebase project setup: Auth, Firestore, RTDB, authorized domains. |
| `firebase/firestore-schema.md` | `ather_users` collection schema: fields, types, allowed values, admin vs. user doc differences. |
| `firebase/rtdb-schema.md` | `ather_presence/{uid}` node schema: fields and lifecycle. |

---

### github/

| File | Description |
|------|-------------|
| `github/workflows/daily-refresh-check.yml` | GitHub Actions workflow that checks dashboard URL returns HTTP 200 at 04:00 UTC (09:30 IST) daily. Update the URL after deployment. |
| `github/pages-setup.md` | How to enable GitHub Pages (branch: main, folder: root). Includes .nojekyll requirement, URL structure, custom domain guide. |
| `github/repository-setup.md` | Repository creation, file structure, initial commit, branch setup. |

---

### data/

| File | Description |
|------|-------------|
| `data/lead-master-schema.md` | Lead Master column names, aliases, deduplication logic, date cutoff, month normalization, state canonicalization, source classification. |
| `data/retail-master-schema.md` | Retail Master join key, columns, brand filter, retail attribution rules (d=0,1,2), canonical model map, non-scope retail. |
| `data/data-source-configuration.md` | `ATHER_LEAD_MASTER_BY_MONTH` and `ATHER_SHEETS_CONFIG` objects, URL conversion to GViz CSV, adding/removing months. |

---

### config/

| File | Description |
|------|-------------|
| `config/app-config.md` | All hardcoded application config values: Firebase project ID, collection names, data cutoff, scope models, tab list, font scale range. |

---

### validation/

| File | Description |
|------|-------------|
| `validation/FUNCTIONAL_TESTS.md` | Functional test suite — 25 tests covering auth, sync, filter, tabs, export, and data accuracy. |
| `validation/SECURITY_TESTS.md` | Security test suite — 15 tests covering Firestore rules, RTDB rules, auth bypass, and role enforcement. |
| `validation/QA_CHECKLIST.md` | QA checklist — items to verify before calling deployment complete. |

---

## Files NOT Included (By Design)

| What | Why |
|------|-----|
| `.env` files | No environment variables used — config is inline in the HTML |
| `package.json` | No build system — pure static HTML |
| Firebase credentials JSON | Must be fetched from Firebase Console after project creation |
| Google Sheets data | Live sheets accessed at runtime via GViz CSV URLs |

---

## Source File Audit Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| Firebase config | Requires edit | 3 placeholder values need real values |
| Admin emails | Requires edit | Source has 1 email; deployment needs 3 |
| Security bug | Requires fix | Fallback role must be `'viewer'` not `'full'` |
| Retail Dispersion tab | In TABS array | Excluded by visibleTabs logic — do NOT add back |
| All 4300 lines | Copied | `source/ATHER_LDR_Dashboard_v1.0.html` is the complete file |
| Data cutoff | Hardcoded | `new Date(2026, 4, 1)` — 01-May-2026 |
| Sheet URLs | Hardcoded | In `ATHER_LEAD_MASTER_BY_MONTH` near line 232 |

---

## Checksum Reference

The source file (`source/ATHER_LDR_Dashboard_v1.0.html`) should be 4,300 lines and approximately 278KB.
If it is shorter, the copy may be truncated — re-copy from the source repository.
