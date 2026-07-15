/*=================================================================
  TVS Lead Disposition — Google Apps Script
  ─────────────────────────────────────────────────────────────────
  SETUP STEPS:
  1. Go to https://script.google.com → New Project
  2. Paste this code, save as "TVS LDR Script"
  3. Fill in CONFIG below (get file IDs from Google Drive URLs)
  4. Create a new blank Google Sheet → copy its ID into CACHE_SHEET_ID
  5. Deploy → New Deployment → Web App → "Anyone" → copy URL to Dashboard HTML
  6. Run push_tvs_data.py to populate data

  ACCESS CONTROL:
  - ADMIN_EMAILS: always have admin role (hardcoded)
  - ALLOWED_DOMAINS: only these email domains can request access
  - Roles (full/viewer) are stored in Script Properties as 'tvs_roles' JSON
  - Pending requests stored as 'tvs_pending' JSON
=================================================================*/

const CONFIG = {
  LEADS_FILE_ID:   'PASTE_LEADS_XLSX_FILE_ID_HERE',
  RETAILS_FILE_ID: 'PASTE_RETAILS_XLSX_FILE_ID_HERE',
  CACHE_SHEET_ID:  'PASTE_CACHE_GOOGLE_SHEET_ID_HERE',
  CACHE_TAB:       'Data',
  CACHE_TTL_MS:    4 * 60 * 60 * 1000,
};

const PUSH_SECRET    = 'tvs2026push';
const CHUNK_SIZE     = 40000;

const ADMIN_EMAILS   = ['mihir.bhatt@girnarsoft.com', 'aditya.kumar@girnarsoft.com'];
const ALLOWED_DOMAINS = ['girnarsoft.com', 'girnarcare.com'];

/* ─── Auth helpers ─── */

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function isAdmin(email) {
  return ADMIN_EMAILS.indexOf(email) >= 0;
}

function getRoles() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty('tvs_roles') || '{}');
  } catch(e) { return {}; }
}

function saveRoles(roles) {
  // Never persist admin emails — they are always admin by code
  const toSave = Object.assign({}, roles);
  ADMIN_EMAILS.forEach(function(e) { delete toSave[e]; });
  PropertiesService.getScriptProperties().setProperty('tvs_roles', JSON.stringify(toSave));
}

function getPendingMap() {
  try {
    return JSON.parse(PropertiesService.getScriptProperties().getProperty('tvs_pending') || '{}');
  } catch(e) { return {}; }
}

function savePendingMap(pending) {
  PropertiesService.getScriptProperties().setProperty('tvs_pending', JSON.stringify(pending));
}

function checkUserRole(email) {
  email = (email || '').toLowerCase().trim();
  if (!email) return { role: 'none' };
  if (isAdmin(email)) return { role: 'admin' };
  const roles = getRoles();
  if (roles[email]) return { role: roles[email] };
  const pending = getPendingMap();
  if (pending[email]) return { role: 'pending', requestedAt: pending[email].requestedAt };
  const domain = email.split('@')[1] || '';
  if (ALLOWED_DOMAINS.indexOf(domain) < 0) return { role: 'restricted' };
  return { role: 'none' };
}

/* ─── doGet: serve JSON to dashboard, or handle auth actions ─── */
function doGet(e) {
  try {
    const action = e.parameter && e.parameter.action;

    if (action === 'checkRole') {
      const email = ((e.parameter.email) || '').toLowerCase().trim();
      return jsonOut(checkUserRole(email));
    }

    if (action === 'getPending') {
      const email = ((e.parameter.email) || '').toLowerCase().trim();
      if (!isAdmin(email)) return jsonOut({ error: 'Unauthorized' });
      return jsonOut({ pending: getPendingMap() });
    }

    // Default: serve dashboard data
    const json = getOrBuildJson();
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doGet error: ' + err.stack);
    return jsonOut({ error: err.message });
  }
}

/* ─── doPost: push data or handle access requests ─── */
function doPost(e) {
  try {
    const secret = e.parameter && e.parameter.secret;

    // Data push from Python script
    if (secret === PUSH_SECRET) {
      const json = e.postData.contents;
      writeChunked(json);
      Logger.log('Push stored: ' + json.length + ' chars');
      return jsonOut({ ok: true, bytes: json.length });
    }

    const action = e.parameter && e.parameter.action;
    const body   = JSON.parse(e.postData.contents || '{}');

    if (action === 'requestAccess') {
      const email  = (body.email  || '').toLowerCase().trim();
      const name   = (body.name   || '').trim();
      const domain = email.split('@')[1] || '';
      if (ALLOWED_DOMAINS.indexOf(domain) < 0) return jsonOut({ error: 'Domain not allowed' });
      if (isAdmin(email))                      return jsonOut({ role: 'admin' });
      const roles = getRoles();
      if (roles[email])                        return jsonOut({ role: roles[email] });
      const pending = getPendingMap();
      pending[email] = { name: name, requestedAt: new Date().toISOString() };
      savePendingMap(pending);
      return jsonOut({ ok: true });
    }

    if (action === 'reviewRequest') {
      const adminEmail  = (body.adminEmail  || '').toLowerCase().trim();
      const targetEmail = (body.targetEmail || '').toLowerCase().trim();
      const decision    = body.decision;  // 'approve' | 'reject'
      const role        = body.role || 'viewer';
      if (!isAdmin(adminEmail)) return jsonOut({ error: 'Unauthorized' });
      const pending = getPendingMap();
      delete pending[targetEmail];
      savePendingMap(pending);
      if (decision === 'approve') {
        const roles = getRoles();
        roles[targetEmail] = role;
        saveRoles(roles);
      }
      return jsonOut({ ok: true });
    }

    return jsonOut({ error: 'Unknown action' });

  } catch (err) {
    Logger.log('doPost error: ' + err.stack);
    return jsonOut({ error: err.message });
  }
}

/* ─── Write JSON in CHUNK_SIZE pieces to Sheet column A ─── */
function writeChunked(json) {
  const ss = SpreadsheetApp.openById(CONFIG.CACHE_SHEET_ID);
  let sh = ss.getSheetByName(CONFIG.CACHE_TAB);
  if (!sh) sh = ss.insertSheet(CONFIG.CACHE_TAB);
  sh.clearContents();
  const chunks = Math.ceil(json.length / CHUNK_SIZE);
  const rows = [];
  for (var i = 0; i < chunks; i++) {
    rows.push([json.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)]);
  }
  sh.getRange(1, 1, rows.length, 1).setValues(rows);
  PropertiesService.getScriptProperties().setProperties({
    'tvs_cache_ts': String(Date.now()),
    'tvs_chunks':   String(chunks),
  });
}

/* ─── Read from cache if fresh, otherwise recompute ─── */
function getOrBuildJson() {
  const props    = PropertiesService.getScriptProperties();
  const cacheAge = props.getProperty('tvs_cache_ts');
  if (cacheAge && (Date.now() - parseInt(cacheAge)) < CONFIG.CACHE_TTL_MS) {
    try {
      const ss = SpreadsheetApp.openById(CONFIG.CACHE_SHEET_ID);
      const sh = ss.getSheetByName(CONFIG.CACHE_TAB);
      if (sh) {
        const chunks = parseInt(props.getProperty('tvs_chunks') || '1');
        var val;
        if (chunks <= 1) {
          val = String(sh.getRange('A1').getValue());
        } else {
          val = sh.getRange(1, 1, chunks, 1).getValues().map(function(r) { return String(r[0]); }).join('');
        }
        if (val && val.length > 10) {
          Logger.log('Serving from cache (' + chunks + ' chunks, ' + val.length + ' chars)');
          return val;
        }
      }
    } catch (e) { Logger.log('Cache read failed: ' + e); }
  }
  return JSON.stringify({ error: 'No data — run push_tvs_data.py to populate' });
}

/* ─── Force cache clear ─── */
function clearCache() {
  PropertiesService.getScriptProperties().deleteProperty('tvs_cache_ts');
  Logger.log('Cache cleared.');
}

/* ─── Debug: view current roles and pending ─── */
function debugRoles() {
  Logger.log('Roles: ' + PropertiesService.getScriptProperties().getProperty('tvs_roles'));
  Logger.log('Pending: ' + PropertiesService.getScriptProperties().getProperty('tvs_pending'));
}
