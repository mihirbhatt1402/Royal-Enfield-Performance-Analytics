/*=================================================================
  TVS Lead Disposition — Google Apps Script
  -----------------------------------------------------------------
  DATA SOURCES:
  - Historical (completed months): XLSX files on Google Drive
    → HIST_LEAD_FILE_IDS / HIST_RETAIL_FILE_IDS in CONFIG
    → When a month ends, add the new XLSX file ID to these arrays

  - Current month (live): Google Sheets
    → CURR_LEADS_SHEET_ID / CURR_RETAILS_SHEET_ID in CONFIG
    → Leads sheet "TVS" tab has embedded retail columns
    → Retails sheet "Raw" tab filtered by Process == "TVS"

  AUTOMATION:
  - GitHub Actions runs push_tvs_data.py daily at 11 AM IST
  - Python calls ?action=getCurrentLeads&secret=... (paginated)
  - Python calls ?action=getConfig&secret=... for historical file IDs
  - Python downloads historical XLSX, combines with current month, pushes payload

  MONTH-END WORKFLOW (one-time per month):
  - User saves month's XLSX to Google Drive
  - User adds new file IDs to HIST_LEAD_FILE_IDS / HIST_RETAIL_FILE_IDS below
  - Next daily run automatically picks up the full year's data
=================================================================*/

const CONFIG = {
  // Historical completed-month XLSX files (publicly shared on Drive)
  // Add new file IDs here when a month ends
  HIST_LEAD_FILE_IDS:   ['1jPYG0LGFFd_ljWpfPr2NPfIU0fK1i7px'],   // Apr–Jun FY26-27
  HIST_RETAIL_FILE_IDS: ['167q8mrcKJeeL9DWTMLxe5Iq59RqVTamd'],   // Apr–Jun FY26-27

  // Current month live Google Sheets
  CURR_LEADS_SHEET_ID:   '1iSw5zXF67q5Wkoz2mSPFqql9OPAcqmd0um5BEHUGf4o',
  CURR_LEADS_TAB:        'TVS',
  CURR_RETAILS_SHEET_ID: '1ZWBlzxX-g2R5iCcrsGUWrqSvxIHcchFHtajDDPcFJgE',
  CURR_RETAILS_TAB:      'Raw',

  // Cache (output)
  CACHE_SHEET_ID: '1leebtjg8P7bKRrwfAolCNcDHrmM18GQVclD9xzhayIk',
  CACHE_TAB:      'Data',
  CACHE_TTL_MS:   4 * 60 * 60 * 1000,
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

function isAdmin(email) { return ADMIN_EMAILS.indexOf(email) >= 0; }

function getRoles() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('tvs_roles') || '{}'); }
  catch(e) { return {}; }
}
function saveRoles(roles) {
  var toSave = Object.assign({}, roles);
  ADMIN_EMAILS.forEach(function(e) { delete toSave[e]; });
  PropertiesService.getScriptProperties().setProperty('tvs_roles', JSON.stringify(toSave));
}
function getNames() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('tvs_names') || '{}'); }
  catch(e) { return {}; }
}
function saveNames(names) {
  PropertiesService.getScriptProperties().setProperty('tvs_names', JSON.stringify(names));
}
function getPendingMap() {
  try { return JSON.parse(PropertiesService.getScriptProperties().getProperty('tvs_pending') || '{}'); }
  catch(e) { return {}; }
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

/* ─── doGet ─── */
function doGet(e) {
  try {
    const action = e.parameter && e.parameter.action;
    const secret = e.parameter && e.parameter.secret;

    if (action === 'checkRole') {
      var email = ((e.parameter.email) || '').toLowerCase().trim();
      return jsonOut(checkUserRole(email));
    }
    if (action === 'getPending') {
      var email = ((e.parameter.email) || '').toLowerCase().trim();
      if (!isAdmin(email)) return jsonOut({ error: 'Unauthorized' });
      return jsonOut({ pending: getPendingMap() });
    }
    if (action === 'getUsers') {
      var email = ((e.parameter.email) || '').toLowerCase().trim();
      if (!isAdmin(email)) return jsonOut({ error: 'Unauthorized' });
      var roles = getRoles();
      var names = getNames();
      var users = {};
      ADMIN_EMAILS.forEach(function(ae) { users[ae] = { role: 'admin', name: names[ae] || '' }; });
      Object.keys(roles).forEach(function(ue) { users[ue] = { role: roles[ue], name: names[ue] || '' }; });
      return jsonOut({ users: users });
    }

    // ─── Data proxy endpoints (protected by PUSH_SECRET) ───

    if (action === 'getConfig') {
      if (secret !== PUSH_SECRET) return jsonOut({ error: 'Unauthorized' });
      return jsonOut({
        histLeadFileIds:   CONFIG.HIST_LEAD_FILE_IDS,
        histRetailFileIds: CONFIG.HIST_RETAIL_FILE_IDS,
      });
    }

    if (action === 'getCurrentLeads') {
      if (secret !== PUSH_SECRET) return jsonOut({ error: 'Unauthorized' });
      var page     = parseInt(e.parameter.page     || '0');
      var pageSize = parseInt(e.parameter.pageSize || '25000');
      return handleGetCurrentLeads(page, pageSize);
    }

    if (action === 'getCurrentRetails') {
      if (secret !== PUSH_SECRET) return jsonOut({ error: 'Unauthorized' });
      return handleGetCurrentRetails();
    }

    // Default: serve cached dashboard data
    const json = getOrBuildJson();
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doGet error: ' + err.stack);
    return jsonOut({ error: err.message });
  }
}

/* ─── Current-month leads proxy (paginated) ─── */
function handleGetCurrentLeads(page, pageSize) {
  var ss  = SpreadsheetApp.openById(CONFIG.CURR_LEADS_SHEET_ID);
  var sh  = ss.getSheetByName(CONFIG.CURR_LEADS_TAB);
  var lastRow = sh.getLastRow();
  var totalData = lastRow - 1;  // exclude header

  var startRow = 2 + page * pageSize;
  if (startRow > lastRow) {
    return jsonOut({ headers: [], rows: [], done: true, total: totalData });
  }

  var count   = Math.min(pageSize, lastRow - startRow + 1);
  var numCols = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, numCols).getValues()[0].map(String);
  var data    = sh.getRange(startRow, 1, count, numCols).getValues();

  // Only return the columns Python needs
  var needed = [
    'opty_id', 'Lead_Month', 'model', 'City', 'State',
    'Dealer_Name', 'lead_type', 'Medium',
    'DMS_Retail_Month', 'Retail Date', 'Retail By'
  ];
  var colIdx = needed.map(function(n) { return headers.indexOf(n); });

  var rows = data.map(function(row) {
    return colIdx.map(function(i) {
      if (i < 0) return '';
      var v = row[i];
      if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kolkata', 'yyyy-MM-dd');
      return String(v == null ? '' : v);
    });
  });

  return jsonOut({
    headers: needed,
    rows:    rows,
    done:    (startRow + count - 1) >= lastRow,
    total:   totalData,
  });
}

/* ─── Current-month retails proxy ─── */
function handleGetCurrentRetails() {
  var ss   = SpreadsheetApp.openById(CONFIG.CURR_RETAILS_SHEET_ID);
  var sh   = ss.getSheetByName(CONFIG.CURR_RETAILS_TAB);
  var data = sh.getDataRange().getValues();
  var hdr  = data[0].map(String);

  var processIdx      = hdr.findIndex(function(h) { return h.toLowerCase() === 'process'; });
  var leadIdIdx       = hdr.findIndex(function(h) { return h.toLowerCase() === 'sourceleadid'; });
  var retailMonthIdx  = hdr.findIndex(function(h) { return h.toLowerCase().replace(/[_ ]/g,'') === 'retailattributiondate'; });

  var needed = ['sourceLeadId', 'Retail_Attribution_Date'];
  var indices = [leadIdIdx, retailMonthIdx];

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (processIdx >= 0 && String(row[processIdx] || '').trim().toUpperCase() !== 'TVS') continue;
    var out = indices.map(function(idx) {
      if (idx < 0) return '';
      var v = row[idx];
      if (v instanceof Date) return Utilities.formatDate(v, 'Asia/Kolkata', 'MMM-yyyy');
      return String(v == null ? '' : v);
    });
    rows.push(out);
  }

  return jsonOut({ headers: needed, rows: rows, total: rows.length });
}

/* ─── doPost ─── */
function doPost(e) {
  try {
    const secret = e.parameter && e.parameter.secret;

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
      var adminEmail  = (body.adminEmail  || '').toLowerCase().trim();
      var targetEmail = (body.targetEmail || '').toLowerCase().trim();
      var decision    = body.decision;
      var role        = body.role || 'viewer';
      if (!isAdmin(adminEmail)) return jsonOut({ error: 'Unauthorized' });
      var pending = getPendingMap();
      var pendingEntry = pending[targetEmail] || {};
      delete pending[targetEmail];
      savePendingMap(pending);
      if (decision === 'approve') {
        var roles = getRoles();
        roles[targetEmail] = role;
        saveRoles(roles);
        var names = getNames();
        names[targetEmail] = pendingEntry.name || '';
        saveNames(names);
      }
      return jsonOut({ ok: true });
    }

    if (action === 'updateRole') {
      var adminEmail  = (body.adminEmail  || '').toLowerCase().trim();
      var targetEmail = (body.targetEmail || '').toLowerCase().trim();
      var newRole     = body.role;
      if (!isAdmin(adminEmail)) return jsonOut({ error: 'Unauthorized' });
      if (isAdmin(targetEmail)) return jsonOut({ error: 'Cannot modify admin role' });
      var roles = getRoles();
      if (!newRole || newRole === 'remove') { delete roles[targetEmail]; }
      else { roles[targetEmail] = newRole; }
      saveRoles(roles);
      return jsonOut({ ok: true });
    }

    return jsonOut({ error: 'Unknown action' });

  } catch (err) {
    Logger.log('doPost error: ' + err.stack);
    return jsonOut({ error: err.message });
  }
}

/* ─── Cache write/read ─── */
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

function getOrBuildJson() {
  const props    = PropertiesService.getScriptProperties();
  const cacheAge = props.getProperty('tvs_cache_ts');
  if (cacheAge && (Date.now() - parseInt(cacheAge)) < CONFIG.CACHE_TTL_MS) {
    try {
      const ss     = SpreadsheetApp.openById(CONFIG.CACHE_SHEET_ID);
      const sh     = ss.getSheetByName(CONFIG.CACHE_TAB);
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
  return JSON.stringify({ error: 'No data — run GitHub Actions workflow to populate' });
}

function clearCache() {
  PropertiesService.getScriptProperties().deleteProperty('tvs_cache_ts');
  Logger.log('Cache cleared.');
}

/* ─── Utility ─── */
function debugRoles() {
  Logger.log('Roles: '   + PropertiesService.getScriptProperties().getProperty('tvs_roles'));
  Logger.log('Pending: ' + PropertiesService.getScriptProperties().getProperty('tvs_pending'));
}

function listTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    Logger.log(t.getHandlerFunction() + ' | ' + t.getTriggerSource() + ' | uid=' + t.getUniqueId());
  });
}

function deleteAllTimeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getTriggerSource() === ScriptApp.TriggerSource.CLOCK) {
      ScriptApp.deleteTrigger(t);
      Logger.log('Deleted trigger: ' + t.getHandlerFunction());
    }
  });
  Logger.log('All time-based triggers deleted. GitHub Actions handles scheduling.');
}
