/* ==========================================================================
   RAILSAATHI - NIGHT PATROLLING DUTY MODULE
   js/sections/night-patrolling.js
   ========================================================================== */

    const nightBitData = [
      { no: "Bit No.-1", range: "km 9 to  km 1" },
      { no: "Bit No.-2", range: "km 9 to  km 17" },
      { no: "Bit No.-3", range: "km 25 to  km 17" },
      { no: "Bit No.-4", range: "km 25 to  km 33" },
      { no: "Bit No.-5", range: "km 41 to  km 33" },
      { no: "Bit No.-6", range: "km 41 to  km 44/25" }
    ];


    const defaultNightDutyNumbers = ["# 103011", "# 103249", "# 103237", "# 303121", "# 103098", "# 103116"];

    const nightDutyNumbers = [...defaultNightDutyNumbers];


    let currentDutyType = 'keyman';
    let dutyEmployeesLoaded = false;
    let dutyEmployeesLoading = null;
    let dutyPdfExportLibraries = null;

    const previewEl = document.getElementById('preview-section');
    const attPreviewEl = document.getElementById('attendance-preview-section');
    const taPreviewEl = document.getElementById('ta-preview-section');
    const mainWrapper = document.getElementById('main-wrapper');
    const navEl = document.getElementById('top-nav');
    const footerEl = document.getElementById('main-footer');
    const bgEl = document.getElementById('bg-image');

    // currentTaViewMode moved to ta-journal.js

    function getGpsNumbersForType(type) {
      return type === 'keyman' ? keymanDutyNumbers : nightDutyNumbers;
    }

    function getDefaultGpsNumbersForType(type) {
      return type === 'keyman' ? defaultKeymanDutyNumbers : defaultNightDutyNumbers;
    }

    async function loadDutyEmployeesFromDB() {
      if (dutyEmployeesLoaded) return;
      if (dutyEmployeesLoading) return dutyEmployeesLoading;

      dutyEmployeesLoading = (async () => {
        try {
          if (!window.db) return;

          const { data, error } = await window.db
            .from('sample_employees')
            .select('id, name, phone');
          if (error) throw error;

          const employees = (data || [])
            .filter((employee) => employee.name)
            .map((employee) => ({
              id: employee.id,
              name: employee.name,
              phone: employee.phone || ''
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          if (Array.isArray(window.employeeList) && employees.length) {
            window.employeeList.length = 0;
            window.employeeList.push(...employees);
            dutyEmployeesLoaded = true;
          }
        } catch (error) {
          console.error('Could not load employee names for duty forms:', error);
        } finally {
          dutyEmployeesLoading = null;
        }
      })();

      return dutyEmployeesLoading;
    }

    async function loadGpsNumbersFromDB() {
      try {
        if (!window.db) return;

        const { data, error } = await window.db
          .from('gps_duty_numbers')
          .select('duty_type, position, gps_number')
          .order('duty_type', { ascending: true })
          .order('position', { ascending: true });

        if (error) throw error;

        const nextNightNumbers = [...defaultNightDutyNumbers];
        const nextKeymanNumbers = [...defaultKeymanDutyNumbers];

        (data || []).forEach((row) => {
          const target = row.duty_type === 'keyman' ? nextKeymanNumbers : nextNightNumbers;
          const index = Number(row.position);

          if (!Number.isInteger(index) || index < 0 || index >= target.length) return;

          target[index] = row.gps_number || '';
        });

        nightDutyNumbers.length = 0;
        nightDutyNumbers.push(...nextNightNumbers);
        keymanDutyNumbers.length = 0;
        keymanDutyNumbers.push(...nextKeymanNumbers);

        console.log('GPS duty numbers loaded from database');
      } catch (error) {
        console.warn('Could not load GPS duty numbers from database:', error);
      }
    }

    function toggleGpsSaveButton(index) {
      const input = document.getElementById(`gps-number-${index}`);
      const button = document.getElementById(`gps-save-btn-${index}`);
      if (!input || !button) return;

      const savedValue = input.dataset.savedValue || '';
      const currentValue = input.value.trim();
      const isDirty = currentValue !== savedValue;

      button.classList.toggle('hidden', !isDirty);
    }

    function updateGpsVisibility(index) {
      const searchInput = document.getElementById(`emp-search-${index}`);
      const gpsInput = document.getElementById(`gps-number-${index}`);
      const gpsField = gpsInput ? gpsInput.closest('.duty-gps-field') : null;
      if (!searchInput || !gpsField) return;

      const selectedName = (searchInput.dataset.selectedName || '').trim();
      const currentName = searchInput.value.trim();
      const shouldShowGps = currentName !== '' && currentName === selectedName;

      gpsField.classList.toggle('gps-hidden', !shouldShowGps);
    }

    function handlePersonnelInputChange(index) {
      const searchInput = document.getElementById(`emp-search-${index}`);
      const phoneInput = document.getElementById(`emp-phone-${index}`);
      if (!searchInput) return;

      const selectedName = (searchInput.dataset.selectedName || '').trim();
      const currentName = searchInput.value.trim();

      if (currentName !== selectedName) {
        searchInput.dataset.selectedName = '';
        if (phoneInput) phoneInput.value = '';
      }

      updateGpsVisibility(index);
    }



    async function saveSingleGpsNumber(index) {
      const type = currentDutyType || 'night';
      const dutyNumbers = getGpsNumbersForType(type);
      const input = document.getElementById(`gps-number-${index}`);
      const button = document.getElementById(`gps-save-btn-${index}`);

      if (!input || !button) return;

      const gpsNumber = input.value.trim();
      const savedValue = input.dataset.savedValue || '';

      if (gpsNumber === savedValue) {
        toggleGpsSaveButton(index);
        return;
      }

      if (!window.db) {
        showToast('Database is not ready yet.');
        return;
      }

      if (!window.currentUserAuth) {
        showToast('Please log in before saving GPS numbers.');
        return;
      }

      button.disabled = true;
      button.textContent = 'Saving...';

      try {
        const { error } = await window.db
          .from('gps_duty_numbers')
          .upsert({
            duty_type: type,
            position: index,
            gps_number: gpsNumber,
            updated_by: window.currentUserAuth.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'duty_type,position' });

        if (error) throw error;

        dutyNumbers[index] = gpsNumber;
        input.value = gpsNumber;
        input.dataset.savedValue = gpsNumber;

        toggleGpsSaveButton(index);
        showToast('GPS number saved.');
        console.log('GPS duty number saved:', { type, index, gpsNumber });
      } catch (error) {
        console.error('Error saving GPS duty number:', error);
        showToast('Could not save GPS number.');
      } finally {
        button.disabled = false;
        button.textContent = 'Save';
        toggleGpsSaveButton(index);
      }
    }



    function setDutyMode(type) {
      currentDutyType = type === 'keyman' ? 'keyman' : 'night';

      const legacyContainer = document.getElementById('legacy-containers');
      if (legacyContainer) legacyContainer.dataset.dutyType = currentDutyType;

      setSectionHeading(currentDutyType === 'night' ? 'Night Patrolling' : 'Keyman Duty');

      const fromContainer = document.getElementById('from-container');
      const toContainer = document.getElementById('to-container');
      const fromLabel = fromContainer ? fromContainer.querySelector('label[for="fromDate"]') : null;
      const toLabel = toContainer ? toContainer.querySelector('label[for="toDate"]') : null;
      const toDateInput = document.getElementById('toDate');

      if (fromLabel) fromLabel.innerText = currentDutyType === 'night' ? 'From Date' : 'Date';
      if (toLabel) toLabel.innerText = 'To Date';
      if (toContainer) toContainer.style.display = currentDutyType === 'keyman' ? 'none' : 'block';
      if (toDateInput && currentDutyType === 'keyman') {
        toDateInput.value = '';
        syncDutyDatePlaceholder(toDateInput);
      }
    }

    function syncDutyDatePlaceholder(input) {
      const wrapper = input?.closest('.date-input-wrapper');
      if (wrapper) wrapper.classList.toggle('has-date', Boolean(input.value));
    }

    function setupForm() {
      const type = currentDutyType || 'night';
      setDutyMode(type);
      loadDutyEmployeesFromDB().then(() => {
        if (dutyEmployeesLoaded) setupForm();
      });

      const currentBitData = type === 'night' ? nightBitData : keymanBitData;
      const toContainer = document.getElementById('to-container');
      const fromContainer = document.getElementById('from-container');
      const container = document.getElementById('bit-assignment-list');
      if (!container) return;

      // Get duty numbers for this type
      const dutyNumbers = getGpsNumbersForType(type);

      container.innerHTML = currentBitData.map((bit, i) => `
    <div class="duty-bit-card flex flex-col md:flex-row gap-3 items-center p-3 bg-white/60 border rounded-2xl shadow-sm">
      <div class="duty-personnel-field flex-1 w-full relative">
        <label for="emp-search-${i}" class="duty-meta-label block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">${bit.no} [${bit.range}]</label>
        <input type="text" id="emp-search-${i}" data-selected-name="" placeholder="-- Search & Select Personnel --"
          class="duty-search-input w-full p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          oninput="handlePersonnelInputChange(${i})" onkeyup="filterDropdownEmployees(${i})" onfocus="filterDropdownEmployees(${i})" autocomplete="off">
        <ul id="emp-list-${i}" class="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 hidden max-h-48 overflow-y-auto"></ul>
      </div>
      <div class="duty-mobile-field w-full md:w-32">
        <label for="emp-phone-${i}" class="duty-meta-label block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">Mobile No.</label>
        <input type="tel" id="emp-phone-${i}" placeholder="Auto-filled" readonly class="duty-mobile-input w-full p-2 bg-blue-50 border rounded-xl text-center text-sm font-semibold text-blue-800">
      </div>
      <div class="duty-gps-field gps-hidden w-full md:w-36">
        <label for="gps-number-${i}" class="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1"><svg class="ui-icon"><use href="#icon-pin"></use></svg> GPS</label>
        <div class="flex flex-col gap-2">
          <input type="text" id="gps-number-${i}" value="${dutyNumbers[i] || ''}" data-saved-value="${dutyNumbers[i] || ''}" placeholder="GPS Duty No."
            class="duty-gps-input w-full p-2 border-2 border-blue-300 rounded-xl text-sm font-semibold focus:border-blue-500 outline-none" oninput="toggleGpsSaveButton(${i})">
          <button type="button" id="gps-save-btn-${i}" onclick="saveSingleGpsNumber(${i})"
            class="hidden self-end px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
            Save
          </button>
        </div>
      </div>
    </div>`).join('');

      currentBitData.forEach((_, idx) => updateGpsVisibility(idx));

      const loaderEl = document.getElementById('db-loader');
      if (loaderEl) loaderEl.style.display = 'none';
      const previewActions = document.getElementById('duty-preview-actions');
      if (previewActions) previewActions.style.display = 'grid';

      if (currentDutyType === 'keyman' && toContainer) {
        toContainer.style.display = 'none';
      } else if (toContainer) {
        toContainer.style.display = 'block';
      }
    }

    // 📍 Save all dirty GPS duty numbers
    async function saveGpsNumbers() {
      const dutyNumbers = getGpsNumbersForType(currentDutyType || 'night');

      for (let idx = 0; idx < dutyNumbers.length; idx++) {
        const input = document.getElementById(`gps-number-${idx}`);
        if (!input) continue;

        if (input.value.trim() !== (input.dataset.savedValue || '')) {
          await saveSingleGpsNumber(idx);
        }
      }
    }

    // ↻ Reset GPS duty numbers to default
    function resetGpsNumbers() {
      const type = currentDutyType || 'night';

      const defaults = [...getDefaultGpsNumbersForType(type)];
      const dutyNumbers = getGpsNumbersForType(type);
      dutyNumbers.length = 0;
      dutyNumbers.push(...defaults);

      // Update form fields
      defaults.forEach((num, idx) => {
        const input = document.getElementById(`gps-number-${idx}`);
        if (input) {
          input.value = num;
          toggleGpsSaveButton(idx);
        }
      });

      console.log('↻ GPS Duty Numbers Reset to Defaults:', defaults);
      showToast('↻ GPS numbers reset. Tap Save to store them.');
    }


    async function filterDropdownEmployees(i) {
      const input = document.getElementById(`emp-search-${i}`);
      const filterText = input.value.trim().toLowerCase();
      const ul = document.getElementById(`emp-list-${i}`);
      let searchTerms = [filterText];
      if (filterText.length > 0 && /^[a-zA-Z]+$/.test(filterText)) {
        try {
          const res = await fetch(`https://inputtools.google.com/request?text=${filterText}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`);
          const data = await res.json();
          if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) { searchTerms = searchTerms.concat(data[1][0][1]); }
        } catch (e) { console.error(e); }
      }
      ul.innerHTML = '';
      let count = 0;
      employeeList.forEach(emp => {
        const empName = emp.name.toLowerCase();
        const isMatch = searchTerms.some(term => empName.includes(term));
        if (isMatch || filterText === '') {
          const li = document.createElement('li');
          li.className = 'p-3 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-gray-100 last:border-0';
          li.innerText = emp.name;
          li.onmousedown = (e) => { e.preventDefault(); selectEmployeeRow(i, emp.name, emp.phone); };
          ul.appendChild(li);
          count++;
        }
      });
      if (count > 0) ul.classList.remove('hidden');
      else ul.classList.add('hidden');
    }

    function selectEmployeeRow(i, name, phone) {
      const searchInput = document.getElementById(`emp-search-${i}`);
      const phoneInput = document.getElementById(`emp-phone-${i}`);

      searchInput.value = name;
      searchInput.dataset.selectedName = name;
      phoneInput.value = phone || '';
      document.getElementById(`emp-list-${i}`).classList.add('hidden');
      updateGpsVisibility(i);

      const nextSearchInput = document.getElementById(`emp-search-${i + 1}`);
      if (nextSearchInput) nextSearchInput.focus();
    }

    document.querySelectorAll('#fromDate, #toDate').forEach((input) => {
      syncDutyDatePlaceholder(input);
      input.addEventListener('input', () => syncDutyDatePlaceholder(input));
      input.addEventListener('change', () => syncDutyDatePlaceholder(input));
    });

    document.addEventListener('click', (e) => {
      const wrapper = e.target.closest?.('.date-input-wrapper');
      if (wrapper) {
        const input = wrapper.querySelector('input[type="date"]');
        if (input) {
          input.focus();
          if (typeof input.showPicker === 'function') input.showPicker();
        }
      }
      if (!e.target.id.startsWith('emp-search-')) {
        document.querySelectorAll('[id^="emp-list-"]').forEach(ul => ul.classList.add('hidden'));
      }
    });

    window.shareRailsaathiContent = async function (title, elementId) {
      const content = document.getElementById(elementId)?.innerText?.trim();
      if (!content) {
        showToast('Generate the preview before sharing it.');
        return;
      }

      const pageUrl = window.location.href;
      const text = `${title}\n\n${content}`;
      if (typeof navigator.share === 'function') {
        try {
          await navigator.share({ title, text, url: pageUrl });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(`${text}\n\n${pageUrl}`);
        showToast('Preview copied. Paste it into any app to share.');
      } catch (error) {
        showToast('Sharing is unavailable in this browser.');
      }
    };

    window.shareDutyPreview = async function (generateFromForm = false) {
      if (generateFromForm) {
        generatePreview();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      return shareDutyPdf();
    };

    function loadDutyPdfScript(src, isLoaded) {
      if (isLoaded()) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => isLoaded() ? resolve() : reject(new Error('PDF export library did not initialize.'));
        script.onerror = () => reject(new Error('Could not load PDF export library.'));
        document.head.appendChild(script);
      });
    }

    function ensureDutyPdfExportLibraries() {
      if (!dutyPdfExportLibraries) {
        dutyPdfExportLibraries = Promise.all([
          loadDutyPdfScript('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js', () => typeof window.html2canvas === 'function'),
          loadDutyPdfScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js', () => Boolean(window.jspdf?.jsPDF))
        ]).catch(error => {
          dutyPdfExportLibraries = null;
          throw error;
        });
      }
      return dutyPdfExportLibraries;
    }

    function preloadDutyPdfExportLibraries() {
      const preload = () => { ensureDutyPdfExportLibraries().catch(error => console.warn('PDF sharing libraries are not ready yet:', error)); };
      if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(preload, { timeout: 2500 });
      else window.setTimeout(preload, 800);
    }

    preloadDutyPdfExportLibraries();

    async function createDutyPdfBlob() {
      await ensureDutyPdfExportLibraries();

      const page = document.getElementById('pdf-content');
      if (!page) throw new Error('Duty preview page was not found.');

      const oldStyle = page.getAttribute('style');
      try {
        page.style.setProperty('width', '210mm', 'important');
        page.style.setProperty('min-width', '210mm', 'important');
        page.style.setProperty('max-width', '210mm', 'important');
        page.style.setProperty('height', '297mm', 'important');
        page.style.setProperty('max-height', '297mm', 'important');
        page.style.setProperty('box-sizing', 'border-box', 'important');
        page.style.setProperty('padding', '16mm 12mm 18mm', 'important');
        page.style.setProperty('border', '0', 'important');
        page.style.setProperty('border-radius', '0', 'important');
        page.style.setProperty('box-shadow', 'none', 'important');
        page.style.setProperty('overflow', 'hidden', 'important');
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const canvas = await window.html2canvas(page, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          width: page.scrollWidth,
          height: page.scrollHeight
        });
        const Pdf = window.jspdf.jsPDF;
        const pdf = new Pdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
        return pdf.output('blob');
      } finally {
        if (oldStyle === null) page.removeAttribute('style');
        else page.setAttribute('style', oldStyle);
      }
    }

    function downloadDutyPdf(blob, filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function shareDutyPdf() {
      if (!document.querySelector('#dynamic-pdf-table tbody')) {
        showToast('Generate the preview before sharing it.');
        return;
      }

      try {
        const blob = await createDutyPdfBlob();
        const type = currentDutyType === 'keyman' ? 'Keyman' : 'Night-Patrolling';
        const date = (document.getElementById('pdf-date-display')?.textContent || '').replace(/[^\d-]+/g, '-').replace(/^-|-$/g, '');
        const filename = `${type}-Duty${date ? `-${date}` : ''}.pdf`;
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (typeof navigator.share === 'function' &&
            (!navigator.canShare || navigator.canShare({ files: [file] }))) {
          try {
            await navigator.share({ title: `${type} Duty`, files: [file] });
            return;
          } catch (error) {
            if (error.name === 'AbortError') return;
          }
        }

        downloadDutyPdf(blob, filename);
        showToast('PDF downloaded. Share the PDF file from your downloads.');
      } catch (error) {
        console.error('Could not create duty PDF for sharing:', error);
        showToast('Could not create the PDF. Check your connection and try again.');
      }
    }

    function formatDateDisplay(d1, d2, type) {
      if (type === 'keyman') {
        if (d1) { const [y1, m1, day1] = d1.split('-'); return `${day1}/${m1}/${y1}`; }
        return "14/02/2026";
      }
      if (d1 && d2) {
        const [y1, m1, day1] = d1.split('-'); const [y2, m2, day2] = d2.split('-');
        if (m1 === m2 && y1 === y2) return `${day1} - ${day2}/${m1}/${y1}`;
        else return `${day1}/${m1}/${y1} - ${day2}/${m2}/${y2}`;
      }
      if (d1) { const [y1, m1, day1] = d1.split('-'); return `${day1}/${m1}/${y1}`; }
      if (d2) { const [y2, m2, day2] = d2.split('-'); return `${day2}/${m2}/${y2}`; }
      return "14 - 15/02/2026";
    }

    function generatePreview() {
      try {
        const type = currentDutyType === 'keyman' ? 'keyman' : 'night';
        console.log('📋 Generating preview for type:', type, 'currentDutyType:', currentDutyType);

        const currentBitData = type === 'night' ? nightBitData : keymanBitData;
        const currentDutyNumbers = type === 'night' ? nightDutyNumbers : keymanDutyNumbers;
        const from = document.getElementById('fromDate').value;
        const to = document.getElementById('toDate').value;
        const displayDate = formatDateDisplay(from, to, type);
        const subtitleText = document.getElementById('duty-subtitle')?.value.trim() || '';
        const titleEl = document.querySelector('.patrol-title');
        const tableEl = document.getElementById('dynamic-pdf-table');

        if (!titleEl || !tableEl) {
          console.error('❌ Preview elements not found - titleEl:', !!titleEl, 'tableEl:', !!tableEl);
          return;
        }

        let colgroupHTML = '', theadHTML = '', tbodyRows = '';
        const subtitleLineHTML = subtitleText
          ? '<br><span class="duty-pdf-subtitle-cell"></span>'
          : '';

        if (type === 'night') {
          titleEl.innerHTML = `Night&nbsp;&nbsp;Patrolling&nbsp;&nbsp;&nbsp;&nbsp;@<span id="pdf-date-display">${displayDate}</span>`;
          colgroupHTML = `<col style="width:13%;"><col style="width:19%;"><col style="width:39%;"><col style="width:13%;"><col style="width:16%;">`;
          theadHTML = `<tr><th class="th-bit">Bit No.${subtitleLineHTML}</th><th class="th-range">From........ To</th><th class="th-rail">रेल कर्मचारी</th><th class="th-rail">Duty No.</th><th class="th-contract">कॉन्ट्रैक्ट लेबर &amp; मोब. न.</th></tr>`;
        } else {
          titleEl.innerHTML = `Keyman&nbsp;Duty&nbsp;&nbsp;&nbsp;&nbsp;@<span id="pdf-date-display">${displayDate}</span>`;
          colgroupHTML = `<col style="width:13%;"><col style="width:35%;"><col style="width:39%;"><col style="width:13%;">`;
          theadHTML = `<tr><th class="th-bit">Bit No.${subtitleLineHTML}</th><th class="th-range">From........ To</th><th class="th-rail">रेल कर्मचारी</th><th class="th-gps">GPS NO.</th></tr>`;
        }

        tbodyRows = currentBitData.map((bit, i) => {
          const searchInput = document.getElementById(`emp-search-${i}`);
          const name = searchInput ? searchInput.value.trim() : "";
          const phone = document.getElementById(`emp-phone-${i}`).value || "__________";
          const dutyNo = currentDutyNumbers[i] || "______";
          const cls = (i % 2 === 0) ? 'td-name-green' : 'td-name-yellow';
          const display = name ? `${name} {${phone}}` : "________________";
          if (type === 'night') {
            return `<tr><td class="td-bit">${bit.no}</td><td class="td-range">${bit.range}</td><td class="${cls}">${display}</td><td class="td-duty">${dutyNo}</td><td class="td-contract"></td></tr>`;
          } else {
            return `<tr><td class="td-bit">${bit.no}</td><td class="td-range">${bit.range}</td><td class="${cls}">${display}</td><td class="td-duty">${dutyNo}</td></tr>`;
          }
        }).join('');

        tableEl.innerHTML = `<colgroup>${colgroupHTML}</colgroup><thead>${theadHTML}</thead><tbody>${tbodyRows}</tbody>`;
        if (subtitleText) tableEl.querySelector('.duty-pdf-subtitle-cell').textContent = subtitleText;
        console.log('✅ Preview generated successfully');
        showSection('preview-section');
      } catch (error) {
        console.error('❌ Error generating preview:', error);
      }
    }



// Expose on window
window.nightBitData = nightBitData;
window.defaultNightDutyNumbers = defaultNightDutyNumbers;
window.nightDutyNumbers = nightDutyNumbers;
window.getGpsNumbersForType = getGpsNumbersForType;
window.getDefaultGpsNumbersForType = getDefaultGpsNumbersForType;
window.loadGpsNumbersFromDB = loadGpsNumbersFromDB;
window.toggleGpsSaveButton = toggleGpsSaveButton;
window.updateGpsVisibility = updateGpsVisibility;
window.handlePersonnelInputChange = handlePersonnelInputChange;
window.saveSingleGpsNumber = saveSingleGpsNumber;
window.setDutyMode = setDutyMode;
window.setupForm = setupForm;
window.saveGpsNumbers = saveGpsNumbers;
window.resetGpsNumbers = resetGpsNumbers;
window.filterDropdownEmployees = filterDropdownEmployees;
window.selectEmployeeRow = selectEmployeeRow;
window.formatDateDisplay = formatDateDisplay;
window.generatePreview = generatePreview;
