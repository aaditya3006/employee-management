/* ==========================================================================
   RAILSAATHI - HISTORY & DATABASE DATA SYNC
   js/sections/history.js
   ========================================================================== */

let printHistory = [];
let localDutyPdfHistory = [];

const DUTY_PDF_HISTORY_DB = 'railsaathi-duty-pdf-history';
const DUTY_PDF_HISTORY_STORE = 'pdf-files';

function openDutyPdfHistoryDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Local PDF history is unavailable in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DUTY_PDF_HISTORY_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DUTY_PDF_HISTORY_STORE)) {
        db.createObjectStore(DUTY_PDF_HISTORY_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local PDF history.'));
  });
}

function readLocalDutyPdfHistory() {
  return openDutyPdfHistoryDb().then(db => new Promise((resolve, reject) => {
    const request = db.transaction(DUTY_PDF_HISTORY_STORE, 'readonly')
      .objectStore(DUTY_PDF_HISTORY_STORE).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('Could not read local PDF history.'));
    };
  }));
}

window.saveDutyPdfHistory = async function ({ blob, filename, dutyName, dutyDate, action }) {
  const timestamp = new Date().toISOString();
  const dutyLabel = `${dutyName} Duty - ${dutyDate}`;
  const remoteRange = `${action} PDF: ${dutyLabel}`;
  const record = {
    id: `duty-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    blob,
    filename,
    dutyName,
    dutyDate,
    dutyLabel,
    action,
    timestamp,
    remoteRange
  };

  try {
    const db = await openDutyPdfHistoryDb();
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(DUTY_PDF_HISTORY_STORE, 'readwrite');
        transaction.objectStore(DUTY_PDF_HISTORY_STORE).put(record);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || new Error('Could not save the PDF locally.'));
        transaction.onabort = () => reject(transaction.error || new Error('Saving the PDF was cancelled.'));
      });
    } finally {
      db.close();
    }
    localDutyPdfHistory.unshift(record);
  } catch (error) {
    console.warn('Could not save this PDF in local history:', error);
    localDutyPdfHistory.unshift(record);
  }

  renderHistory();

  try {
    const insert = window.db?.from('print_history').insert([{
      range: remoteRange,
      timestamp: new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      serverTime: timestamp
    }]);
    if (insert?.then) {
      Promise.resolve(insert).then(({ error }) => {
        if (error) console.warn('Could not sync PDF history metadata:', error);
      }).catch(error => console.warn('Could not sync PDF history metadata:', error));
    }
  } catch (error) {
    console.warn('Could not sync PDF history metadata:', error);
  }

  return record;
};

window.openDutyPdfFromHistory = async function (id) {
  let record = localDutyPdfHistory.find(item => item.id === id);
  if (!record) {
    try {
      const records = await readLocalDutyPdfHistory();
      localDutyPdfHistory = records;
      record = records.find(item => item.id === id);
    } catch (error) {
      console.warn('Could not open archived PDF:', error);
    }
  }
  if (!record?.blob) {
    showToast('This saved PDF is not available on this device.');
    return;
  }

  const url = URL.createObjectURL(record.blob);
  window.open(url, '_blank', 'noopener');
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

window.downloadDutyPdfFromHistory = async function (id) {
  let record = localDutyPdfHistory.find(item => item.id === id);
  if (!record) {
    try {
      const records = await readLocalDutyPdfHistory();
      localDutyPdfHistory = records;
      record = records.find(item => item.id === id);
    } catch (error) {
      console.warn('Could not download archived PDF:', error);
    }
  }
  if (!record?.blob) {
    showToast('This saved PDF is not available on this device.');
    return;
  }

  const url = URL.createObjectURL(record.blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = record.filename || 'Railsaathi-duty.pdf';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
};

window.clearLocalDutyPdfHistory = async function () {
  try {
    const db = await openDutyPdfHistoryDb();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(DUTY_PDF_HISTORY_STORE, 'readwrite');
      transaction.objectStore(DUTY_PDF_HISTORY_STORE).clear();
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not clear PDF history.'));
      transaction.onabort = () => reject(transaction.error || new Error('Clearing PDF history was cancelled.'));
    });
    db.close();
  } catch (error) {
    console.warn('Could not clear local PDF history:', error);
  }
  localDutyPdfHistory = [];
};

    async function loadDataFromDB() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          console.log('No user logged in, skipping data load');
          return;
        }

        // Load employees from sample_employees table WITHOUT orderBy to avoid index errors
        const { data: employees, error: empErr } = await window.db.from("sample_employees").select("*");
        employeeList = employees || [];
        // Sort in JavaScript
        employeeList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        await loadGpsNumbersFromDB();

        // Initialize empty arrays for optional tables
        printHistory = [];
        attendanceRecords = [];
        taJournalRecords = [];

        // Hide loader
        const loaderEl = document.getElementById('db-loader');
        if (loaderEl) {
          loaderEl.style.display = 'none';
        }

        const genBtn = document.getElementById('generate-btn');
        if (genBtn) {
          genBtn.style.display = 'flex';
        }

        console.log('Data loaded successfully:', employeeList.length, 'employees from sample_employees');
        renderEmployeeTable();
        renderHistory();
        // loadAllAttendanceRecords();  // Tables not yet created
        loadAllTaRecords();           // Load TA records from database
        setupForm();
      } catch (error) {
        console.error("Error loading data from database:", error);
        const loaderEl = document.getElementById('db-loader');
        if (loaderEl) {
          loaderEl.innerHTML = `<span style="color:#ef4444;font-weight:bold;">❌ Database Error: ${error.message}</span>`;
          loaderEl.style.display = 'flex';
        }
      }
    }



    async function legacyLoadHistoryFromDB() {
      try {
        const c = document.getElementById('history-list-container');
        if (c) {
          c.innerHTML = `<div class="p-12 text-center text-slate-400"><svg class="animate-spin h-5 w-5 mx-auto mb-2 text-slate-400" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Loading history...</div>`;
        }

        const { data, error } = await db.from("print_history").select("*");
        if (error) throw error;

        if (data) {
          data.sort((a, b) => {
            const timeA = new Date(a.printed_at || a.serverTime || a.timestamp || 0).getTime();
            const timeB = new Date(b.printed_at || b.serverTime || b.timestamp || 0).getTime();
            return timeB - timeA;
          });

          printHistory = data.map(h => {
            let rangeStr = '';
            let timeStr = '';

            if (h.document_type) {
              rangeStr = `<svg class="ui-icon"><use href="#icon-list"></use></svg> ${h.document_type} - ${h.month || ''} ${h.year || ''} (Rs. ${h.total_amount || 0})`;
              timeStr = h.printed_at ? new Date(h.printed_at).toLocaleString() : new Date().toLocaleString();
            } else {
              rangeStr = `<svg class="ui-icon"><use href="#icon-file"></use></svg> Print: ${h.range || 'Document'}`;
              timeStr = h.timestamp || (h.serverTime ? new Date(h.serverTime).toLocaleString() : '');
            }

            return {
              id: h.id,
              range: rangeStr,
              timestamp: timeStr
            };
          });

          renderHistory();
        }
      } catch (err) {
        console.error("❌ Error fetching print history:", err);
        renderHistory();
      }
    }

    function legacyRenderHistory() {
      const c = document.getElementById('history-list-container');
      c.innerHTML = printHistory.length
        ? printHistory.map(h => `
      <div class="dashboard-card-light flex items-center justify-between border-l-4 border-l-orange-500">
        <div>
          <div class="font-bold text-slate-800 text-sm md:text-base">${h.range}</div>
          <div class="text-[10px] text-slate-400 font-medium">${h.timestamp}</div>
        </div>
        <div class="text-green-600 font-bold text-[10px] bg-green-50 px-3 py-1 rounded-full border border-green-100"><svg class="ui-icon"><use href="#icon-check"></use></svg> Saved (DB)</div>
      </div>`).join('')
        : `<div class="p-12 text-center text-slate-400 italic">No history found.</div>`;
    }



    async function loadHistoryFromDB() {
      const container = document.getElementById('history-list-container');
      if (container) container.innerHTML = '<div class="p-8 text-center text-slate-400 text-xs">Loading history...</div>';

      try {
        const { data, error } = await db.from('print_history').select('*');
        if (error) throw error;
        (data || []).sort((a, b) => {
          const timeA = new Date(a.printed_at || a.serverTime || a.timestamp || 0).getTime();
          const timeB = new Date(b.printed_at || b.serverTime || b.timestamp || 0).getTime();
          return timeB - timeA;
        });
        printHistory = (data || []).map(h => {
          let range = '';
          let timestamp = '';
          if (h.document_type) {
            range = `<svg class="ui-icon"><use href="#icon-list"></use></svg> ${h.document_type} - ${h.month || ''} ${h.year || ''} (Rs. ${h.total_amount || 0})`;
            timestamp = h.printed_at ? new Date(h.printed_at).toLocaleString() : new Date().toLocaleString();
          } else {
            range = `<svg class="ui-icon"><use href="#icon-file"></use></svg> ${h.range || 'Document'}`;
            timestamp = h.timestamp || (h.serverTime ? new Date(h.serverTime).toLocaleString() : '');
          }
          return {
            id: h.id,
            range,
            timestamp,
            timestampValue: new Date(h.serverTime || h.printed_at || h.timestamp || 0).getTime(),
            rawRange: h.range || ''
          };
        });
      } catch (error) {
        console.error('Error fetching print history:', error);
        printHistory = [];
      }

      try {
        localDutyPdfHistory = await readLocalDutyPdfHistory();
      } catch (error) {
        console.warn('Could not load local PDF history:', error);
        localDutyPdfHistory = [];
      }
      renderHistory();
    }

    function renderHistory() {
      const c = document.getElementById('history-list-container');
      if (!c) return;

      const syncedRanges = new Set(localDutyPdfHistory.map(record => record.remoteRange));
      const databaseHistory = printHistory.filter(record => !syncedRanges.has(record.rawRange));
      const items = [
        ...localDutyPdfHistory.map(record => ({ isPdf: true, timestampValue: new Date(record.timestamp).getTime(), record })),
        ...databaseHistory.map(record => ({ isPdf: false, timestampValue: record.timestampValue || new Date(record.timestamp || 0).getTime(), record }))
      ].sort((a, b) => b.timestampValue - a.timestampValue);

      c.innerHTML = items.length ? items.map(item => {
        if (item.isPdf) {
          const record = item.record;
          const id = String(record.id).replace(/[^a-zA-Z0-9_-]/g, '');
          const time = new Date(record.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
          const label = `${record.dutyName || 'Duty'} Duty - ${record.dutyDate || ''}`;
          return `<div class="dashboard-card-light history-pdf-card">
            <div class="history-pdf-details">
              <div class="font-bold text-slate-800 text-sm">${escapeHistoryText(label)}</div>
              <div class="text-[10px] text-slate-500">${escapeHistoryText(record.action || 'Generated')} PDF · ${escapeHistoryText(time)}</div>
            </div>
            <div class="history-pdf-actions">
              <button type="button" onclick="openDutyPdfFromHistory('${id}')" class="history-pdf-action"><svg class="ui-icon"><use href="#icon-eye"></use></svg><span>Open</span></button>
              <button type="button" onclick="downloadDutyPdfFromHistory('${id}')" class="history-pdf-action"><svg class="ui-icon"><use href="#icon-download"></use></svg><span>Save</span></button>
            </div>
          </div>`;
        }
        const record = item.record;
        return `<div class="dashboard-card-light flex items-center justify-between border-l-4 border-l-orange-500">
          <div>
            <div class="font-bold text-slate-800 text-sm md:text-base">${record.range}</div>
            <div class="text-[10px] text-slate-400 font-medium">${record.timestamp || ''}</div>
          </div>
          <div class="text-green-600 font-bold text-[10px] bg-green-50 px-3 py-1 rounded-full border border-green-100"><svg class="ui-icon"><use href="#icon-check"></use></svg> Saved</div>
        </div>`;
      }).join('') : '<div class="p-12 text-center text-slate-400 italic">No history found.</div>';
    }

    function escapeHistoryText(value) {
      return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[char]));
    }

window.printHistory = printHistory;
window.loadDataFromDB = loadDataFromDB;
window.loadHistoryFromDB = loadHistoryFromDB;
window.renderHistory = renderHistory;
