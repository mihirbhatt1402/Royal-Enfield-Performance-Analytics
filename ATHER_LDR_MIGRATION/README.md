# Ather LDR Dashboard — Complete Migration Package

## What Is This?

This is a self-contained migration package for the **Ather LDR (Lead Disposition Report) Dashboard** —
a single-page React analytics dashboard for Ather Energy lead and retail data.

A colleague (or their Claude) can use this package, together with `TARGET_CLAUDE_PROMPT.md`, to
recreate and deploy the dashboard end-to-end in a completely fresh environment.

## Quick Start

1. Read `TARGET_CLAUDE_PROMPT.md` — share it with Claude as the deployment prompt
2. Collect the credentials listed in `SECRETS_REQUIRED.md`
3. Follow `SETUP_CHECKLIST.md` for a step-by-step deployment walkthrough

## What's Included

| Directory/File | Contents |
|----------------|----------|
| `source/` | Complete dashboard HTML (4,300 lines) + root redirect |
| `firebase/` | Firestore rules, RTDB rules, setup guides, schemas |
| `github/` | GitHub Pages setup, repository setup, daily workflow |
| `data/` | Lead Master schema, Retail Master schema, data source config |
| `config/` | Application config reference |
| `validation/` | Functional tests, security tests, QA checklist |
| `TARGET_CLAUDE_PROMPT.md` | **Main prompt** — give this to Claude for deployment |
| `MIGRATION_MANIFEST.md` | Complete file manifest with descriptions |
| `SETUP_CHECKLIST.md` | Step-by-step deployment checklist |
| `TROUBLESHOOTING.md` | Common issues and solutions |
| `SECRETS_REQUIRED.md` | All credentials needed before deployment |
| `AUTH_AND_ACCESS.md` | Auth flow, roles, security bug documentation |
| `ARCHITECTURE.md` | Technical architecture overview |
| `DATA_SOURCES.md` | Google Sheets URLs and data source config |
| `AUDIT_ANSWERS.md` | Answers to 19 technical audit questions |

## Source Repository

- **Repo:** `mihirbhatt1402/Ather-Lead-performance-dashboard`
- **Branch:** `main`
- **File:** `ATHER_LDR/ATHER_LDR_Dashboard_v1.0.html`
- **Build date:** 2026-09-23

## Key Facts

- **Firebase project:** `ather-ldr-dashboard`
- **Admin emails:** `mihir.bhatt@girnarsoft.com`, `pooja.chowdhury@girnarsoft.com`, `aditya.kumar@girnarsoft.com`
- **Deployment method:** GitHub Pages (static, no build step)
- **Data source:** Google Sheets via GViz CSV export (no auth required on sheet side)
- **Months covered:** May 2026 – Sep 2026 (add more in `ATHER_LEAD_MASTER_BY_MONTH`)
- **Tabs:** 7 (Overview, Source Analysis, LT×Source, Model Performance, State Performance, Geo & Dealer, Pivot Table)

## Required Edits Before Deploy

Exactly 3 changes are required in the source file:

1. **Firebase config** — fill in `apiKey`, `messagingSenderId`, `appId`
2. **Admin emails** — add `pooja.chowdhury@girnarsoft.com` and `aditya.kumar@girnarsoft.com`
3. **Auth security bug** — change fallback role from `'full'` to `'viewer'`

See `TARGET_CLAUDE_PROMPT.md` Step 2 for exact find/replace instructions.

## Validation Reference

After deployment, these approximate values confirm correct data processing:
- **Leads:** ~60,504
- **Retail:** ~1,531
- **L2R%:** ~2.5%
- **States:** ~28

---

*Do NOT modify the original Royal Enfield Performance Analytics repository.*
*This package is for the Ather LDR dashboard only.*
