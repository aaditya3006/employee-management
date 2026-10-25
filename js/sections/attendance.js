/* ==========================================================================
   RAILSAATHI - ATTENDANCE & SUB-CATEGORIES MODULE
   (Unit Assign, LC Management, Trolley Man, BlackSmith)
   js/sections/attendance.js
   ========================================================================== */

    let attendanceRecords = [];


    async function loadAllAttendanceRecords() {
      try {
        // attendance_records table not yet created in Supabase
        attendanceRecords = [];
        console.log('Loaded attendance records: 0 (table not created)');
      } catch (error) {
        console.error("Error loading attendance records:", error);
      }
    }



    function showAllAttendanceRecords() {
      const container = document.getElementById('all-records-display');
      if (!container) return;

      if (attendanceRecords.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-400 italic bg-white rounded-xl shadow-sm">No attendance records found.</div>`;
        return;
      }

      let html = `<div class="bg-white rounded-xl shadow-sm overflow-hidden"><table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:#fef08a;border-bottom:2px solid #000;">
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Date</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Category</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Sub-Category</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Employee</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Status</th>
      <th style="padding:10px;text-align:left;">Shift</th>
    </tr></thead><tbody>`;

      attendanceRecords.forEach(rec => {
        const dateStr = rec.dateStr || 'N/A';
        const cat = rec.category || 'N/A';
        const sub = rec.subCategory || 'N/A';
        const name = rec.name || 'N/A';
        const att = rec.attDetails || 'N/A';
        const shift = rec.shift || 'N/A';

        html += `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${dateStr}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${cat}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${sub}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;"><strong>${name}</strong></td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${att}</td>
      <td style="padding:10px;">${shift}</td>
    </tr>`;
      });

      html += `</tbody></table></div>`;
      container.innerHTML = html;
    }



    const categoryConfig = {
      unit: { title: "Unit Assign", subs: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"], hasKm: true, hasAddName: false },
      lc: { title: "Level Crossing", subs: ["LC -3", "LC - 6", "LC - 7", "LC - 10", "LC - 11", "LC - 12", "LC - 13", "LC - 14", "LC - 15"], hasKm: false, hasAddName: true },
      trolley: { title: "Trolley Man", subs: ["Trolley Man - 1", "Trolley Man - 2", "Trolley Man - 3", "Trolley Man - 4"], hasKm: false, hasAddName: false },
      blacksmith: { title: "BlackSmith", subs: ["BlackSmith - 1", "BlackSmith - 2", "BlackSmith - 3"], hasKm: false, hasAddName: false }
    };

    let activeAttContext = { cat: '', sub: '' };

    function showAttendanceComingSoon(closeMenu = true) {
      if (closeMenu) closeSidebar();
      const formSection = document.getElementById('form-section');
      if (formSection) {
        formSection.classList.remove('hidden');
        formSection.style.display = 'block';
      }
      showSection('form-section');

      document.getElementById('legacy-containers').style.display = 'none';
      document.getElementById('legacy-containers').classList.add('hidden');
      document.getElementById('ta-journal-wrapper').style.display = 'none';
      document.getElementById('ta-journal-wrapper').classList.add('hidden');

      const attendanceWrapper = document.getElementById('new-attendance-wrapper');
      const subCategories = document.getElementById('sub-cat-container');
      const formContainer = document.getElementById('att-form-container');
      attendanceWrapper.classList.remove('hidden');
      attendanceWrapper.style.display = 'block';
      formContainer.classList.add('hidden');
      subCategories.innerHTML = `
        <div class="attendance-coming-soon-card">
          <strong>Attendance</strong>
          <span>Coming soon — under development</span>
        </div>`;

      setSectionHeading('Attendance');
      const subtitle = document.getElementById('nav-section-subtitle');
      if (subtitle) subtitle.innerText = 'Attendance';
    }

    function toggleAttendanceMenu() {
      const submenu = document.getElementById('sidebar-attendance-submenu');
      const toggle = document.getElementById('sidebar-attendance-toggle');
      if (!submenu || !toggle) return;
      const isOpening = submenu.classList.contains('hidden');
      submenu.classList.toggle('hidden', !isOpening);
      toggle.setAttribute('aria-expanded', String(isOpening));
      if (isOpening) showAttendanceComingSoon(false);
    }

    function handleMenuSelect(cat) {
      // Handle admin approval section
      if (cat === 'approve') {
        showSection('approve-section');
        showApproveSection();
        return;
      }

      if (cat === 'attendance' || cat === 'attendance-coming-soon') {
        showAttendanceComingSoon(true);
        return;
      }

      closeSidebar();
      const legacyContainer = document.getElementById('legacy-containers');
      const newAttWrapper = document.getElementById('new-attendance-wrapper');
      const taWrapper = document.getElementById('ta-journal-wrapper');
      const headingText = document.getElementById('section-heading-text');

      // Ensure form section is visible
      const formSection = document.getElementById('form-section');
      if (formSection) {
        formSection.classList.remove('hidden');
        formSection.style.display = 'block';
      }

      showSection('form-section');

      if (cat === 'night' || cat === 'keyman') {
        setDutyMode(cat);
        legacyContainer.classList.remove('hidden');
        legacyContainer.style.display = 'block';
        newAttWrapper.classList.add('hidden');
        newAttWrapper.style.display = 'none';
        taWrapper.classList.add('hidden');
        taWrapper.style.display = 'none';
        setupForm();
        const sub = document.getElementById('nav-section-subtitle');
        if (sub) sub.innerText = cat === 'night' ? 'Night Patrolling' : 'Keyman Duty';
      } else if (cat === 'tajournal') {
        legacyContainer.classList.add('hidden');
        legacyContainer.style.display = 'none';
        newAttWrapper.classList.add('hidden');
        newAttWrapper.style.display = 'none';
        taWrapper.classList.remove('hidden');
        taWrapper.style.display = 'block';
        setSectionHeading("TA Journal");
        initTaJournal();
        const sub = document.getElementById('nav-section-subtitle');
        if (sub) sub.innerText = 'TA Journal';
      } else {
        legacyContainer.classList.add('hidden');
        legacyContainer.style.display = 'none';
        taWrapper.classList.add('hidden');
        taWrapper.style.display = 'none';
        newAttWrapper.classList.remove('hidden');
        newAttWrapper.style.display = 'block';
        setSectionHeading(categoryConfig[cat].title);
        renderSubCategories(cat);
        const sub = document.getElementById('nav-section-subtitle');
        if (sub) sub.innerText = categoryConfig[cat].title;
      }
    }

    function renderSubCategories(cat) {
      const config = categoryConfig[cat];
      const container = document.getElementById('sub-cat-container');
      container.innerHTML = config.subs.map(sub => `
    <button onclick="openAttForm('${cat}', '${sub}')" class="px-5 py-2.5 bg-blue-100 text-blue-800 font-bold rounded-xl hover:bg-blue-200 shadow-sm transition-colors active:scale-95">${sub}</button>`).join('');
      document.getElementById('att-form-container').classList.add('hidden');
    }

    function openAttForm(cat, sub) {
      activeAttContext = { cat, sub };
      document.getElementById('att-form-container').classList.remove('hidden');
      document.getElementById('att-sub-title').innerText = `${categoryConfig[cat].title} ➝ ${sub}`;
      document.getElementById('km-input-group').classList.toggle('hidden', !categoryConfig[cat].hasKm);
      document.getElementById('add-name-group').classList.toggle('hidden', !categoryConfig[cat].hasAddName);
      const today = new Date();
      document.getElementById('att-real-date').innerText = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const offset = today.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
      document.getElementById('att-date-val').value = localISOTime;
      const dl = document.getElementById('att-emp-list');
      dl.innerHTML = employeeList.map(e => `<option value="${e.name}"></option>`).join('');
      document.getElementById('att-main-form').reset();
      toggleLeaveType();
    }

    function toggleLeaveType() {
      const statusEl = document.querySelector('input[name="att-status"]:checked');
      if (!statusEl) return;
      document.getElementById('leave-type-container').classList.toggle('hidden', statusEl.value !== 'Leave');
    }

    let currentAttData = {};

    function showAttPreview() {
      const name = document.getElementById('att-name').value;
      if (!name) { customAlert("Please enter an employee name."); return; }
      const shift = document.querySelector('input[name="att-shift"]:checked').value;
      const status = document.querySelector('input[name="att-status"]:checked').value;
      const leaveType = status === 'Leave' ? document.querySelector('input[name="att-leave-type"]:checked').value : '';
      const attDetails = status === 'Leave' ? `Leave (${leaveType})` : status;
      let kmDetails = '-';
      const kmSingle = document.getElementById('att-km');
      if (kmSingle) kmDetails = kmSingle.value || '-';
      const crName = document.getElementById('att-cr-name').value;
      const crDateRaw = document.getElementById('att-cr-date').value;
      const crDate = crDateRaw ? crDateRaw.split('-').reverse().join('/') : '';
      const crDetails = crName ? `${crName} ${crDate ? '(' + crDate + ')' : ''}` : '-';
      const addName = document.getElementById('att-add-name') ? document.getElementById('att-add-name').value : '';
      const addShift = document.querySelector('input[name="att-add-shift"]:checked') ? document.querySelector('input[name="att-add-shift"]:checked').value : '';
      const addDetails = addName ? `${addName} (${addShift})` : '-';
      const dateVal = document.getElementById('att-date-val').value;
      const dateStr = dateVal.split('-').reverse().join('/');
      currentAttData = {
        category: categoryConfig[activeAttContext.cat].title, subCategory: activeAttContext.sub,
        dateStr, dateVal, name, shift, attDetails, kmDetails, crDetails, addDetails,
        hasKm: categoryConfig[activeAttContext.cat].hasKm, hasAddName: categoryConfig[activeAttContext.cat].hasAddName
      };
      try {
        db.from('attendance_records').insert([{ ...currentAttData, serverTime: new Date().toISOString() }])
          .catch(e => {/* Silently ignore attendance_records table if it doesn't exist */ });
      } catch (e) {/* Silently ignore */ }
      buildAttTable([currentAttData], 'today');
      showSection('attendance-preview-section');
    }

    function buildAttTable(dataArray, mode) {
      const container = document.getElementById('att-dynamic-table-container');
      const title = document.getElementById('att-preview-title');
      if (dataArray.length === 0) return;
      const sample = dataArray[0];
      title.innerHTML = `${sample.category} &nbsp;➝&nbsp; ${sample.subCategory} <br> <span style="font-size:12pt;font-weight:normal;margin-top:5px;display:block;">${mode === 'today' ? 'Date: ' + sample.dateStr : 'History / Till Now Report'}</span>`;
      let thead = `<tr>
    <th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">Date</th>
    <th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">Name</th>
    <th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">Attendance</th>
    <th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">Shift</th>
    ${sample.hasKm ? `<th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">KM</th>` : ''}
    <th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">CR (Date)</th>
    ${sample.hasAddName ? `<th style="border:2px solid black;padding:8px;background-color:#fef08a !important;-webkit-print-color-adjust:exact;">Add. Name (Shift)</th>` : ''}
  </tr>`;
      let tbody = dataArray.map(row => {
        let bgCol = "transparent";
        if (row.attDetails.includes('Present')) bgCol = "#bbf7d0";
        if (row.attDetails.includes('Absent')) bgCol = "#fecaca";
        if (row.attDetails.includes('Leave')) bgCol = "#fed7aa";
        return `<tr>
      <td style="border:2px solid black;padding:10px;font-weight:bold;">${row.dateStr}</td>
      <td style="border:2px solid black;padding:10px;font-weight:bold;">${row.name}</td>
      <td style="border:2px solid black;padding:10px;font-weight:bold;background-color:${bgCol} !important;-webkit-print-color-adjust:exact;">${row.attDetails}</td>
      <td style="border:2px solid black;padding:10px;">${row.shift}</td>
      ${row.hasKm ? `<td style="border:2px solid black;padding:10px;">${row.kmDetails}</td>` : ''}
      <td style="border:2px solid black;padding:10px;">${row.crDetails}</td>
      ${row.hasAddName ? `<td style="border:2px solid black;padding:10px;">${row.addDetails}</td>` : ''}
    </tr>`;
      }).join('');
      container.innerHTML = `<table style="width:100%;text-align:center;border-collapse:collapse;border:2px solid black;font-size:11pt;"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    }

    async function showTillNow() {
      const btn = document.getElementById('btn-till-now');
      const originalText = btn.innerText;
      btn.innerText = "Loading...";
      try {
        // Silently handle if attendance_records table doesn't exist
        let records = [];
        try {
          const result = await window.db.from('attendance_records')
            .select('*')
            .eq('category', currentAttData.category)
            .eq('subCategory', currentAttData.subCategory);
          if (result && result.data) records = result.data;
        } catch (e) {
          // Silently ignore if attendance_records table doesn't exist
        }

        let filtered = records || [];
        // Sort by serverTime in JavaScript (descending)
        filtered.sort((a, b) => (b.serverTime || 0) - (a.serverTime || 0));
        filtered = filtered.slice(0, 50); // Limit to 50

        if (filtered.length === 0) filtered = [currentAttData];
        buildAttTable(filtered, 'tillnow');
      } catch (e) { console.error("Fetch error:", e); buildAttTable([currentAttData], 'tillnow'); }
      btn.innerText = originalText;
      executeAttPrint('portrait');
    }



window.categoryConfig = categoryConfig;
window.activeAttContext = activeAttContext;
window.currentAttData = currentAttData;
window.attendanceRecords = attendanceRecords;
window.loadAllAttendanceRecords = loadAllAttendanceRecords;
window.showAllAttendanceRecords = showAllAttendanceRecords;
window.handleMenuSelect = handleMenuSelect;
window.toggleAttendanceMenu = toggleAttendanceMenu;
window.renderSubCategories = renderSubCategories;
window.openAttForm = openAttForm;
window.toggleLeaveType = toggleLeaveType;
window.showAttPreview = showAttPreview;
window.buildAttTable = buildAttTable;
window.showTillNow = showTillNow;
window.shareAttendancePreview = function () {
  return window.shareRailsaathiContent('Railsaathi Attendance Report', 'att-pdf-content');
};
