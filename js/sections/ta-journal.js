/* ==========================================================================
   RAILSAATHI - TA JOURNAL & TA REPORT MODULE
   js/sections/ta-journal.js
   ========================================================================== */

    let currentTaViewMode = 'journal';


    let taJournalRecords = [];


    async function loadAllTaRecords() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          console.log('No user logged in, skipping TA records load');
          taJournalRecords = [];
          return;
        }

        // Load TA journal records from Supabase
        const { data: records, error } = await window.db.from('ta_journal').select('*').eq('user_id', user.id).order('savedat', { ascending: false });

        if (error) {
          console.error('Error loading TA records:', error);
          taJournalRecords = [];
          return;
        }

        taJournalRecords = records || [];
        console.log('✅ Loaded TA journal records:', taJournalRecords.length, 'records');
      } catch (error) {
        console.error("Error loading TA records:", error);
        taJournalRecords = [];
      }
    }



    function showAllTaRecords() {
      const container = document.getElementById('all-records-display');
      if (!container) return;

      if (taJournalRecords.length === 0) {
        container.innerHTML = `<div class="p-6 text-center text-slate-400 italic bg-white rounded-xl shadow-sm">No TA Journal records found.</div>`;
        return;
      }

      let html = `<div class="bg-white rounded-xl shadow-sm overflow-hidden"><table style="width:100%;border-collapse:collapse;">
    <thead><tr style="background:#fef08a;border-bottom:2px solid #000;">
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Employee</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Allowance For</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">PF No.</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Entries</th>
      <th style="padding:10px;text-align:left;border-right:1px solid #ccc;">Total Amount</th>
      <th style="padding:10px;text-align:left;">Saved Date</th>
    </tr></thead><tbody>`;

      taJournalRecords.forEach(rec => {
        const name = rec.header?.name || 'N/A';
        const allowance = rec.header?.allowanceFor || 'N/A';
        const pf = rec.header?.pfNumber || 'N/A';
        const entries = rec.entries?.length || 0;
        const total = rec.grandTotal || '0.00';
        const savedAt = rec.timestamp || 'N/A';

        html += `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px;border-right:1px solid #e5e7eb;"><strong>${name}</strong></td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${allowance}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${pf}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;">${entries}</td>
      <td style="padding:10px;border-right:1px solid #e5e7eb;"><strong>Rs. ${total}</strong></td>
      <td style="padding:10px;">${savedAt}</td>
    </tr>`;
      });

      html += `</tbody></table></div>`;
      container.innerHTML = html;
    }



    function switchToTaJournal() {
      currentTaViewMode = 'journal';
      document.getElementById('ta-pdf-content').style.display = 'block';
      document.getElementById('ta-report-content').style.display = 'none';
      updateTaPreviewModeUI();
    }

    function switchToTaReport() {
      generateTaReport();
      currentTaViewMode = 'report';
      document.getElementById('ta-pdf-content').style.display = 'none';
      document.getElementById('ta-report-content').style.display = 'block';
      updateTaPreviewModeUI();
    }

    function shareTaPreview(generateFromForm = false) {
      if (generateFromForm) {
        if (Object.keys(taPageEntries).length === 0) {
          generateTaPreview();
          return;
        }
        generateTaPreview();
        switchToTaReport();
      }

      const isReport = currentTaViewMode === 'report';
      return window.shareRailsaathiContent(
        isReport ? 'RailSaarthi TA Report' : 'RailSaarthi TA Journal',
        isReport ? 'ta-report-content' : 'ta-pdf-content'
      );
    }



    function updateTaPreviewModeUI() {
      const isJournal = currentTaViewMode === 'journal';

      ['btn-ta-journal-view', 'btn-ta-journal-view-toolbar'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.classList.toggle('is-active', isJournal);
      });

      ['btn-ta-report-view', 'btn-ta-report-view-toolbar'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.classList.toggle('is-active', !isJournal);
      });

      const label = document.getElementById('ta-preview-mode-label');
      const caption = document.getElementById('ta-preview-mode-caption');

      if (label) {
        label.textContent = isJournal ? 'TA Journal Preview' : 'TA Report Preview';
      }

      if (caption) {
        caption.textContent = isJournal
          ? 'Detailed TA journal page prepared for review and printing from the top header.'
          : 'Condensed TA report prepared for review and printing from the top header.';
      }
    }



    /* ==========================================
       TA JOURNAL LOGIC
    ============================================= */
    let taPageEntries = {};
    let taEditingKey = null;

    function getLoggedInTaEmployeeName() {
      const user = window.currentUserAuth || {};
      const metadata = user.user_metadata || {};
      const profileName = typeof userProfileData !== 'undefined'
        ? [userProfileData?.name, userProfileData?.full_name, userProfileData?.employee_name,
          [userProfileData?.first_name, userProfileData?.last_name].filter(Boolean).join(' ')].find(Boolean)
        : '';
      const sidebarName = document.getElementById('sidebar-user-name')?.textContent || '';
      const candidates = [window.currentEmployeeName, profileName, metadata.full_name, metadata.name, sidebarName];
      return candidates.map(value => String(value || '').trim())
        .find(value => value && !/^not\s+set$/i.test(value) && !/^(user|railway employee)$/i.test(value)) || 'Railway Employee';
    }

    function syncTaLockedName() {
      const nameInput = document.getElementById('ta-name-locked');
      if (nameInput && !nameInput.value.trim()) nameInput.value = getLoggedInTaEmployeeName();
    }
    window.syncTaLockedName = syncTaLockedName;

    function arrangeTaDocumentFields() {
      const grid = document.querySelector('#ta-journal-wrapper .ta-document-grid');
      if (!grid) return;
      const controls = [
        '#ta-first-line', '#ta-branch-input', '#ta-hq-input', '#ta-name-locked',
        '#ta-claimed-type', '#ta-post', '#ta-pay-custom', '#ta-scale-custom',
        '#ta-level', '#ta-appt-fixed-row', 'input[readonly][value="SR"]',
        '#ta-report-unit', '#ta-month-sel'
      ];
      const fields = controls.map(selector => {
        const control = grid.querySelector(selector);
        return control && Array.from(grid.children).find(child => child.contains(control));
      }).filter((field, index, all) => field && all.indexOf(field) === index);
      fields.forEach(field => grid.appendChild(field));
      const allowanceField = Array.from(grid.children).find(child => child.contains(document.getElementById('ta-month-sel')));
      if (allowanceField) allowanceField.classList.add('ta-allowance-field');
    }

    async function initTaJournal() {
      syncTaLockedName();
      arrangeTaDocumentFields();
      if (Object.keys(taPageEntries).length === 0) resetTaSingleForm();
      await loadTaJournalFromDB();
      renderTaSavedDays();
      // Auto-select current year so saved entries can be filtered by month without a visible Year control
      const yearSelect = document.getElementById('ta-filter-year-selector');
      if (yearSelect) {
        const currentYear = String(new Date().getFullYear());
        if (Array.from(yearSelect.options).some(option => option.value === currentYear)) {
          yearSelect.value = currentYear;
        } else if (yearSelect.options.length > 1) {
          yearSelect.value = yearSelect.options[1].value;
        }
      }
      if (typeof showMonthDropdown === 'function') showMonthDropdown();
      calcTaAmountSingle();
    }

    async function loadTaJournalFromDB() {
      const currentUser = window.currentUserAuth;
      if (!currentUser || !currentUser.id) return;
      try {
        const { data, error } = await db.from('ta_journal').select('*').eq('user_id', currentUser.id).order('savedat', { ascending: false }).limit(1);
        if (error) throw error;
        if (data && data.length > 0) {
          const lastEntry = data[0];
          const restoredRestDates = parseTaDateArray(lastEntry.restDates);
          const restoredLeaveDates = parseTaDateArray(lastEntry.leaveDates);
          const restoredCrDates = parseTaDateArray(lastEntry.crDetails);
          document.getElementById('ta-rest-dates-json').value = JSON.stringify(restoredRestDates);
          document.getElementById('ta-leave-dates-json').value = JSON.stringify(restoredLeaveDates);
          document.getElementById('ta-cr-details-json').value = JSON.stringify(restoredCrDates);
          renderRestDateTags(restoredRestDates);
          renderLeaveDateTags(restoredLeaveDates);
          renderCrDetailTags(restoredCrDates); updateTaDatePickerDisplay('ta-rest-date-picker'); updateTaDatePickerDisplay('ta-leave-date-picker'); updateTaDatePickerDisplay('ta-cr-date-header');
          refreshOpenTaDateCalendars();
          if (lastEntry.entries && Array.isArray(lastEntry.entries)) {
            taPageEntries = {};
            lastEntry.entries.forEach(e => {
              taPageEntries[e.dateRaw] = e;
            });
            console.log('✅ Loaded TA Journal entries from database:', taPageEntries);
          }
        }
      } catch (error) {
        console.error('Note: Could not load from database:', error.message);
      }
    }

    async function autoSaveTaFormData() {
      const currentUser = window.currentUserAuth;
      if (!currentUser || !currentUser.id) return;

      const header = getTaHeaderData();
      const entries = Object.keys(taPageEntries).sort().map(k => taPageEntries[k]);
      const restDates = JSON.parse(document.getElementById('ta-rest-dates-json').value || '[]');
      const leaveDates = JSON.parse(document.getElementById('ta-leave-dates-json').value || '[]');
      const crDetails = JSON.parse(document.getElementById('ta-cr-details-json').value || '[]');

      const formData = {
        user_id: currentUser.id,
        user_email: currentUser.email,
        header, entries, restDates, leaveDates, crDetails,
        savedat: new Date().toISOString(),
        timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
      };

      try {
        const { error } = await db.from('ta_journal').upsert([formData], { onConflict: 'user_id' });
        if (error) {
          console.error('Error auto-saving TA form data:', error.message);
          return;
        }
        console.log('✅ TA form data auto-saved');
      } catch (error) {
        console.error('Auto-save error:', error.message);
      }
    }

    function resetTaSingleForm() {
      document.getElementById('ta-date-single').value = '';
      updateTaDatePickerDisplay('ta-date-single');
      document.querySelector('input[name="ta-mode-single"][value="byroad"]').checked = true;
      document.getElementById('ta-train-no-single').classList.add('hidden');
      document.getElementById('ta-train-no-single').value = '';
      ['ta-left-src', 'ta-arr-dest', 'ta-left-dest', 'ta-arr-src'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      document.getElementById('ta-from-stn-single').value = 'NES';
      document.getElementById('ta-to-stn-single').value = '';
      document.querySelector('input[name="ta-pct-single"][value="70"]').checked = true;
      document.getElementById('ta-pct-custom').value = '';
      document.getElementById('ta-pct-custom').classList.add('hidden');
      document.getElementById('ta-obj-single').value = '';
      document.querySelector('input[name="ta-rate-single"][value="625"]').checked = true;
      document.getElementById('ta-rate-custom').value = '';
      document.getElementById('ta-rate-custom').classList.add('hidden');
      calcTaAmountSingle();
      updateCharCount();
      taEditingKey = null;
      document.getElementById('ta-editing-date-key').value = '';
      document.getElementById('ta-editing-badge').classList.add('hidden');
      document.getElementById('ta-entry-form-title').innerHTML = '<svg class="ui-icon"><use href="#icon-calendar"></use></svg> Journey Entry';
      document.getElementById('ta-add-page-btn').innerHTML = '<svg class="ui-icon"><use href="#icon-plus"></use></svg> Add to Page';
      document.getElementById('ta-cancel-edit-btn').classList.add('hidden');
      refreshOpenTaDateCalendars();
    }

    function toggleTrainNoSingle() {
      const mode = document.querySelector('input[name="ta-mode-single"]:checked').value;
      document.getElementById('ta-train-no-single').classList.toggle('hidden', mode !== 'bytrain');
    }

    function handleRateChange() {
      const selectedRate = document.querySelector('input[name="ta-rate-single"]:checked').value;
      const customRateInput = document.getElementById('ta-rate-custom');
      if (selectedRate === 'other') {
        customRateInput.classList.remove('hidden');
        customRateInput.focus();
      } else {
        customRateInput.classList.add('hidden');
      }
      calcTaAmountSingle();
    }

    function handlePercentageChange() {
      const selectedPercentage = document.querySelector('input[name="ta-pct-single"]:checked').value;
      const customPercentageInput = document.getElementById('ta-pct-custom');
      const isCustom = selectedPercentage === 'other';
      customPercentageInput.classList.toggle('hidden', !isCustom);
      if (isCustom) customPercentageInput.focus();
      calcTaAmountSingle();
    }

    function updateCharCount() {
      const input = document.getElementById('ta-obj-single');
      const counter = document.getElementById('ta-char-count');
      if (input && counter) {
        counter.textContent = input.value.length + '/95';
      }
    }

    function calcTaAmountSingle() {
      const pctEl = document.querySelector('input[name="ta-pct-single"]:checked');
      const selectedRate = document.querySelector('input[name="ta-rate-single"]:checked').value;

      if (!pctEl) return;

      let rate;
      if (selectedRate === 'other') {
        rate = parseFloat(document.getElementById('ta-rate-custom').value);
        if (isNaN(rate)) return;
      } else {
        rate = parseFloat(selectedRate);
      }

      let pct = pctEl.value;

      // Handle combination percentages
      if (pct === '30+70' || pct === '70+30') {
        pct = 1.0; // Both combinations equal 100%
      } else if (pct === 'other') {
        const customPercentage = parseFloat(document.getElementById('ta-pct-custom').value);
        if (isNaN(customPercentage) || customPercentage < 0 || customPercentage > 100) {
          document.getElementById('ta-rs-single').value = '';
          document.getElementById('ta-paise-single').value = '';
          return;
        }
        pct = customPercentage / 100;
      } else {
        pct = parseFloat(pct) / 100;
      }

      const total = rate * pct;
      const rs = Math.floor(total);
      const paise = Math.round((total - rs) * 100);
      document.getElementById('ta-rs-single').value = rs.toFixed(0);
      document.getElementById('ta-paise-single').value = paise === 0 ? '00' : paise.toString().padStart(2, '0');
    }

    function addTaEntryToPage() {
      const dateVal = document.getElementById('ta-date-single').value;
      if (!dateVal) { customAlert("Please select a date for this entry."); return; }
      const specialDate = getTaSpecialDateMap()[dateVal];
      if (specialDate && dateVal !== taEditingKey) {
        customAlert(`${formatTaDate(dateVal)} is already marked as ${specialDate.label}. Choose another date.`);
        return;
      }
      if (taPageEntries[dateVal] && dateVal !== taEditingKey) {
        customAlert(`Entry for ${formatTaDate(dateVal)} already exists. Click Edit on that entry to modify it.`);
        return;
      }
      const mode = document.querySelector('input[name="ta-mode-single"]:checked').value;
      const trainNo = document.getElementById('ta-train-no-single').value;
      const leftSrc = document.getElementById('ta-left-src').value || '';
      const arrDest = document.getElementById('ta-arr-dest').value || '';
      const leftDest = document.getElementById('ta-left-dest').value || '';
      const arrSrc = document.getElementById('ta-arr-src').value || '';
      const fromStn = document.getElementById('ta-from-stn-single').value || 'NES';
      const toStn = document.getElementById('ta-to-stn-single').value;
      const pctSelection = document.querySelector('input[name="ta-pct-single"]:checked').value;
      const pct = pctSelection === 'other'
        ? document.getElementById('ta-pct-custom').value
        : pctSelection;
      const obj = document.getElementById('ta-obj-single').value;
      const km = 0;

      // Get rate from either radio selection or custom input
      const selectedRate = document.querySelector('input[name="ta-rate-single"]:checked').value;
      const rate = selectedRate === 'other' ? document.getElementById('ta-rate-custom').value : selectedRate;

      const rs = document.getElementById('ta-rs-single').value;
      const paise = document.getElementById('ta-paise-single').value;
      const modeLabel = mode === 'bytrain' ? `By Train${trainNo ? '<br/>(' + trainNo + ')' : ''}` : 'By Road';
      const dateObj = new Date(dateVal + 'T00:00:00');
      const monthDate = formatTaDate(dateVal);
      taPageEntries[dateVal] = {
        dateRaw: dateVal, monthDate, mode, trainNo, modeLabel,
        leftSrc, arrDest, leftDest, arrSrc, fromStn, toStn,
        pct, obj, km, rate, rs, paise
      };
      refreshOpenTaDateCalendars();
      showToast(taEditingKey ? `Entry for ${formatTaDate(dateVal)} updated!` : `Entry for ${formatTaDate(dateVal)} added to page!`);
      resetTaSingleForm();
      renderTaSavedDays();
    }

    function cancelTaEdit() { resetTaSingleForm(); }

    function formatTaDate(dateStr) {
      if (!dateStr) return '';
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }

    const taDatePickerFields = {
      'ta-rest-date-picker': { type: 'rest', label: 'Rest', triggerId: 'ta-rest-date-trigger', calendarId: 'ta-rest-date-calendar' },
      'ta-leave-date-picker': { type: 'leave', label: 'Leave', triggerId: 'ta-leave-date-trigger', calendarId: 'ta-leave-date-calendar' },
      'ta-cr-date-header': { type: 'cr', label: 'CR', triggerId: 'ta-cr-date-trigger', calendarId: 'ta-cr-date-calendar' },
      'ta-date-single': { type: 'journey', label: 'Journey', triggerId: 'ta-date-single-trigger', calendarId: 'ta-date-single-calendar' }
    };

    function parseTaDateArray(value) {
      if (Array.isArray(value)) return value.filter(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date));
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value || '[]');
          return Array.isArray(parsed) ? parsed.filter(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) : [];
        } catch (error) {
          return [];
        }
      }
      return [];
    }

    function getTaSpecialDateMap() {
      const map = {};
      [
        { type: 'rest', label: 'Rest', id: 'ta-rest-dates-json' },
        { type: 'leave', label: 'Leave', id: 'ta-leave-dates-json' },
        { type: 'cr', label: 'CR', id: 'ta-cr-details-json' }
      ].forEach(({ type, label, id }) => {
        parseTaDateArray(document.getElementById(id)?.value).forEach(date => {
          map[date] = { type, label };
        });
      });
      return map;
    }

    function updateTaDatePickerDisplay(inputId) {
      const input = document.getElementById(inputId);
      const field = taDatePickerFields[inputId];
      if (!input || !field) return;
      const trigger = document.getElementById(field.triggerId);
      if (!trigger) return;
      if (field.type === 'journey') {
        trigger.textContent = input.value ? formatTaDate(input.value) : 'Choose date';
      } else {
        const jsonId = field.type === 'rest' ? 'ta-rest-dates-json' : (field.type === 'leave' ? 'ta-leave-dates-json' : 'ta-cr-details-json');
        const dates = parseTaDateArray(document.getElementById(jsonId)?.value);
        if (dates.length === 0) {
          trigger.textContent = 'Choose date';
        } else if (dates.length === 1) {
          trigger.textContent = formatTaDate(dates[0]);
        } else {
          trigger.textContent = `${dates.length} dates selected`;
        }
      }
    }

    function openTaDatePicker(inputId) {
      const input = document.getElementById(inputId);
      const wrapper = input?.closest('.ta-date-picker');
      const field = taDatePickerFields[inputId];
      const calendar = field ? document.getElementById(field.calendarId) : null;
      if (!input || !wrapper || !calendar) return;

      document.querySelectorAll('.ta-date-calendar:not([hidden])').forEach(openCalendar => {
        openCalendar.hidden = true;
        openCalendar.closest('.ta-date-picker')?.classList.remove('is-open');
      });

      const now = new Date();
      const initialDate = input.value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const [year, month] = initialDate.split('-').map(Number);
      wrapper.dataset.viewYear = String(year);
      wrapper.dataset.viewMonth = String(month - 1);
      calendar.hidden = false;
      wrapper.classList.add('is-open');
      renderTaDateCalendar(inputId);
      const rect = calendar.getBoundingClientRect();
      calendar.classList.toggle('align-right', rect.right > window.innerWidth - 8);
      calendar.classList.toggle('align-left', rect.left < 8);
    }

    function closeTaDatePickers() {
      document.querySelectorAll('.ta-date-calendar:not([hidden])').forEach(calendar => {
        calendar.hidden = true;
        calendar.closest('.ta-date-picker')?.classList.remove('is-open');
      });
    }

    function changeTaCalendarMonth(inputId, offset) {
      const wrapper = document.getElementById(inputId)?.closest('.ta-date-picker');
      if (!wrapper) return;
      const view = new Date(Number(wrapper.dataset.viewYear), Number(wrapper.dataset.viewMonth) + offset, 1);
      wrapper.dataset.viewYear = String(view.getFullYear());
      wrapper.dataset.viewMonth = String(view.getMonth());
      renderTaDateCalendar(inputId);
    }

    function renderTaDateCalendar(inputId) {
      const input = document.getElementById(inputId);
      const wrapper = input?.closest('.ta-date-picker');
      const field = taDatePickerFields[inputId];
      const calendar = field ? document.getElementById(field.calendarId) : null;
      if (!input || !wrapper || !calendar || !field) return;

      const year = Number(wrapper.dataset.viewYear);
      const month = Number(wrapper.dataset.viewMonth);
      const firstWeekday = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const specialDates = getTaSpecialDateMap();
      const journeyDates = new Set(Object.keys(taPageEntries));
      const activeDate = input.value;
      const monthLabel = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      let daysHtml = weekdays.map(day => `<span class="ta-calendar-weekday">${day}</span>`).join('');
      for (let blank = 0; blank < firstWeekday; blank += 1) daysHtml += '<span class="ta-calendar-empty" aria-hidden="true"></span>';
      for (let day = 1; day <= daysInMonth; day += 1) {
        const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const special = specialDates[dateValue];
        const hasJourney = journeyDates.has(dateValue);
        const isCurrentJourneyEdit = field.type === 'journey' && taEditingKey === dateValue;
        const isOwnSpecialDate = Boolean(special && special.type === field.type);
        const unavailable = Boolean(special && !isOwnSpecialDate) || (hasJourney && !isCurrentJourneyEdit);
        const classes = ['ta-calendar-day'];
        if (special) classes.push(`is-${special.type}`);
        else if (hasJourney) classes.push('is-journey');
        if (activeDate === dateValue) classes.push('is-active');
        if (unavailable) classes.push('is-unavailable');
        const markerLabel = special ? special.label : (hasJourney ? 'Journey already added' : '');
        const markerText = special ? ({ rest: 'R', leave: 'L', cr: 'C' }[special.type] || '') : (hasJourney ? 'J' : '');
        const title = markerLabel ? ` title="${markerLabel}"` : '';
        const disabled = unavailable ? ' disabled aria-disabled="true"' : '';
        const action = unavailable ? '' : ` onclick="selectTaCalendarDate('${inputId}', '${dateValue}')"`;
        daysHtml += `<button type="button" class="${classes.join(' ')}"${title}${disabled}${action}><span>${day}</span>${markerText ? `<span class="ta-calendar-mark" aria-hidden="true">${markerText}</span>` : ''}</button>`;
      }

      const isMulti = field.type !== 'journey';
      calendar.innerHTML = `
        <div class="ta-calendar-header">
          <button type="button" class="ta-calendar-nav" aria-label="Previous month" onclick="changeTaCalendarMonth('${inputId}', -1)">‹</button>
          <strong>${monthLabel}</strong>
          <button type="button" class="ta-calendar-nav" aria-label="Next month" onclick="changeTaCalendarMonth('${inputId}', 1)">›</button>
        </div>
        <div class="ta-calendar-grid">${daysHtml}</div>
        <div class="ta-calendar-legend"><span class="rest"><b>R</b> Rest</span><span class="leave"><b>L</b> Leave</span><span class="cr"><b>C</b> CR</span><span class="journey"><b>J</b> Journey</span></div>
        ${isMulti ? `<div class="ta-calendar-footer"><button type="button" class="ta-calendar-done-btn" onclick="closeTaDatePickers()">Done</button></div>` : ''}
      `;
    }

    function selectTaCalendarDate(inputId, dateValue) {
      const input = document.getElementById(inputId);
      const field = taDatePickerFields[inputId];
      if (!input || !field) return;

      if (field.type === 'journey') {
        input.value = dateValue;
        updateTaDatePickerDisplay(inputId);
        closeTaDatePickers();
        refreshOpenTaDateCalendars();
        return;
      }

      // Rest, Leave, CR: Multi-tap selection without closing!
      const existingSpecial = getTaSpecialDateMap()[dateValue];
      if (existingSpecial && existingSpecial.type === field.type) {
        // Toggle OFF
        if (field.type === 'rest') removeRestDate(dateValue);
        else if (field.type === 'leave') removeleaveDate(dateValue);
        else if (field.type === 'cr') removeCrDetail(dateValue);
      } else if (!existingSpecial && !taPageEntries[dateValue]) {
        // Toggle ON
        input.value = dateValue;
        if (field.type === 'rest') addRestDate();
        else if (field.type === 'leave') addLeaveDate();
        else if (field.type === 'cr') addCrDetail();
      } else {
        customAlert(`${formatTaDate(dateValue)} is already assigned. Choose another date.`);
      }

      // Keep calendar open and re-render tapped states in real time
      renderTaDateCalendar(inputId);
      refreshOpenTaDateCalendars();
    }

    function refreshOpenTaDateCalendars() {
      Object.entries(taDatePickerFields).forEach(([inputId, field]) => {
        const calendar = document.getElementById(field.calendarId);
        if (calendar && !calendar.hidden) renderTaDateCalendar(inputId);
      });
    }

    // Calendar closing is handled explicitly by Done (multi-select) or date selection (single date).

    function editTaEntry(dateKey) {
      const e = taPageEntries[dateKey];
      if (!e) return;
      taEditingKey = dateKey;
      document.getElementById('ta-editing-date-key').value = dateKey;
      document.getElementById('ta-date-single').value = e.dateRaw;
      updateTaDatePickerDisplay('ta-date-single');
      const modeVal = e.mode || 'byroad';
      document.querySelector(`input[name="ta-mode-single"][value="${modeVal}"]`).checked = true;
      toggleTrainNoSingle();
      document.getElementById('ta-train-no-single').value = e.trainNo || '';
      document.getElementById('ta-left-src').value = e.leftSrc || '';
      document.getElementById('ta-arr-dest').value = e.arrDest || '';
      document.getElementById('ta-left-dest').value = e.leftDest || '';
      document.getElementById('ta-arr-src').value = e.arrSrc || '';
      document.getElementById('ta-from-stn-single').value = e.fromStn || 'NES';
      document.getElementById('ta-to-stn-single').value = e.toStn || '';
      const pctEl = document.querySelector(`input[name="ta-pct-single"][value="${e.pct}"]`);
      if (pctEl) {
        pctEl.checked = true;
        document.getElementById('ta-pct-custom').classList.add('hidden');
      } else {
        document.querySelector('input[name="ta-pct-single"][value="other"]').checked = true;
        document.getElementById('ta-pct-custom').classList.remove('hidden');
        document.getElementById('ta-pct-custom').value = e.pct || '';
      }
      document.getElementById('ta-obj-single').value = e.obj || '';
      updateCharCount();

      // Handle rate - check if it's one of the standard options or custom
      const rateOption = document.querySelector(`input[name="ta-rate-single"][value="${e.rate}"]`);
      if (rateOption) {
        rateOption.checked = true;
        document.getElementById('ta-rate-custom').classList.add('hidden');
      } else {
        // It's a custom rate
        document.querySelector('input[name="ta-rate-single"][value="other"]').checked = true;
        document.getElementById('ta-rate-custom').classList.remove('hidden');
        document.getElementById('ta-rate-custom').value = e.rate || '';
      }

      calcTaAmountSingle();
      document.getElementById('ta-editing-badge').classList.remove('hidden');
      document.getElementById('ta-entry-form-title').innerHTML = `<svg class="ui-icon"><use href="#icon-edit"></use></svg> Editing: ${formatTaDate(dateKey)}`;
      document.getElementById('ta-add-page-btn').innerHTML = '<svg class="ui-icon"><use href="#icon-save"></use></svg> Save Edit';
      document.getElementById('ta-cancel-edit-btn').classList.remove('hidden');
      document.getElementById('ta-single-entry-card').scrollIntoView({ behavior: 'smooth' });
    }

    function addRestDate() {
      const picker = document.getElementById('ta-rest-date-picker');
      const dateVal = picker.value;
      if (!dateVal) { customAlert("Please select a date to add as Rest."); return; }
      const existing = parseTaDateArray(document.getElementById('ta-rest-dates-json').value);
      if (existing.includes(dateVal)) { customAlert("This rest date is already added."); return; }
      if (getTaSpecialDateMap()[dateVal] || taPageEntries[dateVal]) { customAlert(`${formatTaDate(dateVal)} is already assigned. Choose another date.`); return; }
      existing.push(dateVal); existing.sort();
      document.getElementById('ta-rest-dates-json').value = JSON.stringify(existing);
      updateTaDatePickerDisplay('ta-rest-date-picker');
      renderRestDateTags(existing);
      refreshOpenTaDateCalendars();
    }

    function removeRestDate(dateVal) {
      const existing = parseTaDateArray(document.getElementById('ta-rest-dates-json').value);
      const updated = existing.filter(d => d !== dateVal);
      document.getElementById('ta-rest-dates-json').value = JSON.stringify(updated);
      renderRestDateTags(updated); updateTaDatePickerDisplay('ta-rest-date-picker');
      if (document.getElementById('ta-rest-date-picker').value === dateVal) {
        document.getElementById('ta-rest-date-picker').value = '';
        updateTaDatePickerDisplay('ta-rest-date-picker');
      }
      refreshOpenTaDateCalendars();
    }

    function renderRestDateTags(dates) {
      const container = document.getElementById('ta-rest-dates-list');
      if (!container) return;
      if (!dates || dates.length === 0) { container.innerHTML = ''; return; }
      container.innerHTML = dates.map(d => {
        const [y, m, day] = d.split('-');
        return `<span style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;padding:3px 8px;border-radius:20px;font-size:12px;font-weight:bold;display:inline-flex;align-items:center;gap:4px;">
      Rest: ${day}/${m}/${y}
      <span onclick="removeRestDate('${d}')" style="cursor:pointer;color:#ef4444;font-weight:bold;margin-left:2px;">×</span>
    </span>`;
      }).join('');
    }

    function addLeaveDate() {
      const picker = document.getElementById('ta-leave-date-picker');
      const dateVal = picker.value;
      if (!dateVal) { customAlert("Please select a date to add as Leave."); return; }
      const existing = parseTaDateArray(document.getElementById('ta-leave-dates-json').value);
      if (existing.includes(dateVal)) { customAlert("This leave date is already added."); return; }
      if (getTaSpecialDateMap()[dateVal] || taPageEntries[dateVal]) { customAlert(`${formatTaDate(dateVal)} is already assigned. Choose another date.`); return; }
      existing.push(dateVal); existing.sort();
      document.getElementById('ta-leave-dates-json').value = JSON.stringify(existing);
      updateTaDatePickerDisplay('ta-leave-date-picker');
      renderLeaveDateTags(existing);
      refreshOpenTaDateCalendars();
    }

    function removeleaveDate(dateVal) {
      const existing = parseTaDateArray(document.getElementById('ta-leave-dates-json').value);
      const updated = existing.filter(d => d !== dateVal);
      document.getElementById('ta-leave-dates-json').value = JSON.stringify(updated);
      renderLeaveDateTags(updated); updateTaDatePickerDisplay('ta-leave-date-picker');
      if (document.getElementById('ta-leave-date-picker').value === dateVal) {
        document.getElementById('ta-leave-date-picker').value = '';
        updateTaDatePickerDisplay('ta-leave-date-picker');
      }
      refreshOpenTaDateCalendars();
    }

    function renderLeaveDateTags(dates) {
      const container = document.getElementById('ta-leave-dates-list');
      if (!container) return;
      if (!dates || dates.length === 0) { container.innerHTML = ''; return; }
      container.innerHTML = dates.map(d => {
        const [y, m, day] = d.split('-');
        return `<span style="background:#fef3c7;color:#92400e;border:1px solid #fcd34d;padding:3px 8px;border-radius:20px;font-size:12px;font-weight:bold;display:inline-flex;align-items:center;gap:4px;">
      Leave: ${day}/${m}/${y}
      <span onclick="removeleaveDate('${d}')" style="cursor:pointer;color:#ef4444;font-weight:bold;margin-left:2px;">×</span>
    </span>`;
      }).join('');
    }

    function addCrDetail() {
      const dateInput = document.getElementById('ta-cr-date-header');
      const crDate = dateInput.value;
      if (!crDate) { customAlert("Please select a CR date"); return; }
      const existing = parseTaDateArray(document.getElementById('ta-cr-details-json').value);
      if (existing.includes(crDate)) { customAlert("This CR date is already added."); return; }
      if (getTaSpecialDateMap()[crDate] || taPageEntries[crDate]) { customAlert(`${formatTaDate(crDate)} is already assigned. Choose another date.`); return; }
      existing.push(crDate); existing.sort();
      document.getElementById('ta-cr-details-json').value = JSON.stringify(existing);
      updateTaDatePickerDisplay('ta-cr-date-header');
      renderCrDetailTags(existing);
      refreshOpenTaDateCalendars();
    }

    function removeCrDetail(dateVal) {
      const existing = parseTaDateArray(document.getElementById('ta-cr-details-json').value);
      const updated = existing.filter(d => d !== dateVal);
      document.getElementById('ta-cr-details-json').value = JSON.stringify(updated);
      renderCrDetailTags(updated); updateTaDatePickerDisplay('ta-cr-date-header');
      if (document.getElementById('ta-cr-date-header').value === dateVal) {
        document.getElementById('ta-cr-date-header').value = '';
        updateTaDatePickerDisplay('ta-cr-date-header');
      }
      refreshOpenTaDateCalendars();
    }

    function renderCrDetailTags(crArray) {
      const container = document.getElementById('ta-cr-details-list');
      if (!container) return;
      if (!crArray || crArray.length === 0) { container.innerHTML = ''; return; }
      container.innerHTML = crArray.map(dateVal => {
        const [y, m, day] = dateVal.split('-');
        return `<span style="background:#e9d5ff;color:#6b21a8;border:1px solid #d8b4fe;padding:3px 8px;border-radius:20px;font-size:12px;font-weight:bold;display:inline-flex;align-items:center;gap:4px;">
      CR: ${day}/${m}/${y}
      <span onclick="removeCrDetail('${dateVal}')" style="cursor:pointer;color:#ef4444;font-weight:bold;margin-left:2px;">×</span>
    </span>`;
      }).join('');
    }

    function deleteTaEntry(dateKey) {
      if (confirm(`Remove entry for ${formatTaDate(dateKey)}?`)) {
        delete taPageEntries[dateKey];
        if (taEditingKey === dateKey) resetTaSingleForm();
        renderTaSavedDays();
        refreshOpenTaDateCalendars();
        showToast('Entry removed.');
      }
    }

    function clearAllTaEntries() {
      if (Object.keys(taPageEntries).length === 0) { customAlert("No entries to clear."); return; }
      if (confirm("Clear ALL saved entries? This cannot be undone.")) {
        taPageEntries = {};
        resetTaSingleForm();
        renderTaSavedDays();
        refreshOpenTaDateCalendars();
        showToast("All entries cleared.");
      }
    }

    // Edit TA entry from database
    function editDbTaEntry(dateKey) {
      const monthSelect = document.getElementById('ta-filter-month-selector');
      const yearSelect = document.getElementById('ta-filter-year-selector');

      if (!monthSelect || !monthSelect.value || !yearSelect || !yearSelect.value) {
        customAlert('Please select Month and Year first');
        return;
      }

      const monthNum = monthMap[monthSelect.value];
      const year = parseInt(yearSelect.value);

      (async () => {
        try {
          console.log('\n=== EDIT DB ENTRY - START ===');
          console.log('🖊️ Editing dateKey:', dateKey);

          const user = window.currentUserAuth;
          if (!user) {
            customAlert('Not logged in');
            return;
          }

          // Query the database record
          const { data: record, error: queryErr } = await window.db
            .from('ta_journal')
            .select('*')
            .eq('user_id', user.id)
            .eq('month', monthNum)
            .eq('year', year)
            .single();

          if (queryErr) {
            console.error('❌ Query error:', queryErr);
            customAlert('Entry not found in database');
            return;
          }

          if (!record) {
            customAlert('Record not found');
            return;
          }

          console.log('📋 Found record:', record);

          if (!Array.isArray(record.entries)) {
            customAlert('Invalid record format');
            return;
          }

          const entry = record.entries.find(e => e.dateKey === dateKey);

          if (!entry) {
            console.error('❌ Entry not found. Available keys:', record.entries.map(e => e.dateKey));
            customAlert('Entry data not found in record');
            return;
          }

          console.log('✅ Found entry:', entry);

          // Populate form fields with entry data
          document.getElementById('ta-editing-date-key').value = dateKey;
          document.getElementById('ta-date-single').value = dateKey;
          updateTaDatePickerDisplay('ta-date-single');

          const modeVal = entry.mode || 'byroad';
          document.querySelector(`input[name="ta-mode-single"][value="${modeVal}"]`).checked = true;
          toggleTrainNoSingle();

          document.getElementById('ta-train-no-single').value = entry.trainNo || '';
          document.getElementById('ta-left-src').value = entry.leftSrc || '';
          document.getElementById('ta-arr-dest').value = entry.arrDest || '';
          document.getElementById('ta-left-dest').value = entry.leftDest || '';
          document.getElementById('ta-arr-src').value = entry.arrSrc || '';
          document.getElementById('ta-from-stn-single').value = entry.fromStn || 'NES';
          document.getElementById('ta-to-stn-single').value = entry.toStn || '';

          const pctEl = document.querySelector(`input[name="ta-pct-single"][value="${entry.pct}"]`);
          if (pctEl) {
            pctEl.checked = true;
            document.getElementById('ta-pct-custom').classList.add('hidden');
          } else {
            document.querySelector('input[name="ta-pct-single"][value="other"]').checked = true;
            document.getElementById('ta-pct-custom').classList.remove('hidden');
            document.getElementById('ta-pct-custom').value = entry.pct || '';
          }

          document.getElementById('ta-obj-single').value = entry.obj || '';
          updateCharCount();

          // Handle rate - check if it's one of the standard options or custom
          const rateOption = document.querySelector(`input[name="ta-rate-single"][value="${entry.rate}"]`);
          if (rateOption) {
            rateOption.checked = true;
            document.getElementById('ta-rate-custom').classList.add('hidden');
          } else {
            // It's a custom rate
            document.querySelector('input[name="ta-rate-single"][value="other"]').checked = true;
            document.getElementById('ta-rate-custom').classList.remove('hidden');
            document.getElementById('ta-rate-custom').value = entry.rate || '';
          }

          // Set A and P amount fields
          document.getElementById('ta-amount-rs').value = entry.rs || '0';
          document.getElementById('ta-amount-paise').value = entry.paise || '0';

          // Store that we're editing from DB
          window.taEditingFromDB = true;
          taEditingKey = dateKey;

          calcTaAmountSingle();
          document.getElementById('ta-editing-badge').classList.remove('hidden');
          document.getElementById('ta-entry-form-title').innerHTML = `<svg class="ui-icon"><use href="#icon-edit"></use></svg> Editing: ${formatTaDate(dateKey)}`;
          document.getElementById('ta-add-page-btn').innerHTML = '<svg class="ui-icon"><use href="#icon-save"></use></svg> Save Edit';
          document.getElementById('ta-cancel-edit-btn').classList.remove('hidden');
          document.getElementById('ta-single-entry-card').scrollIntoView({ behavior: 'smooth' });

          console.log('=== EDIT DB ENTRY - SUCCESS ===\n');
        } catch (err) {
          console.error('❌ Error loading entry for edit:', err);
          customAlert('Error: ' + (err?.message || 'Unknown error'));
        }
      })();
    }

    // Delete TA entry from database
    async function deleteDbTaEntry(dateKey) {
      if (!confirm('Delete this entry?')) return;

      const user = window.currentUserAuth;
      if (!user) {
        customAlert('Not logged in');
        return;
      }

      try {
        console.log('\n=== DELETE DB ENTRY - START ===');
        console.log('🗑️ Deleting dateKey:', dateKey);
        console.log('👤 User ID:', user.id);
        console.log('📝 DateKey type:', typeof dateKey);

        // Get the month and year from the current filtered view
        const monthSelect = document.getElementById('ta-filter-month-selector');
        const yearSelect = document.getElementById('ta-filter-year-selector');

        if (!monthSelect || !monthSelect.value || !yearSelect || !yearSelect.value) {
          customAlert('Please select Month and Year first');
          return;
        }

        const monthNum = monthMap[monthSelect.value];
        const year = parseInt(yearSelect.value);

        console.log('📅 Search params - Month:', monthNum, 'Year:', year);
        console.log('🔍 Querying for record...');

        // Query the database record
        const { data: records, error: queryErr } = await window.db
          .from('ta_journal')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', monthNum)
          .eq('year', year)
          .single();

        if (queryErr) {
          console.error('❌ Query error:', queryErr);
          throw new Error(`Failed to find record: ${queryErr.message}`);
        }

        if (!records) {
          customAlert('Record not found');
          console.log('⚠️ No record found');
          return;
        }

        const record = records;
        console.log('📋 Found record ID:', record.id);
        console.log('📊 Current entries:', record.entries);
        console.log('📊 Current entries count:', record.entries ? record.entries.length : 0);

        if (!Array.isArray(record.entries)) {
          throw new Error('Entries is not an array');
        }

        // Find and check the entry exists
        const existingEntry = record.entries.find(e => {
          console.log('  Comparing:', e.dateKey, '===', dateKey, '?', e.dateKey === dateKey);
          return e.dateKey === dateKey;
        });

        if (!existingEntry) {
          console.error('❌ Entry not found in record. Available keys:', record.entries.map(e => e.dateKey));
          customAlert('Entry not found in record');
          return;
        }

        console.log('✅ Entry found:', existingEntry);

        // Remove the entry with matching dateKey
        const filteredEntries = record.entries.filter(e => e.dateKey !== dateKey);

        console.log(`✂️ Filter result: ${record.entries.length} → ${filteredEntries.length} entries`);
        console.log('📊 Remaining entries:', filteredEntries);

        // Recalculate total amount
        let newTotal = 0;
        filteredEntries.forEach(e => {
          const amount = parseFloat(e.rs || 0) + (parseFloat(e.paise || 0) / 100);
          newTotal += amount;
        });

        console.log('💰 New total amount:', newTotal.toFixed(2));

        // Update the record with new entries
        showToast('⏳ Updating database...');

        const updateData = {
          entries: filteredEntries,
          total_amount: newTotal,
          savedat: new Date().toISOString()
        };

        console.log('🔄 Updating record with:', updateData);

        const { data: updateResult, error: updateErr } = await window.db
          .from('ta_journal')
          .update(updateData)
          .eq('id', record.id)
          .select();

        if (updateErr) {
          console.error('❌ UPDATE ERROR:', updateErr);
          throw new Error(`Update failed: ${updateErr.message}`);
        }

        console.log('✅ Update successful:', updateResult);
        console.log('=== DELETE DB ENTRY - SUCCESS ===\n');

        showToast('✅ Entry deleted successfully');

        // Reload the filtered entries
        await loadTaEntriesByMonth();

      } catch (err) {
        console.error('❌ ERROR in deleteDbTaEntry:', err.message);
        console.error('Stack:', err.stack);
        customAlert('Error: ' + (err?.message || 'Unknown error'));
        showToast('❌ Delete failed');
      }
    }

    function renderTaSavedDays() {
      const container = document.getElementById('ta-saved-days-list');
      const countEl = document.getElementById('ta-days-count');
      const keys = Object.keys(taPageEntries).sort();
      countEl.innerText = keys.length;
      if (keys.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-sm text-center py-4 italic">No entries yet. Add a day above.</p>`;
        return;
      }

      container.innerHTML = keys.map((key, i) => {
        const e = taPageEntries[key];
        const dateObj = new Date(key + 'T00:00:00');
        const dayNum = parseInt(key.split('-')[2]);
        const monthNum = parseInt(key.split('-')[1]);
        const yearNum = parseInt(key.split('-')[0]);

        return `
    <div style="background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; overflow: hidden;">
      
      <!-- ROW 1: Entry # + Date + Mode on left, Buttons on right -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
          <span style="font-weight: 700; color: #0f172a; min-width: 20px;">${i + 1}.</span>
          <span style="color: #0f172a; font-weight: 600;">${dayNum}/${monthNum.toString().padStart(2, '0')}/${yearNum}</span>
          <span style="color: #6b7280; text-transform: capitalize; font-size: 12px; font-weight: 500;">${e.mode === 'bytrain' ? 'By Train' : 'By Road'}</span>
        </div>
        
        <div style="display: flex; gap: 4px;">
          <button onclick="editTaEntry('${key}')" style="background: #fbbf24; color: #78350f; border: none; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; white-space: nowrap;">
            <svg class="ui-icon"><use href="#icon-edit"></use></svg> Edit
          </button>
          <button onclick="deleteTaEntry('${key}')" style="background: #ef4444; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; white-space: nowrap;">
            <svg class="ui-icon"><use href="#icon-trash"></use></svg>
          </button>
        </div>
      </div>
      
      <!-- ROW 2: Route | Amount | Rate & Percentage | Objective -->
      <div style="font-size: 11px; color: #1f2937; font-weight: 500; line-height: 1.1; margin-left: 20px;">
        ${e.fromStn} → ${e.toStn || '?'} | Rs. ${e.rs}.${e.paise} | ${e.pct}% of ${e.rate} | ${e.obj || '−'}
      </div>
    </div>
    `;
      }).join('');
    }

    function viewTaEntryDetails(dateKey) {
      const e = taPageEntries[dateKey];
      if (!e) return;

      const dateObj = new Date(dateKey + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
      const fullDate = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      let detailsHtml = `
  <div style="max-width: 500px; margin: 0 auto;">
    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <div style="font-size: 28px; margin-bottom: 6px;"><svg class="ui-icon"><use href="#icon-clipboard"></use></svg> Entry Details</div>
      <div style="font-size: 14px; opacity: 0.9;">${fullDate}</div>
    </div>
    
    <!-- DETAILS TABLE -->
    <div style="background: white; border: 2px solid #e2e8f0; border-radius: 0 0 12px 12px; overflow: hidden;">
      <!-- Date Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-calendar"></use></svg> Date</div>
        <div style="color: #475569; font-size: 14px; font-weight: 500;">${formatTaDate(dateKey)} (${dayName})</div>
      </div>
      
      <!-- Mode Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-route"></use></svg> Mode</div>
        <div style="color: #475569; font-size: 14px; font-weight: 500;">${e.mode === 'bytrain' ? '<svg class="ui-icon"><use href="#icon-train"></use></svg> By Train' : '<svg class="ui-icon"><use href="#icon-road"></use></svg> By Road'}</div>
      </div>
      
      <!-- From Station Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-pin"></use></svg> From Station</div>
        <div style="color: #475569; font-size: 14px; font-weight: 500;">${e.fromStn || 'Not specified'}</div>
      </div>
      
      <!-- To Station Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-pin"></use></svg> To Station</div>
        <div style="color: #475569; font-size: 14px; font-weight: 500;">${e.toStn || 'Not specified'}</div>
      </div>
      
      <!-- Objective Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-file"></use></svg> Objective</div>
        <div style="color: #475569; font-size: 14px; font-weight: 500;">${e.obj || '(Not specified)'}</div>
      </div>
      
      <!-- Daily Rate Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px; background: #f8fafc;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-money"></use></svg> Daily Rate</div>
        <div style="color: #0f172a; font-size: 14px; font-weight: 700;">Rs. ${e.rate}</div>
      </div>
      
      <!-- Percentage Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px;">
        <div style="font-weight: 700; color: #0f172a; font-size: 13px;"><svg class="ui-icon"><use href="#icon-chart"></use></svg> Percentage</div>
        <div style="color: #0f172a; font-size: 14px; font-weight: 700;">${e.pct}%</div>
      </div>
      
      <!-- Calculation Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e2e8f0; padding: 14px 16px; background: #f0fdf4;">
        <div style="font-weight: 700; color: #166534; font-size: 13px;"><svg class="ui-icon"><use href="#icon-calculator"></use></svg> Calculation</div>
        <div style="color: #166534; font-size: 13px; font-weight: 500;">Rs. ${e.rate} × ${e.pct}% = <span style="font-weight: 800;">Rs. ${e.rs}.${e.paise}</span></div>
      </div>
      
      <!-- Amount Row (Final) -->
      <div style="display: grid; grid-template-columns: 35% 65%; padding: 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
        <div style="font-weight: 700; font-size: 14px;"><svg class="ui-icon"><use href="#icon-money"></use></svg> Total Amount</div>
        <div style="font-size: 18px; font-weight: 800;">Rs. ${e.rs}.${e.paise}</div>
      </div>
      
      ${e.mode === 'bytrain' ? `
      <!-- TRAIN SECTION HEADER -->
      <div style="padding: 14px 16px; background: #faf5ff; border-top: 2px solid #e9d5ff;">
      <div style="font-weight: 700; color: #6b21a8; font-size: 13px;"><svg class="ui-icon"><use href="#icon-train"></use></svg> TRAIN JOURNEY DETAILS</div>
      </div>
      
      <!-- Train Number Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e9d5ff; padding: 12px 16px;">
        <div style="font-weight: 600; color: #6b21a8; font-size: 12px;">Train Number</div>
        <div style="color: #6b21a8; font-size: 13px; font-weight: 500;">${e.trainNo || 'N/A'}</div>
      </div>
      
      <!-- Left Source Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e9d5ff; padding: 12px 16px; background: #faf5ff;">
        <div style="font-weight: 600; color: #6b21a8; font-size: 12px;">Left Source At</div>
        <div style="color: #6b21a8; font-size: 13px; font-weight: 500;">${e.leftSrc || 'N/A'}</div>
      </div>
      
      <!-- Arrived Destination Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e9d5ff; padding: 12px 16px;">
        <div style="font-weight: 600; color: #6b21a8; font-size: 12px;">Arrived Destination</div>
        <div style="color: #6b21a8; font-size: 13px; font-weight: 500;">${e.arrDest || 'N/A'}</div>
      </div>
      
      <!-- Left Destination Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; border-bottom: 1px solid #e9d5ff; padding: 12px 16px; background: #faf5ff;">
        <div style="font-weight: 600; color: #6b21a8; font-size: 12px;">Left Destination At</div>
        <div style="color: #6b21a8; font-size: 13px; font-weight: 500;">${e.leftDest || 'N/A'}</div>
      </div>
      
      <!-- Arrived Source Row -->
      <div style="display: grid; grid-template-columns: 35% 65%; padding: 12px 16px;">
        <div style="font-weight: 600; color: #6b21a8; font-size: 12px;">Arrived Source At</div>
        <div style="color: #6b21a8; font-size: 13px; font-weight: 500;">${e.arrSrc || 'N/A'}</div>
      </div>
      ` : ''}
    </div>
    
    <!-- FOOTER -->
    <div style="text-align: center; padding: 16px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
      ✓ Close this popup and use Edit/Delete buttons to modify or remove entries
    </div>
  </div>
  `;

      customAlert(detailsHtml);
    }

    /* ==========================================
       TA PREVIEW GENERATION
    ============================================= */
    function toggleTaPostCustom() {
      const postSelect = document.getElementById('ta-post');
      const customInput = document.getElementById('ta-post-custom');
      if (postSelect.value === 'other') {
        customInput.style.display = 'block';
        customInput.focus();
      } else {
        customInput.style.display = 'none';
      }
    }

    function getTaHeaderData() {
      const nameInput = document.getElementById('ta-name-locked');
      const name = nameInput?.value.trim() || getLoggedInTaEmployeeName();
      const restDatesRaw = JSON.parse(document.getElementById('ta-rest-dates-json').value || '[]');
      const restDatesFmt = restDatesRaw.map(d => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; });
      const leaveDatesRaw = JSON.parse(document.getElementById('ta-leave-dates-json').value || '[]');
      const leaveDatesFmt = leaveDatesRaw.map(d => { const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; });
      let crEntries = '';
      const crDetailsRaw = JSON.parse(document.getElementById('ta-cr-details-json').value || '[]');
      if (crDetailsRaw.length > 0) {
        const restParts = [];
        const leaveParts = [];
        const crParts = [];
        if (restDatesFmt.length > 0) restParts.push(`Rest - ${restDatesFmt.length} (${restDatesFmt.join(', ')})`);
        if (leaveDatesFmt.length > 0) leaveParts.push(`Leave - ${leaveDatesFmt.length} (${leaveDatesFmt.join(', ')})`);
        if (crDetailsRaw.length > 0) {
          const crDatesFmt = crDetailsRaw.map(dateVal => {
            const [y, m, d] = dateVal.split('-');
            return `${d}/${m}/${y}`;
          });
          crParts.push(`CR - ${crDatesFmt.length} (${crDatesFmt.join(', ')})`);
        }
        const allParts = [...restParts, ...leaveParts, ...crParts];
        crEntries = allParts.join(', ');
      } else {
        // Even without CR, show Rest/Leave if they exist
        const restParts = [];
        const leaveParts = [];
        if (restDatesFmt.length > 0) restParts.push(`Rest - ${restDatesFmt.length} (${restDatesFmt.join(', ')})`);
        if (leaveDatesFmt.length > 0) leaveParts.push(`Leave - ${leaveDatesFmt.length} (${leaveDatesFmt.join(', ')})`);
        crEntries = [...restParts, ...leaveParts].join(', ');
      }
      const pfNumber = document.getElementById('ta-pf-number').value;
      const mon = document.getElementById('ta-month-sel').value;
      const yr = document.getElementById('ta-year-sel').value;
      const allowanceFor = mon + '/' + yr;
      const branch = document.getElementById('ta-branch-input').value || 'DANAPUR';
      const hqStation = document.getElementById('ta-hq-input').value || 'NES';
      const firstLine = 'ENGINEERING';
      const postSelect = document.getElementById('ta-post').value;
      const post = postSelect === 'other' ? document.getElementById('ta-post-custom').value.trim() : postSelect;
      const pay = document.getElementById('ta-pay-custom').value || '25,600';
      const scale = document.getElementById('ta-scale-custom').value || '5200-20200';
      const level = document.getElementById('ta-level').value;
      const apptRaw = document.getElementById('ta-appointment-date')?.value || '';
      const fixedApptDate = document.getElementById('ta-appt-fixed-row')?.textContent.trim() || '24/07/2014';
      const apptDate = apptRaw ? apptRaw.split('-').reverse().join('/') : fixedApptDate;
      const reportUnit = document.getElementById('ta-report-unit').value;
      const claimedType = document.getElementById('ta-claimed-type').value || 'T.A';
      return {
        name, firstLine, branch, hqStation,
        restDates: restDatesFmt, restDatesCount: restDatesRaw.length,
        leaveDates: leaveDatesFmt, leaveDatesCount: leaveDatesRaw.length,
        crEntries,
        pfNumber, allowanceFor, post, pay, scale, level, apptDate,
        designation: claimedType, rule: 'SR',
        reportUnit
      };
    }

    function buildSummary(entries) {
      const groups = {};
      entries.forEach(e => {
        const key = `${e.rate}_${e.pct}`;
        if (!groups[key]) groups[key] = { rate: e.rate, pct: e.pct, count: 0, total: 0 };
        groups[key].count++;
        groups[key].total += parseFloat(e.rs) + parseFloat(e.paise) / 100;
      });
      return groups;
    }

    function numberToWords(num) {
      const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      function helper(n) {
        if (n === 0) return '';
        if (n < 20) return units[n] + ' ';
        if (n < 100) return tens[Math.floor(n / 10)] + ' ' + helper(n % 10);
        if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred ' + helper(n % 100);
        if (n < 100000) return helper(Math.floor(n / 1000)) + 'Thousand ' + helper(n % 1000);
        if (n < 10000000) return helper(Math.floor(n / 100000)) + 'Lakh ' + helper(n % 100000);
        return helper(Math.floor(n / 10000000)) + 'Crore ' + helper(n % 10000000);
      }
      const intPart = Math.floor(num);
      const paisePart = Math.round((num - intPart) * 100);
      let result = helper(intPart).trim() + ' Rupees';
      if (paisePart > 0) result += ' and ' + helper(paisePart).trim() + ' Paise';
      return result + ' Only';
    }

    function buildTaTableHeaderPage2(bfValue, page1TotalRs, page1TotalPaise) {
      return `
    <colgroup>
      <col style="width:9%;"><col style="width:10%;"><col style="width:7%;"><col style="width:7%;">
      <col style="width:7%;"><col style="width:7%;"><col style="width:3%;"><col style="width:5%;">
      <col style="width:26%;"><col style="width:7%;"><col style="width:5%;"><col style="width:5%;">
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">महीना और तारीख<br><span style="font-size:9pt;">Month &amp; Date</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">गाड़ी न.<br><span style="font-size:9pt;">No. of Train<br>Steamer/Plane</span></th>
        <th colspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;">प्रस्थान/पहुँचने का समय<br><span style="font-size:9pt;">Time left / Time arrived</span></th>
        <th colspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;">स्टेशन/Station</th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">किलो<br>मीटर<br><span style="font-size:9pt;">Kms.</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">दिन/रात<br><span style="font-size:9pt;">Day/<br>Night</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">यात्रा के उद्देश्य<br><span style="font-size:9pt;">Object of Journey</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;text-align:center;">दर<br><span style="font-size:9pt;">Rate</span><br><span style="font-size:9pt;font-weight:bold;">BF = </span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">रु.<br><span style="font-size:9pt;">Rs.</span><br><span style="font-size:9pt;font-weight:bold;">${page1TotalRs}</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">पै.<br><span style="font-size:9pt;">P.</span><br><span style="font-size:9pt;font-weight:bold;">${String(page1TotalPaise).padStart(2, '0')}</span></th>
      </tr>
      <tr>
        <th style="border:1px solid #000;padding:1px;font-size:9pt;font-family:'Noto Sans Devanagari',Arial;">प्रस्थान<br>Time left</th>
        <th style="border:1px solid #000;padding:1px;font-size:9pt;font-family:'Noto Sans Devanagari',Arial;">पहुँचना<br>Time arrived</th>
        <th style="border:1px solid #000;padding:1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;">से<br>/From</th>
        <th style="border:1px solid #000;padding:1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;">तक<br>/To</th>
      </tr>
    </thead>`;
    }

    function buildTaTableHeader() {
      return `
    <colgroup>
      <col style="width:9%;"><col style="width:10%;"><col style="width:7%;"><col style="width:7%;">
      <col style="width:7%;"><col style="width:7%;"><col style="width:3%;"><col style="width:5%;">
      <col style="width:26%;"><col style="width:7%;"><col style="width:5%;"><col style="width:5%;">
    </colgroup>
    <thead>
      <tr>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">महीना और तारीख<br><span style="font-size:9pt;">Month &amp; Date</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">गाड़ी न.<br><span style="font-size:9pt;">No. of Train<br>Steamer/Plane</span></th>
        <th colspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;">प्रस्थान/पहुँचने का समय<br><span style="font-size:9pt;">Time left / Time arrived</span></th>
        <th colspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;">स्टेशन/Station</th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">किलो<br>मीटर<br><span style="font-size:9pt;">Kms.</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">दिन/रात<br><span style="font-size:9pt;">Day/<br>Night</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">यात्रा के उद्देश्य<br><span style="font-size:9pt;">Object of Journey</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">दर<br><span style="font-size:9pt;">Rate</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">रु.<br><span style="font-size:9pt;">Rs.</span></th>
        <th rowspan="2" style="border:1px solid #000;padding:2px 1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;font-weight:bold;line-height:1.3;vertical-align:middle;">पै.<br><span style="font-size:9pt;">P.</span></th>
      </tr>
      <tr>
        <th style="border:1px solid #000;padding:1px;font-size:9pt;font-family:'Noto Sans Devanagari',Arial;">प्रस्थान<br>Time left</th>
        <th style="border:1px solid #000;padding:1px;font-size:9pt;font-family:'Noto Sans Devanagari',Arial;">पहुँचना<br>Time arrived</th>
        <th style="border:1px solid #000;padding:1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;">से<br>/From</th>
        <th style="border:1px solid #000;padding:1px;font-family:'Noto Sans Devanagari',Arial;font-size:10pt;">तक<br>/To</th>
      </tr>
    </thead>`;
    }

    function makeSplitCell(topLeft, bottomRight) {
      if (!topLeft && !bottomRight) return `<td style="border:1px solid #000;height:36px;padding:0;overflow:hidden;"></td>`;
      return `<td style="border:1px solid #000;height:36px;padding:0;position:relative;overflow:hidden;">
    <div style="position:absolute;top:1px;left:3px;font-size:13.5pt;font-family:'Times New Roman',serif;line-height:1;white-space:nowrap;font-weight:bold;overflow:hidden;">${topLeft || ''}</div>
    <div style="position:absolute;bottom:1px;right:3px;font-size:13.5pt;font-family:'Times New Roman',serif;line-height:1;white-space:nowrap;text-align:right;font-weight:bold;overflow:hidden;">${bottomRight || ''}</div>
  </td>`;
    }

    function makeKmsCell(kmsValue) {
      if (kmsValue && kmsValue <= 8) return `<td style="border:1px solid #000;padding:1px 2px;font-size:11pt;font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:visible;"></td>`;
      return `<td style="border:1px solid #000;padding:1px 2px;font-size:11pt;font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:visible;"></td>`;
    }

    function makeStationCell(fromStn, toStn, colType) {
      const topVal = colType === 'from' ? (fromStn ? fromStn.toUpperCase() : '') : (toStn ? toStn.toUpperCase() : '');
      const bottomVal = colType === 'from' ? (toStn ? toStn.toUpperCase() : '') : (fromStn ? fromStn.toUpperCase() : '');
      if (!topVal && !bottomVal) return `<td style="border:1px solid #000;height:36px;padding:0;overflow:hidden;"></td>`;
      return `<td style="border:1px solid #000;height:36px;padding:0;position:relative;overflow:hidden;">
    <div style="position:absolute;top:1px;left:3px;font-size:12.5pt;font-family:'Times New Roman',serif;line-height:1;white-space:nowrap;text-align:left;font-weight:bold;overflow:hidden;">${topVal}</div>
    <div style="position:absolute;bottom:1px;right:3px;font-size:12.5pt;font-family:'Times New Roman',serif;line-height:1;white-space:nowrap;text-align:right;font-weight:bold;overflow:hidden;">${bottomVal}</div>
  </td>`;
    }

    function toSentenceCase(text) {
      if (!text) return '';
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    function toSentenceCaseWithAcronyms(text) {
      if (!text) return '';
      const acronyms = ['KM', 'RMC', 'RGD', 'DFW', 'SEJ', 'NATESAR', 'NES', 'HIS', 'TIA', 'NKPU', 'SILAO'];
      const stationCodes = ['NES', 'NATESAR', 'DFW', 'SILAO'];

      // Convert to sentence case
      let result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

      // Preserve acronyms - find and replace them case-insensitively to maintain uppercase
      acronyms.forEach(acronym => {
        const regex = new RegExp('\\b' + acronym + '\\b', 'gi');
        result = result.replace(regex, acronym);
      });

      return result;
    }

    function buildTaDataRows(entries) {
      let rows = '';
      entries.forEach(e => {
        const timeLeftCell = makeSplitCell(e.leftSrc, e.leftDest);
        const timeArrivedCell = makeSplitCell(e.arrDest, e.arrSrc);
        const fromStnCell = makeStationCell(e.fromStn, e.toStn, 'from');
        const toStnCell = makeStationCell(e.fromStn, e.toStn, 'to');
        const pctLabel = e.pct ? e.pct + '%' : '';
        const objText = toSentenceCaseWithAcronyms(e.obj || '');
        const modeFontSize = e.mode === 'bytrain' ? '11.5pt' : '13.5pt';
        const pctFontSize = String(e.pct).includes('+') ? '11.5pt' : '13.5pt';
        rows += `<tr>
      <td style="border:1px solid #000;padding:1px 2px;font-size:13.5pt;font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:hidden;">${e.monthDate || ''}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:${modeFontSize};font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:hidden;white-space:normal;line-height:1.2;">${e.modeLabel}</td>
      ${timeLeftCell}${timeArrivedCell}${fromStnCell}${toStnCell}
      <td style="border:1px solid #000;padding:1px 2px;font-size:13.5pt;font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:hidden;"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:${pctFontSize};font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:hidden;">${pctLabel}</td>
      <td class="ta-obj-cell" style="border:1px solid #000;padding:0 !important;height:36px !important;text-align:left !important;vertical-align:middle;overflow:hidden;box-sizing:border-box;">
        <div class="ta-obj-container" style="padding:2px 3px;font-size:8.5pt;font-family:'Times New Roman',serif;height:36px !important;max-height:36px !important;overflow:hidden !important;word-wrap:break-word;word-break:break-word;white-space:normal;line-height:1.15 !important;font-weight:bold;box-sizing:border-box;">${objText}</div>
      </td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:13.5pt;font-family:'Times New Roman',serif;height:36px;text-align:center;vertical-align:middle;font-weight:bold;overflow:hidden;">${e.rate}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:13.5pt;font-family:'Times New Roman',serif;font-weight:bold;height:36px;text-align:center;vertical-align:middle;overflow:hidden;">${e.rs}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:13.5pt;font-family:'Times New Roman',serif;font-weight:bold;height:36px;text-align:center;vertical-align:middle;overflow:hidden;">${e.paise}</td>
    </tr>`;
      });
      return rows;
    }

    function buildBlankRows(n) {
      let rows = '';
      for (let i = 0; i < n; i++) {
        // Create completely blank rows (no diagonal in cells)
        const regularCells = Array(10).fill('<td style="border:1px solid #000;font-size:11pt;font-family:\'Times New Roman\',serif;overflow:hidden;"></td>').join('');
        const blankRs = '<td style="border:1px solid #000;font-size:11pt;font-family:\'Times New Roman\',serif;overflow:hidden;"></td>';
        const blankPaise = '<td style="border:1px solid #000;font-size:11pt;font-family:\'Times New Roman\',serif;overflow:hidden;"></td>';
        rows += `<tr style="height:36px;" class="blank-row">${regularCells}${blankRs}${blankPaise}</tr>`;
      }
      return rows;
    }

    function buildBlankRowsOverlay(n, numEntriesBefore) {
      if (n === 0) return '';
      const rowHeight = 44; // each row is 44px
      const blankRowsHeight = n * rowHeight;
      const headerHeight = 84; // Adjusted from 80 to shift more downward
      const startY = headerHeight + (numEntriesBefore * rowHeight); // Y position where blanks start
      // RS column: 92% to 97% -> Shifted left to 90.5% to 95.5%
      // P column: 97% to 100% -> Shifted left to 95.5% to 98.5%
      // Diagonal lines shifted 8px downward from top
      return `<svg style="position:absolute;top:${startY}px;left:0;width:100%;height:${blankRowsHeight}px;pointer-events:none;overflow:visible;">
    <line x1="95.5%" y1="8" x2="90.5%" y2="${blankRowsHeight}px" stroke="#000" stroke-width="1"/>
    <line x1="98.5%" y1="8" x2="95.5%" y2="${blankRowsHeight}px" stroke="#000" stroke-width="1"/>
  </svg>`;
    }

    function buildPage1TotalTableRow(page1TotalRs, page1TotalPaise) {
      return `<tr style="height:36px;">
    <td style="border:1px solid #000;font-size:11pt;overflow:hidden;" colspan="9"></td>
    <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:right;vertical-align:middle;overflow:hidden;"><b>TOTAL</b></td>
    <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">${page1TotalRs}</td>
    <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">${String(page1TotalPaise).padStart(2, '0')}</td>
  </tr>`;
    }

    function buildGrandTotalTableRow(grandTotalRs, grandTotalPaise) {
      const hasPaise = grandTotalPaise > 0;
      const addPaise = hasPaise ? (100 - grandTotalPaise) : 0;
      const roundedTotal = hasPaise ? (grandTotalRs + 1) : grandTotalRs;

      if (!hasPaise) {
        return `<tr style="height:36px;">
      <td style="border:1px solid #000;font-size:11pt;overflow:hidden;" colspan="9"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">TOTAL</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">₹${grandTotalRs}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">00</td>
    </tr>`;
      } else {
        return `<tr style="height:36px;">
      <td style="border:1px solid #000;font-size:11pt;overflow:hidden;" colspan="9"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">TOTAL</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">${grandTotalRs}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">.${String(grandTotalPaise).padStart(2, '0')}</td>
    </tr>
    <tr style="height:36px;">
      <td style="border:1px solid #000;font-size:11pt;overflow:hidden;" colspan="9"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">+ .${String(addPaise).padStart(2, '0')}</td>
    </tr>
    <tr style="height:36px;">
      <td style="border:1px solid #000;font-size:11pt;overflow:hidden;" colspan="9"></td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">TOTAL</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">₹${roundedTotal}</td>
      <td style="border:1px solid #000;padding:1px 2px;font-size:12pt;font-weight:bold;font-family:'Times New Roman',serif;text-align:center;vertical-align:middle;overflow:hidden;">00</td>
    </tr>`;
      }
    }

    function adjustObjectOfJourneyFontSize() {
      const containers = document.querySelectorAll('.ta-obj-container');
      containers.forEach((container) => {
        const text = container.textContent.trim();
        if (!text) return;

        // Create a temporary span to measure the text width
        const span = document.createElement('span');
        span.style.fontFamily = "'Times New Roman', serif";
        span.style.fontWeight = 'bold';
        span.style.whiteSpace = 'nowrap';
        span.style.position = 'absolute';
        span.style.visibility = 'hidden';
        document.body.appendChild(span);
        span.textContent = text;

        // Reverted fallback width back to 260px to match 26% column width
        const containerWidth = container.clientWidth || 260;

        // Scale font sizes to make 2-line entries significantly larger
        let bestSize = 9.8;
        let fitsOneLine = false;

        // 1-line check (scale from 14.0pt down to 11.5pt)
        for (let size = 14.0; size >= 11.5; size -= 0.2) {
          span.style.fontSize = `${size}pt`;
          if (span.offsetWidth <= containerWidth - 4) {
            bestSize = size;
            fitsOneLine = true;
            break;
          }
        }

        // 2-line check (scale from 11.5pt down to 9.8pt to keep it larger)
        if (!fitsOneLine) {
          for (let size = 11.5; size >= 9.8; size -= 0.2) {
            span.style.fontSize = `${size}pt`;
            if (span.offsetWidth <= (containerWidth - 6) * 2.02) {
              bestSize = size;
              break;
            }
            bestSize = size; // default to smallest if very long
          }
        }

        document.body.removeChild(span);

        // Apply style inline with important to override CSS
        container.style.setProperty('font-size', `${bestSize}pt`, 'important');
        container.style.setProperty('line-height', '1.15', 'important');
      });
    }

    function buildSummaryOverlay(summaryGroupArr, grandTotalRs, grandTotalPaise, grandTotalWords) {
      const hasPaise = grandTotalPaise > 0;
      const addPaise = hasPaise ? (100 - grandTotalPaise) : 0;
      const roundedTotal = hasPaise ? (grandTotalRs + 1) : grandTotalRs;

      const ff = "font-family:Arial,sans-serif;font-size:11pt;line-height:1.2;";

      let summaryLines = '';
      summaryGroupArr.forEach((g, idx) => {
        const gTotal = g.total;
        const gRs = Math.floor(gTotal);
        const gPaise = Math.round((gTotal - gRs) * 100);
        const gDisplay = `${gRs}.${String(gPaise).padStart(2, '0')}`;
        const perEntry = parseFloat(g.rate) * parseFloat(g.pct) / 100;
        const perEntryDisplay = perEntry.toFixed(2);
        if (idx === 0) {
          summaryLines += `<div style="${ff}padding-left:20px;font-weight:600;font-family:'Times New Roman',serif;margin:0;padding-top:1px;padding-bottom:1px;"><u><b>SUMMARY:</b></u></div>`;
        }

        // Check if pct contains multiple percentages (e.g., "30+70")
        const hasMultiplePcts = String(g.pct).includes('+');
        if (hasMultiplePcts) {
          // Format percentages horizontally: 30% | 70% = 100% × count = rate × count = ₹value (single line, no height increase)
          const pctParts = String(g.pct).split('+').map(p => p.trim()).join('% <b>|</b> ');
          summaryLines += `<div style="${ff}padding-left:40px;font-weight:bold;font-family:'Times New Roman',serif;margin:0;padding-top:1px;padding-bottom:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pctParts}% <b>=</b> 100% <b>×</b> ${g.count} <b>=</b> ${g.rate} <b>×</b> ${g.count} <b>=</b> ₹${gDisplay}</div>`;
        } else {
          summaryLines += `<div style="${ff}padding-left:40px;font-weight:bold;font-family:'Times New Roman',serif;margin:0;padding-top:1px;padding-bottom:1px;">${g.pct}% <b>×</b> ${g.count} <b>=</b> ${perEntryDisplay} <b>×</b> ${g.count} <b>=</b> ₹${gDisplay}</div>`;
        }
      });

      const uline = `<div style="border-top:1px solid #000;margin:1px 0;"></div>`;

      const firstTotalVal = `${grandTotalRs}.${String(grandTotalPaise).padStart(2, '0')}`;
      const finalTotalVal = `${roundedTotal}.00`;

      let totalBlock = '';
      if (!hasPaise) {
        totalBlock = `${uline}
      <div style="${ff}padding-left:40px;font-weight:600;font-family:'Times New Roman',serif;margin:0;padding-top:1px;"><b>TOTAL</b> = ₹${finalTotalVal} <span style="font-size:9pt;font-style:italic;font-weight:bold;margin-left:3px;">(<b><em>${grandTotalWords}</em></b>)</span></div>`;
      } else {
        // Calculate padding based on the TOTAL value to align the decimal
        const integerPart = firstTotalVal.split('.')[0]; // e.g., "662" from "662.50"
        const paddingNeeded = "TOTAL = ₹".length + integerPart.length; // Position of the decimal
        const paddingSpaces = " ".repeat(paddingNeeded - 1); // -1 for the "+" character

        totalBlock = `${uline}
      <div style="${ff} padding-left:40px; font-family:'Times New Roman',serif; font-weight:600; margin:0; line-height:1.2;">
        TOTAL = ₹${firstTotalVal}
      </div>
      <div style="${ff} padding-left:40px; font-family:'Times New Roman',serif; font-weight:600; margin:0; line-height:1.2;">
        ${paddingSpaces}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+.${String(addPaise).padStart(2, '0')}
      </div>
    ${uline}
      <div style="${ff} padding-left:40px; font-weight:600; font-family:'Times New Roman',serif; margin:0; padding-top:1px;">
        <b>TOTAL</b> = ₹${finalTotalVal} 
        <span style="font-size:9pt; font-style:italic; font-weight:bold; margin-left:3px;">
          (<b><em>${grandTotalWords}</em></b>)
        </span>
      </div>`;
      }

      return `<div style="position:absolute;left:8.33%;bottom:0;width:58%;pointer-events:none;z-index:10;background:#fff;border:1.5px solid #000;padding:3px 5px;font-family:Arial,sans-serif;color:#000;">
    ${summaryLines}
    ${totalBlock}
  </div>`;
    }

    function generateTaPreview() {
      try {
        console.log('🔍 generateTaPreview() started');
        const keys = Object.keys(taPageEntries).sort();
        console.log('✅ taPageEntries keys:', keys.length);
        if (keys.length === 0) { customAlert("Please add at least one journey entry using 'Add to Page'."); return; }
        const entries = keys.map(k => taPageEntries[k]);
        console.log('✅ entries mapped:', entries.length);
        const header = getTaHeaderData();
        console.log('✅ header data retrieved');
        const summaryGroups = buildSummary(entries);
        console.log('✅ summary groups built');
        let grandTotal = 0;
        Object.values(summaryGroups).forEach(g => { grandTotal += g.total; });
        const grandTotalRs = Math.floor(grandTotal);
        const grandTotalPaise = Math.round((grandTotal - grandTotalRs) * 100);
        const hasPaise = grandTotalPaise > 0;
        const roundedTotal = hasPaise ? (grandTotalRs + 1) : grandTotalRs;
        const grandTotalWords = numberToWords(roundedTotal);
        console.log('✅ totals calculated');

        const ROWS_PAGE1 = 15;
        const page1Entries = entries.slice(0, ROWS_PAGE1);
        const page1Blanks = Math.max(0, ROWS_PAGE1 - page1Entries.length);
        const page2Entries = entries.slice(ROWS_PAGE1);

        const summaryGroupArr = Object.values(summaryGroups);
        const summaryRowCount = summaryGroupArr.length;
        const totalRowCount = hasPaise ? 3 : 1;
        const ROWS_PAGE2 = 14;
        const page2Blanks = Math.max(0, (ROWS_PAGE2 - totalRowCount) - page2Entries.length);

        const page2HeaderText = header.crEntries
          ? header.crEntries.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
          : '';

        const textLength = page2HeaderText ? page2HeaderText.length : 0;
        let dynamicFontSize = '10.5pt';
        if (textLength > 180) {
          dynamicFontSize = '5.5pt';
        } else if (textLength > 140) {
          dynamicFontSize = '6.5pt';
        } else if (textLength > 100) {
          dynamicFontSize = '8pt';
        } else if (textLength > 70) {
          dynamicFontSize = '9.2pt';
        }

        const metaFF = "font-family:'Noto Sans Devanagari',Arial,sans-serif;";
        const crLeft = '&nbsp;';

        const topBarHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline;width:100%;margin-bottom:1px;${metaFF}font-size:11pt;line-height:1.8;word-spacing:normal !important;">
    <span style="font-weight:bold;min-height:12px;max-width:82%;overflow:hidden;text-overflow:clip;white-space:nowrap;font-size:${dynamicFontSize};line-height:1.2;word-spacing:normal !important;">${page2HeaderText || '&nbsp;'}</span>
    <span style="font-weight:bold;min-height:12px;text-align:center;flex:1;padding:0 8px;">${crLeft}</span>
    <span style="font-weight:bold;min-height:12px;">${header.pfNumber ? 'PF No. ' + header.pfNumber : '&nbsp;'}</span>
  </div>`;

        const titleHTML = `<div style="text-align:center;font-size:12pt;font-weight:bold;margin:1px 0 5px 0;width:100%;${metaFF}letter-spacing:0.04em;">यात्रा भत्ता विवरण / TRAVELLING ALLOWANCE JOURNAL</div>`;

        const mFF = "font-family:'Noto Sans Devanagari',Arial,sans-serif;";
        const rowStyle = `display:flex;align-items:flex-end;width:calc(100% - 0.8cm);margin-left:0.8cm;margin-right:0;${mFF}font-size:11.5pt;line-height:1;flex-wrap:nowrap;font-weight:bold;word-spacing:8px;letter-spacing:0.25px;`;
        const lblStyle = `white-space:nowrap;flex-shrink:0;font-weight:bold;`;
        const val = (text, minW, grow) => {
          const g = grow ? 'flex:1 1 auto;' : `flex:0 0 ${minW};`;
          const border = 'border-bottom:2px dotted #000;';
          return `<span style="${g}min-width:${minW};${border}padding:0 2px 1px 2px;font-weight:bold;text-align:center;display:inline-block;line-height:1.05;vertical-align:bottom;">${text || ''}</span>`;
        };
        const sp = `<span style="flex-shrink:0;width:2px;"></span>`;

        const pdfName = header.name;
        const pdfPay = header.pay;
        const pdfScale = header.level;
        const pdfApptDate = header.apptDate;

        const metaRow1 = `<div style="${rowStyle}margin-bottom:4px;">
    <span style="display:inline-flex;flex-direction:column;align-items:center;flex:0 0 auto;min-width:130px;max-width:190px;">
      <span style="font-size:10pt;font-weight:800;letter-spacing:0.06em;line-height:1;white-space:nowrap;align-self:center;">ENGINEERING</span>
      <span style="width:100%;border-bottom:2px dotted #000;display:block;min-height:3px;margin-top:2px;"></span>
    </span>
    ${sp}<span style="${lblStyle}">शाखा/Branch</span>${val(header.branch || 'DANAPUR', '140px', false)}${sp}
    <span style="${lblStyle}">डिविजन का सदर मुकाम/Divisional Headquarter at.</span>${val(header.hqStation, '90px', false)}${sp}
    <span style="${lblStyle}">काम का विवरण जिसके लिए श्री/Journal of duties performed</span>
  </div>`;

        const metaRow2 = `<div style="${rowStyle}margin-bottom:4px;">
    <span style="${lblStyle}">by Sri.</span>${val(pdfName, '195px', false)}${sp}
    <span style="${lblStyle}">for which allowance for</span>${val(header.allowanceFor || '', '125px', false)}${sp}
    <span style="${lblStyle}">में भत्ता मांगे हैं/is claimed</span>${val('T.A', '90px', false)}${sp}
    <span style="${lblStyle}">पद/Designation</span>${val(header.post, '1px', true)}
  </div>`;

        const metaRow3 = `<div style="${rowStyle}margin-bottom:5mm;">
    <span style="${lblStyle}">वेतन/Pay</span>${val(pdfPay, '80px', false)}${sp}
    <span style="${lblStyle}">वेतनमान/Scale of Pay</span>${val(pdfScale, '130px', false)}${sp}
    <span style="${lblStyle}">नियुक्ति की तारीख/Date of appointment</span>${val(pdfApptDate, '125px', false)}${sp}
    <span style="${lblStyle}">किस नियम में शासित/Rule by which governed</span>${val('SR', '75px', false)}
  </div>`;


        const kmOverlayHTML = `<div style="position:absolute;top:0;left:48.3%;width:3%;height:100%;pointer-events:none;z-index:5;display:flex;align-items:center;justify-content:center;overflow:hidden;">
    <div style="font-size:10pt;font-weight:bold;font-family:Arial,sans-serif;color:#000;white-space:nowrap;transform:rotate(-90deg);transform-origin:center center;letter-spacing:2px;">&#9668;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135; OVER 8 K.M &#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9135;&#9658;</div>
  </div>`;

        let page1Total = 0;
        page1Entries.forEach(e => {
          const itemTotal = parseFloat(e.rs) + parseFloat(e.paise) / 100;
          page1Total += itemTotal;
        });
        const page1TotalRs = Math.floor(page1Total);
        const page1TotalPaise = Math.round((page1Total - page1TotalRs) * 100);
        const page1TotalDisplay = `${page1TotalRs}.${String(page1TotalPaise).padStart(2, '0')}`;

        const summaryOverlayHTML = buildSummaryOverlay(summaryGroupArr, grandTotalRs, grandTotalPaise, grandTotalWords);
        const grandTotalTableRow = buildGrandTotalTableRow(grandTotalRs, grandTotalPaise);
        const page1BlankOverlay = buildBlankRowsOverlay(page1Blanks, page1Entries.length);

        const page1TableHTML = `<div style="position:relative;width:100%;">${kmOverlayHTML}${page1BlankOverlay}<table class="ta-j-table" style="margin-top:0;width:100%;">${buildTaTableHeader()}<tbody>${buildTaDataRows(page1Entries)}${buildBlankRows(page1Blanks)}${buildPage1TotalTableRow(page1TotalRs, page1TotalPaise)}</tbody></table></div>`;

        const ptoHTML = `<div style="display:flex;justify-content:flex-end;font-family:'Courier New',monospace;font-size:12pt;font-weight:bold;margin-top:0;margin-bottom:0;padding:0;width:100%;">
    <span style="letter-spacing:0.08em;">P.T.O.</span>
  </div>`;

        const page2SpacerHTML = `<div style="height:8mm;width:100%;"></div>`;
        const page2BlankOverlay = buildBlankRowsOverlay(page2Blanks, page2Entries.length);

        const page2TableHTML = `<div style="position:relative;width:100%;">${kmOverlayHTML}${page2BlankOverlay}${summaryOverlayHTML}<table class="ta-j-table" style="margin-top:0;width:100%;">${buildTaTableHeaderPage2(page1TotalDisplay, page1TotalRs, page1TotalPaise)}<tbody>${buildTaDataRows(page2Entries)}${buildBlankRows(page2Blanks)}${grandTotalTableRow}</tbody></table></div>`;

        const certFF = "font-family:'Noto Sans Devanagari',Arial,sans-serif;";

        const dline = (txt, w) =>
          `<span style="display:inline-block;min-width:${w};border-bottom:1.5px dotted #000;font-weight:bold;padding:0 2px 1px 2px;line-height:1.05;vertical-align:bottom;text-align:center;">${txt}</span>`;

        const certHTML = `<div class="ta-certificate" style="width:100%;margin-top:3mm;${certFF}font-size:10.5pt;font-weight:bold;line-height:1.3;word-spacing:6px;text-align:justify;">
    <div style="word-spacing:6px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;मैं प्रमाणित करता हूँ कि श्री ${dline(pdfName, '200px')} बिल में दिये गये समय के लिए रेलवे के काम के सदर मुकाम स्टेशन से बाहर गये थे उन्हीं ने रेल / सड़क / जहाज / हवाई जहाज</div>
    <div style="word-spacing:6px;">से जो यात्रा की है उसके लिए उन्हें सरकारी स्थानीय निधि से मुक्त टिकट या मुफ्त सवारी दी गयी/नहीं दी गई I hereby certify that the above mentioned ${dline('', '120px')} was absent</div>
    <div class="ta-certificate-no-word-spacing ta-certificate-duty-line" style="word-spacing:3px !important;text-align:left !important;text-align-last:left !important;letter-spacing:normal !important;">on duty from his headquarters' station during the period mentioned in the bill on railway business and that the officer performed the journey by Rail / Air / Sea / Road and was</div>
    <div class="ta-certificate-no-word-spacing" style="word-spacing:6px;"> allowed / not allowed free pass or free locomotion at the expenses of Government / local fund of Indian State.</div>
    <div style="height:3pt;"></div>
    <div style="word-spacing:6px;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ड्यूटी पास पर की गयी यात्राओं तथा ठहरावों के लिए, जिनके इस बिल में यात्रा भत्ते / दैनिक भत्ते के दावे पेश किये गये हैं, किसी अन्य माध्यम से यात्रा भत्ता/दैनिक भत्ता तथा अन्य पारिश्रमिक </div>
    <div class="ta-certificate-no-word-spacing ta-certificate-wide-word-spacing" style="word-spacing:6px;">नहीं लिया गया है / No T.A./D.A. or any other remuneration has been drawn from any other source in respect of the journeys performed on Duty Pass and also for the halts</div>
    <div class="ta-certificate-no-word-spacing" style="word-spacing:normal;">for which T.A./D.A. has been claimed in this bill.</div>
    <div style="height:3pt;"></div>
    <div style="word-spacing:8px;letter-spacing:0.25px;">प्रति हस्ताक्षरित / Countersigned नियंत्रक अफसर/Controlling Officer कार्यालय के प्रधान/Head of Office यात्रा भत्ता लेनेवाले अफसर के हस्ताक्षर / Signature of Officer claiming T.A</div>
    <div class="ta-certificate-notes" style="margin-top:5pt;">
      <div class="ta-certificate-no-word-spacing ta-certificate-wide-word-spacing ta-certificate-note-one">नोट :– 1. &nbsp;एक रेलवे से दूसरी रेलवे में बदली होने पर जो यात्रा भत्ता मांगा जाय उसे बिल में यह स्पष्ट लिख देना चाहिए कि सरकार की ओर से यात्रा के लिए मुक्त टिकट या मुफ्त सवारी दी गई है या नहीं दी गई है।</div>
      <div class="ta-certificate-no-word-spacing ta-certificate-note-one ta-certificate-note-one-english" style="word-spacing:1px !important;text-align:left !important;text-align-last:left !important;letter-spacing:normal !important;">Note :– 1. &nbsp;On T.A. Bills for transfer from one railway to another, a certificate whether or not a free pass or free locomotion at government expense was allowed should be recorded on the bill.</div>
      <div class="ta-certificate-no-word-spacing ta-certificate-wide-word-spacing">नोट :– 2. &nbsp;यात्रा भत्ता लेनेवाले अफसर यदि हिन्दी या प्रादेशिक भाषा में फार्म भर कर दें तो सम्बन्धित कार्यालय उसका अंग्रेजी में भाषान्तरण कर लें।</div>
      <div class="ta-certificate-no-word-spacing" style="word-spacing:normal !important;text-align:left !important;text-align-last:left !important;letter-spacing:normal !important;">Note :– 2. &nbsp;Entries made by the claimant in Hindi/Regional language should be transliterated in English by the office concerned.</div>
    </div>
  </div>`;

        const sigSpacerHTML = ``;
        const sigHTML = ``;
        const notesHTML = ``;

        const fullHTML = `<div style="font-family:'Noto Sans Devanagari',Arial,sans-serif;font-size:8pt;color:#000;background:white;width:100%;">
    <div class="ta-page-1" style="page-break-after:always;break-after:page;width:100%;padding-bottom:0;">
      ${topBarHTML}${titleHTML}${metaRow1}${metaRow2}${metaRow3}${page1TableHTML}${ptoHTML}
    </div>
    <div class="ta-page-2" style="width:100%;padding-bottom:0;">
      ${page2SpacerHTML}${page2TableHTML}${certHTML}${sigSpacerHTML}${sigHTML}${notesHTML}
    </div>
  </div>`;

        console.log('✅ fullHTML constructed, length:', fullHTML.length);
        const contentDiv = document.getElementById('ta-pdf-content');
        if (!contentDiv) {
          console.error('❌ ERROR: ta-pdf-content div not found!');
          customAlert('Error: Preview container not found. Please reload the page.');
          return;
        }
        console.log('✅ contentDiv found');
        contentDiv.innerHTML = fullHTML;
        console.log('✅ innerHTML set');
        contentDiv.style.display = 'block';
        document.getElementById('ta-report-content').style.display = 'none';
        currentTaViewMode = 'journal';
        console.log('✅ display styles set');

        // Adjust Object of Journey font size synchronously to avoid race condition with window.print()
        adjustObjectOfJourneyFontSize();

        console.log('✅ About to show section: ta-preview-section');
        showSection('ta-preview-section');
        console.log('✅ generateTaPreview() completed successfully');
      } catch (error) {
        console.error('❌ ERROR in generateTaPreview:', error);
        console.error('Stack:', error.stack);
        customAlert('Error generating preview: ' + error.message);
      }
    }



    async function saveTaJournalToDB() {
      const keys = Object.keys(taPageEntries).sort();
      if (keys.length === 0) {
        customAlert("Please add at least one journey entry.");
        return;
      }

      const currentUser = window.currentUserAuth;
      if (!currentUser || !currentUser.id) {
        customAlert("Please login first to save TA Journal.");
        return;
      }

      try {
        const entries = keys.map(k => taPageEntries[k]);
        const header = getTaHeaderData();
        const summaryGroups = buildSummary(entries);
        let grandTotal = 0;
        Object.values(summaryGroups).forEach(g => { grandTotal += g.total; });

        // CRITICAL: Extract month and year from FIRST entry date
        const firstDateStr = keys[0]; // e.g., "2026-03-15"
        const dateObj = new Date(firstDateStr);
        const month = dateObj.getMonth() + 1;  // 0-11 → 1-12
        const year = dateObj.getFullYear();

        console.log('\n=== TA SAVE DEBUG ===');
        console.log('🔍 Entry Keys:', keys);
        console.log('🔍 First Date String:', firstDateStr);
        console.log('🔍 Extracted month:', month, 'year:', year);
        console.log('🔍 Number of entries:', entries.length);
        console.log('🔍 First entry structure:', entries[0]);
        console.log('🔍 Grand Total:', grandTotal);

        const docData = {
          user_id: currentUser.id,
          user_email: currentUser.email,
          entries: entries,
          header,
          restDates: parseTaDateArray(document.getElementById('ta-rest-dates-json').value),
          leaveDates: parseTaDateArray(document.getElementById('ta-leave-dates-json').value),
          crDetails: parseTaDateArray(document.getElementById('ta-cr-details-json').value),
          month: month,
          year: year,
          total_amount: parseFloat(grandTotal.toFixed(2)),
          notes: document.getElementById('ta-notes')?.value || '',
          submitted_by: currentUser.id,
          approval_status: 'pending',
          savedat: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('💾 SAVING TO DB - Document structure:');
        console.log('  user_id:', docData.user_id);
        console.log('  user_email:', docData.user_email);
        console.log('  month:', docData.month);
        console.log('  year:', docData.year);
        console.log('  entries count:', docData.entries.length);
        console.log('  entries[0]:', docData.entries[0]);
        console.log('  total_amount:', docData.total_amount);
        console.log('  approval_status:', docData.approval_status);

        // Save to ta_journal using upsert (insert or update if exists)
        const { data, error } = await db.from('ta_journal').upsert([docData], {
          onConflict: 'user_id,month,year'
        }).select();
        if (error) {
          console.error('❌ DATABASE ERROR:', error);
          throw error;
        }

        console.log('✅ SAVED SUCCESSFULLY - Returned data:', data);
        console.log('=== TA SAVE DEBUG - END ===\n');

        showToast("✅ TA Journal saved! (" + entries.length + " entries, Rs. " + grandTotal.toFixed(2) + ")");

        // Also save to print_history
        await db.from("print_history").insert([{
          user_id: currentUser.id,
          document_type: 'TA Journal',
          month: month,
          year: year,
          total_amount: parseFloat(grandTotal.toFixed(2)),
          printed_at: new Date().toISOString()
        }]);

        // Keep entries in UI after successful save as requested by user
        // taPageEntries is NOT cleared, and the count and list remain visible.

      } catch (error) {
        console.error("❌ Error saving TA Journal:", error);
        customAlert("Error: " + (error?.message || "Unknown error"));
      }
    }

    function updateTaName() {
      syncTaLockedName();
    }

    function updateTaPay() { }

    // ===== TA MONTH FILTER FUNCTIONS - CASCADING DROPDOWNS =====
    // monthMap defined in js/core/config.js

    function showMonthDropdown() {
      const yearSelector = document.getElementById('ta-filter-year-selector').value;
      const monthContainer = document.getElementById('ta-month-dropdown-container');

      if (yearSelector) {
        // Show month dropdown when year is selected
        monthContainer.classList.remove('hidden');
        // Reset month dropdown
        document.getElementById('ta-filter-month-selector').value = '';
        clearTaEntriesList();
      } else {
        // Hide month dropdown if no year selected
        monthContainer.classList.add('hidden');
        clearTaEntriesList();
      }
    }

    async function loadTaEntriesByMonth() {
      const monthSelector = document.getElementById('ta-filter-month-selector').value;
      const yearSelector = document.getElementById('ta-filter-year-selector').value;

      if (!yearSelector || !monthSelector) {
        clearTaEntriesList();
        return;
      }

      const monthNum = monthMap[monthSelector];
      const year = parseInt(yearSelector);
      const currentUser = window.currentUserAuth;

      console.log('=== TA LOAD DEBUG - START ===');
      console.log('User ID:', currentUser?.id);
      console.log('User Email:', currentUser?.email);
      console.log('Selected Month:', monthSelector, '→ Number:', monthNum);
      console.log('Selected Year:', year);

      if (!currentUser) {
        customAlert("Please login first to view TA entries.");
        return;
      }

      try {
        // Query database with detailed logging
        console.log('\n🔍 QUERYING DATABASE (Standard):');
        console.log('  Table: ta_journal');
        console.log('  Filter: user_id = ' + currentUser.id);
        console.log('  Filter: month = ' + monthNum);
        console.log('  Filter: year = ' + year);

        let { data: records, error } = await window.db
          .from('ta_journal')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('month', monthNum)
          .eq('year', year)
          .order('savedat', { ascending: false });

        if (error) {
          console.error('❌ DATABASE ERROR:', error);
          throw error;
        }

        console.log('\n✅ QUERY RESULT (Standard):');
        console.log('  Records Found:', records ? records.length : 0);

        // If no records found with proper month/year, try recovery query for NULL values
        if (!records || records.length === 0) {
          console.log('\n🔄 NO RECORDS - Attempting RECOVERY QUERY for NULL month/year entries...');

          const { data: allUserRecords, error: recoveryError } = await window.db
            .from('ta_journal')
            .select('*')
            .eq('user_id', currentUser.id)
            .or('month.is.null,year.is.null')
            .order('savedat', { ascending: false });

          if (recoveryError) {
            console.error('❌ Recovery query error:', recoveryError);
          } else {
            console.log('  Recovery records found:', allUserRecords?.length || 0);
            console.log('  Records:', allUserRecords);

            // Try to extract month/year from entries themselves
            if (allUserRecords && allUserRecords.length > 0) {
              console.log('\n🔧 RECOVERY MODE - Extracting dates from entries...');

              for (let record of allUserRecords) {
                if (record.entries && Array.isArray(record.entries) && record.entries.length > 0) {
                  // Extract date from first entry
                  const firstEntry = record.entries[0];
                  const dateKey = firstEntry.dateKey || firstEntry.dateRaw || '';

                  if (dateKey) {
                    const [entryYear, entryMonth, entryDay] = dateKey.split('-');
                    const entryMonthNum = parseInt(entryMonth);
                    const entryYearNum = parseInt(entryYear);

                    console.log('  Entry month from data:', entryMonthNum, '| Requested month:', monthNum);
                    console.log('  Entry year from data:', entryYearNum, '| Requested year:', year);

                    // Check if this record matches the requested month/year
                    if (entryMonthNum === monthNum && entryYearNum === year) {
                      console.log('  ✅ MATCH FOUND! This NULL record contains the requested month/year');
                      records = [record];
                      break;
                    }
                  }
                }
              }

              if (!records || records.length === 0) {
                console.log('  ⚠️ No matching entries found for ' + monthSelector + ' ' + year);
              }
            }
          }
        }

        // Extract entries from first record
        const filteredEntries = [];
        if (records && records.length > 0) {
          const record = records[0];
          console.log('\n📖 SELECTED RECORD:');
          console.log('  ID:', record.id);
          console.log('  Month:', record.month, '(DB) / Extracted from entries');
          console.log('  Year:', record.year, '(DB) / Extracted from entries');
          console.log('  Total Amount:', record.total_amount);
          console.log('  Entries Array Length:', record.entries?.length || 0);

          if (record.entries && Array.isArray(record.entries)) {
            filteredEntries.push(...record.entries);
            console.log('  ✓ Extracted', record.entries.length, 'entries from record');
          } else {
            console.warn('  ⚠️ Entries is not an array!');
          }
        }

        console.log('\n📊 DISPLAYING ENTRIES:');
        console.log('  Total entries to display:', filteredEntries.length);
        displayTaEntriesFromDb(filteredEntries, monthNum, year);
        console.log('=== TA LOAD DEBUG - END ===\n');

      } catch (error) {
        console.error('❌ Error loading TA entries:', error);
        customAlert('Error loading entries: ' + error.message);
        clearTaEntriesList();
      }
    }

    function displayTaEntriesFromDb(entries, monthNum, year) {
      const monthFullNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthLabel = monthFullNames[monthNum];

      const countEl = document.getElementById('ta-days-count');
      countEl.textContent = entries.length;

      const list = document.getElementById('ta-saved-days-list');
      list.innerHTML = '';

      if (entries.length === 0) {
        list.innerHTML = `<p class="text-slate-400 text-sm text-center py-6 italic"><svg class="ui-icon"><use href="#icon-inbox"></use></svg> No entries found for ${monthLabel} ${year}</p>`;
        return;
      }

      console.log('=== DISPLAY TA ENTRIES ===');
      console.log('Entries received:', entries.length);
      console.log('First entry:', entries[0]);

      // Entries are already extracted by loadTaEntriesByMonth, so use them directly
      let allEntries = Array.isArray(entries) ? entries : [];

      // Sort by dateKey
      allEntries.sort((a, b) => {
        const dateA = a.dateKey || a.dateRaw || '';
        const dateB = b.dateKey || b.dateRaw || '';
        return new Date(dateA) - new Date(dateB);
      });

      console.log('Total entries to display:', allEntries.length);
      console.log('Entries:', allEntries);

      let totalAmount = 0;

      if (allEntries.length === 0) {
        list.innerHTML = `<p class="text-slate-400 text-sm text-center py-6 italic"><svg class="ui-icon"><use href="#icon-alert"></use></svg> No individual entries found</p>`;
      } else {
        // Render compact entries with Edit/Delete buttons
        list.innerHTML = allEntries.map((e, i) => {
          const dateKey = e.dateKey || e.dateRaw || '';
          const [year2, month2, day2] = dateKey.split('-');
          const dayNum = parseInt(day2);
          const monthNum2 = parseInt(month2);
          const yearNum = parseInt(year2);

          const amount = parseFloat(e.rs || 0) + (parseFloat(e.paise || 0) / 100);
          totalAmount += amount;

          return `
      <div style="background: #f8f9fa; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 8px; margin-bottom: 4px; overflow: hidden;">
        
        <!-- ROW 1: Entry # + Date + Mode on left, Edit/Delete buttons on right -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
            <span style="font-weight: 700; color: #0f172a; min-width: 20px;">${i + 1}.</span>
            <span style="color: #0f172a; font-weight: 600;">${dayNum}/${monthNum2.toString().padStart(2, '0')}/${yearNum}</span>
            <span style="color: #6b7280; text-transform: capitalize; font-size: 12px; font-weight: 500;">${e.mode === 'bytrain' ? 'By Train' : 'By Road'}</span>
          </div>
          
          <div style="display: flex; gap: 4px;">
            <button onclick="editDbTaEntry('${dateKey}')" style="background: #fbbf24; color: #78350f; border: none; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; white-space: nowrap;">
              <svg class="ui-icon"><use href="#icon-edit"></use></svg> Edit
            </button>
            <button onclick="deleteDbTaEntry('${dateKey}')" style="background: #ef4444; color: white; border: none; padding: 3px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; cursor: pointer; white-space: nowrap;">
              <svg class="ui-icon"><use href="#icon-trash"></use></svg>
            </button>
          </div>
        </div>
        
        <!-- ROW 2: Route | Amount | Rate & Percentage | Objective -->
        <div style="font-size: 11px; color: #1f2937; font-weight: 500; line-height: 1.1; margin-left: 20px;">
          ${e.fromStn} → ${e.toStn || '?'} | Rs. ${e.rs || '0'}.${e.paise || '0'} | ${e.pct}% of ${e.rate} | ${e.obj || '−'}
        </div>
      </div>
      `;
        }).join('');
      }

      // Show total
      const totalDiv = document.createElement('div');
      totalDiv.style.cssText = 'margin-top: 3px; padding: 3px 4px; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); border: 1px solid #22c55e; border-radius: 4px; text-align: center;';
      totalDiv.innerHTML = `
    <div style="font-size: 8px; color: #16a34a; font-weight: 600;">Total ${monthLabel}</div>
    <div style="font-size: 13px; font-weight: 700; color: #15803d; margin-top: 1px;">Rs. ${totalAmount.toFixed(2)}</div>
    <div style="font-size: 7px; color: #16a34a; margin-top: 1px;">${allEntries.length} entries</div>
  `;
      list.appendChild(totalDiv);

      console.log('✅ Displayed', allEntries.length, 'entries for', monthLabel, year, '- Total:', totalAmount.toFixed(2));
    }

    function clearTaEntriesList() {
      const list = document.getElementById('ta-saved-days-list');
      const countEl = document.getElementById('ta-days-count');
      countEl.textContent = '0';
      list.innerHTML = '<p class="text-slate-400 text-sm text-center py-6 italic">Select a Year and Month to view entries.</p>';
    }

    // Initialize form state only (don't hide mainWrapper here - auth flow handles visibility)
    const dutyTypeRadio = document.querySelector('input[name="dutyType"][value="night"]');
    if (dutyTypeRadio) dutyTypeRadio.checked = true;
    setDutyMode('night');

    setupForm();
    const legacyContainers = document.getElementById('legacy-containers');
    if (legacyContainers) legacyContainers.classList.remove('hidden');
    const newAttendanceWrapper = document.getElementById('new-attendance-wrapper');
    if (newAttendanceWrapper) newAttendanceWrapper.classList.add('hidden');
    const taJournalWrapper = document.getElementById('ta-journal-wrapper');
    if (taJournalWrapper) taJournalWrapper.classList.add('hidden');


window.currentTaViewMode = currentTaViewMode;
window.taJournalRecords = taJournalRecords;
window.taPageEntries = taPageEntries;
window.taEditingKey = taEditingKey;
window.loadAllTaRecords = loadAllTaRecords;
window.showAllTaRecords = showAllTaRecords;
window.switchToTaJournal = switchToTaJournal;
window.switchToTaReport = switchToTaReport;
window.shareTaPreview = shareTaPreview;
window.updateTaPreviewModeUI = updateTaPreviewModeUI;
window.initTaJournal = initTaJournal;
window.loadTaJournalFromDB = loadTaJournalFromDB;
window.autoSaveTaFormData = autoSaveTaFormData;
window.resetTaSingleForm = resetTaSingleForm;
window.toggleTrainNoSingle = toggleTrainNoSingle;
window.handleRateChange = handleRateChange;
window.updateCharCount = updateCharCount;
window.calcTaAmountSingle = calcTaAmountSingle;
window.addTaEntryToPage = addTaEntryToPage;
window.cancelTaEdit = cancelTaEdit;
window.formatTaDate = formatTaDate;
window.openTaDatePicker = openTaDatePicker;
window.closeTaDatePickers = closeTaDatePickers;
window.changeTaCalendarMonth = changeTaCalendarMonth;
window.selectTaCalendarDate = selectTaCalendarDate;
window.editTaEntry = editTaEntry;
window.addRestDate = addRestDate;
window.removeRestDate = removeRestDate;
window.renderRestDateTags = renderRestDateTags;
window.addLeaveDate = addLeaveDate;
window.removeleaveDate = removeleaveDate;
window.renderLeaveDateTags = renderLeaveDateTags;
window.addCrDetail = addCrDetail;
window.removeCrDetail = removeCrDetail;
window.renderCrDetailTags = renderCrDetailTags;
window.deleteTaEntry = deleteTaEntry;
window.clearAllTaEntries = clearAllTaEntries;
window.editDbTaEntry = editDbTaEntry;
window.deleteDbTaEntry = deleteDbTaEntry;
window.renderTaSavedDays = renderTaSavedDays;
window.viewTaEntryDetails = viewTaEntryDetails;
window.toggleTaPostCustom = toggleTaPostCustom;
window.getTaHeaderData = getTaHeaderData;
window.buildSummary = buildSummary;
window.numberToWords = numberToWords;
window.buildTaTableHeaderPage2 = buildTaTableHeaderPage2;
window.buildTaTableHeader = buildTaTableHeader;
window.makeSplitCell = makeSplitCell;
window.makeKmsCell = makeKmsCell;
window.makeStationCell = makeStationCell;
window.toSentenceCase = toSentenceCase;
window.toSentenceCaseWithAcronyms = toSentenceCaseWithAcronyms;
window.buildTaDataRows = buildTaDataRows;
window.buildBlankRows = buildBlankRows;
window.buildBlankRowsOverlay = buildBlankRowsOverlay;
window.buildPage1TotalTableRow = buildPage1TotalTableRow;
window.buildGrandTotalTableRow = buildGrandTotalTableRow;
window.adjustObjectOfJourneyFontSize = adjustObjectOfJourneyFontSize;
window.buildSummaryOverlay = buildSummaryOverlay;
window.generateTaPreview = generateTaPreview;
window.saveTaJournalToDB = saveTaJournalToDB;
window.updateTaName = updateTaName;
window.updateTaPay = updateTaPay;
window.showMonthDropdown = showMonthDropdown;
window.loadTaEntriesByMonth = loadTaEntriesByMonth;
window.displayTaEntriesFromDb = displayTaEntriesFromDb;
window.clearTaEntriesList = clearTaEntriesList;
