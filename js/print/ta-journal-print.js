/* ==========================================================================
   RAILSAATHI - TA JOURNAL & TA REPORT PRINT ENGINE (RULE R3 IMMUTABLE)
   js/print/ta-journal-print.js
   ========================================================================== */

    function printCurrentTaView() {
      if (currentTaViewMode === 'journal') printTaJournal();
      else printTaReport();
    }

    window.shareCurrentTaView = async function () {
      const source = document.getElementById('ta-preview-content') || document.getElementById('ta-journal-section');
      const text = source?.innerText?.trim() || 'RailSaarthi TA Journal';
      if (navigator.share) {
        try {
          await navigator.share({ title: 'RailSaarthi TA Journal', text });
          return;
        } catch (error) {
          if (error.name === 'AbortError') return;
        }
      }
      if (typeof showToast === 'function') {
        showToast('Direct sharing is not supported on this device. Use Print Journal to save the PDF.');
      }
    };



    function clearDynamicPrintStyles() {
      const existingStyle = document.getElementById('dynamic-print-style');
      if (existingStyle) existingStyle.remove();
    }



    function generateTaReport() {
      const keys = Object.keys(taPageEntries).sort();
      const entries = keys.map(k => taPageEntries[k]);
      const header = getTaHeaderData();

      const monRaw = document.getElementById("ta-month-sel").value; // e.g. "AUG." or "JAN."
      const yr = document.getElementById("ta-year-sel").value; // e.g. "2026"
      // Convert month name abbreviation to zero-padded numeric (e.g. "AUG." -> "08")
      const monthAbbrs = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monIndex = monthAbbrs.findIndex(abbr => monRaw.toUpperCase().startsWith(abbr));
      const mon = monIndex >= 0 ? String(monIndex + 1).padStart(2, '0') : monRaw;
      const monthYear = (monthAbbrs[monIndex] || monRaw) + '/' + yr;

      const yearNum = parseInt(yr, 10);
      const monthNum = monIndex >= 0 ? (monIndex + 1) : parseInt(monRaw, 10);
      let daysInMonth = 30;
      if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      }

      const dateMap = {};
      for (let d = 1; d <= daysInMonth; d++) {
        const dayStr = String(d).padStart(2, '0');
        const dateValue = `${yr}-${mon}-${dayStr}`;
        dateMap[dateValue] = {
          dateRaw: dateValue,
          dateFormatted: formatTaDate(dateValue),
          type: 'Blank',
          work: ''
        };
      }

      // Add journey entries
      entries.forEach((e) => {
        const [y, m] = e.dateRaw.split('-');
        if (y === yr && m === mon) {
          dateMap[e.dateRaw] = {
            dateRaw: e.dateRaw,
            dateFormatted: formatTaDate(e.dateRaw),
            type: 'Work',
            work: e.obj || ''
          };
        }
      });

      // Add rest dates
      const restDatesRaw = JSON.parse(document.getElementById('ta-rest-dates-json').value || '[]');
      restDatesRaw.forEach(d => {
        const [y, m] = d.split('-');
        if (y === yr && m === mon) {
          dateMap[d] = {
            dateRaw: d,
            dateFormatted: formatTaDate(d),
            type: 'Rest',
            work: 'Rest'
          };
        }
      });

      // Add leave dates
      const leaveDatesRaw = JSON.parse(document.getElementById('ta-leave-dates-json').value || '[]');
      leaveDatesRaw.forEach(d => {
        const [y, m] = d.split('-');
        if (y === yr && m === mon) {
          dateMap[d] = {
            dateRaw: d,
            dateFormatted: formatTaDate(d),
            type: 'Leave',
            work: 'Leave'
          };
        }
      });

      // Add CR entries
      const crDetailsRaw = JSON.parse(document.getElementById('ta-cr-details-json').value || '[]');
      crDetailsRaw.forEach(dateVal => {
        if (dateVal) {
          const [y, m, d] = dateVal.split('-');
          if (y === yr && m === mon) {
            const crDateFormatted = `${d}/${m}/${y}`;
            dateMap[dateVal] = {
              dateRaw: dateVal,
              dateFormatted: crDateFormatted,
              type: 'CR',
              work: 'CR'
            };
          }
        }
      });

      const allDateEntries = Object.keys(dateMap).sort().map(k => dateMap[k]);

      let reportRows = allDateEntries.map(function (e) {
        var dateCell = '<td class="ta-report-cell" style="border:none;padding:3px 10px 3px 15px;font-size:26pt;font-weight:bold;font-family:Arial,sans-serif;text-align:left;vertical-align:top;width:22%;white-space:nowrap;line-height:1.3;">' + e.dateFormatted + '</td>';
        var workCell = '<td class="ta-report-cell" style="border:none;padding:3px 0 3px 10px;font-size:26pt;font-weight:bold;font-family:Arial,sans-serif;text-align:left;vertical-align:top;line-height:1.3;">' + (e.work || '') + '</td>';
        return '<tr>' + dateCell + workCell + '</tr>';
      }).join('');

      var reportHTML = '<div id="ta-report-wrapper" style="background:white;width:100%;min-height:272mm;box-sizing:border-box;font-family:Arial,sans-serif;color:#000;border:1.5px solid #000;border-radius:0 !important;padding:10px 14px 14px 14px;">'
        + '<div class="ta-report-title" style="text-align:center;font-size:34pt;font-weight:bold;text-decoration:underline;letter-spacing:0.06em;margin-bottom:6px;color:#000;">T.A MOVEMENT (' + monthYear + ')</div>'
        + '<div class="ta-report-header-line" style="font-size:26pt;line-height:1.4;color:#000;"><b>Name</b> &nbsp;:&nbsp; ' + (header.name || '') + '</div>'
        + '<div class="ta-report-header-line" style="font-size:26pt;line-height:1.4;color:#000;"><b>Designation</b> &nbsp;:&nbsp; ' + (header.post || header.designation || '') + '</div>'
        + '<div class="ta-report-header-line" style="font-size:26pt;line-height:1.4;color:#000;"><b>Station</b> &nbsp;:&nbsp; ' + (header.reportUnit || '') + '</div>'
        + '<div class="ta-report-header-line" style="font-size:26pt;line-height:1.4;color:#000;"><b>PF Number</b> &nbsp;:&nbsp; ' + (header.pfNumber || '') + '</div>'
        + '<div class="ta-report-header-line" style="font-size:26pt;line-height:1.4;color:#000;margin-bottom:5px;"><b>Month</b> &nbsp;:&nbsp; ' + monthYear + '</div>'
        + '<div style="border-top:1.5px solid #000;width:100%;margin:3px 0 5px 0;"></div>'
        + '<table style="width:100%;border-collapse:collapse;border:none;line-height:1;"><tbody>' + reportRows + '</tbody></table>'
        + '</div>';
      document.getElementById('ta-report-content').innerHTML = reportHTML;
      setTimeout(fitReportToPage, 60);
    }

    function fitReportToPage() {
      var wrapper = document.getElementById('ta-report-wrapper');
      if (!wrapper) return;

      // Save original style properties
      var origMinHeight = wrapper.style.minHeight;
      var origWidth = wrapper.style.width;
      var origPosition = wrapper.style.position;
      var origBoxSizing = wrapper.style.boxSizing;

      // Force wrapper to A4 layout dimensions for measurement
      wrapper.style.minHeight = '0';
      wrapper.style.width = '794px';
      wrapper.style.position = 'relative';
      wrapper.style.boxSizing = 'border-box';

      var MAX_HEIGHT = 1020;
      var MIN_FONT = 9.0;
      var largestFont = 26.0;
      var smallestFont = MIN_FONT;
      var titleElements = wrapper.querySelectorAll('.ta-report-title');
      var headerElements = wrapper.querySelectorAll('.ta-report-header-line');
      var cellElements = wrapper.querySelectorAll('.ta-report-cell');
      var applyFontSize = function (fontSize) {
        var px = fontSize.toFixed(1) + 'pt';
        var titleSize = (fontSize + 8.0).toFixed(1) + 'pt';
        titleElements.forEach(function (el) { el.style.fontSize = titleSize; });
        headerElements.forEach(function (el) { el.style.fontSize = px; });
        cellElements.forEach(function (el) { el.style.fontSize = px; });
      };

      applyFontSize(largestFont);
      if (wrapper.scrollHeight > MAX_HEIGHT) {
        while (largestFont - smallestFont > 0.1) {
          var midpoint = (largestFont + smallestFont) / 2;
          applyFontSize(midpoint);
          if (wrapper.scrollHeight > MAX_HEIGHT) {
            largestFont = midpoint;
          } else {
            smallestFont = midpoint;
          }
        }
        applyFontSize(smallestFont);
      }

      // Restore original styles
      wrapper.style.minHeight = origMinHeight || '272mm';
      wrapper.style.width = origWidth;
      wrapper.style.position = origPosition;
      wrapper.style.boxSizing = origBoxSizing;
    }

    function printTaJournal() {
      clearDynamicPrintStyles();
      const styleEl = document.createElement('style');
      styleEl.id = 'dynamic-print-style';
      styleEl.innerHTML = `
    @page { size: A4 landscape; margin: 4mm 4mm 0; }
    @media print {
      #ta-pdf-content { position: static !important; width: 100% !important; padding: 0 !important; box-shadow: none !important; display: block !important; }
      #ta-report-content { display: none !important; }
      #ta-pdf-content .ta-page-1,
      #ta-pdf-content .ta-page-2 { height: auto !important; max-height: none !important; overflow: visible !important; zoom: 0.79; width: 100% !important; }
      #ta-pdf-content .ta-page-1 { padding-bottom: 0 !important; }
      #ta-pdf-content .ta-j-table td { height: 44px !important; }
      #ta-pdf-content .ta-j-table td.ta-obj-cell { height: 44px !important; padding: 0 !important; }
      #ta-pdf-content .ta-j-table .ta-obj-container { height: 44px !important; max-height: 44px !important; line-height: 1.15 !important; }
      #ta-pdf-content .ta-certificate { font-size: 10pt !important; line-height: 1.2 !important; margin-top: 2mm !important; }
      #ta-pdf-content .ta-page-1 { page-break-after: always !important; break-after: page !important; }
    }
  `;
      document.head.appendChild(styleEl);
      window.print();
    }

    function printTaReport() {
      clearDynamicPrintStyles();
      const styleEl = document.createElement('style');
      styleEl.id = 'dynamic-print-style';
      styleEl.innerHTML = `
    @page { size: A4 portrait; margin: 8mm; }
    @media print {
      #ta-report-content { position: static !important; width: 100% !important; padding: 0 !important; box-shadow: none !important; display: block !important; border-radius: 0px !important; }
      #ta-pdf-content { display: none !important; }
      #ta-report-wrapper { border: 1.5px solid #000 !important; }
    }
  `;
      document.head.appendChild(styleEl);
      window.print();
    }

    window.addEventListener('afterprint', clearDynamicPrintStyles);



window.printCurrentTaView = printCurrentTaView;
window.clearDynamicPrintStyles = clearDynamicPrintStyles;
window.generateTaReport = generateTaReport;
window.fitReportToPage = fitReportToPage;
window.printTaJournal = printTaJournal;
window.printTaReport = printTaReport;
