/* ==========================================================================
   RAILSAATHI - HISTORY & DATABASE DATA SYNC
   js/sections/history.js
   ========================================================================== */

let printHistory = [];

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



    async function loadHistoryFromDB() {
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

    function renderHistory() {
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



window.printHistory = printHistory;
window.loadDataFromDB = loadDataFromDB;
window.loadHistoryFromDB = loadHistoryFromDB;
window.renderHistory = renderHistory;
