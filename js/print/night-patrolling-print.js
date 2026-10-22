/* ==========================================================================
   RAILSAATHI - NIGHT PATROLLING & KEYMAN PRINT ENGINE (RULE R3 IMMUTABLE)
   js/print/night-patrolling-print.js
   ========================================================================== */

    async function handlePrint() {
      try {
        // Get the date range safely
        const dateDisplay = document.getElementById('pdf-date-display');
        if (!dateDisplay) {
          console.error('pdf-date-display element not found');
          window.print();
          return;
        }

        const range = dateDisplay.innerText || '';
        const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false });
        const type = currentDutyType === 'keyman' ? 'keyman' : 'night';
        const prefix = type === 'keyman' ? 'Keyman: ' : 'Night Patrol: ';
        const fullRange = prefix + range;

        console.log('🖨️ Print triggered for:', fullRange, 'type:', type);

        // Try to save print history
        try {
          const { data, error } = await db.from("print_history").insert([{ range: fullRange, timestamp, serverTime: new Date().toISOString() }]).select();
          if (!error && data && data[0]) {
            printHistory.unshift({ id: data[0].id, range: fullRange, timestamp });
            renderHistory();
          }
        } catch (dbError) {
          console.warn("Could not save print history:", dbError);
          // Don't fail if database is unavailable
        }

        // Match the supplied duty-sheet format: A4 portrait with preserved cell colors.
        clearDynamicPrintStyles();
        const printStyle = document.createElement('style');
        printStyle.id = 'dynamic-print-style';
        printStyle.textContent = `
          @page { size: A4 portrait; margin: 0; }
          @media print {
            html, body {
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: #fff !important;
            }
            body > *:not(#preview-section) { display: none !important; }
            #preview-section {
              display: block !important;
              position: static !important;
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              break-after: avoid !important;
              page-break-after: avoid !important;
            }
            #pdf-content {
              display: block !important;
              position: relative !important;
              box-sizing: border-box !important;
              width: 210mm !important;
              height: 297mm !important;
              min-height: 297mm !important;
              max-height: 297mm !important;
              margin: 0 !important;
              padding: 12mm 12mm 18mm !important;
              border: 0 !important;
              border-radius: 0 !important;
              overflow: hidden !important;
              box-shadow: none !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            #dynamic-pdf-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            #dynamic-pdf-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
            #dynamic-pdf-table th,
            #dynamic-pdf-table td {
              border: 2px solid #000 !important;
              text-align: center !important;
              vertical-align: middle !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #dynamic-pdf-table th {
              background: #ffff00 !important;
              padding: 6px 3px !important;
              font-size: 10pt !important;
            }
            #dynamic-pdf-table td {
              height: 55px !important;
              font-size: 10pt !important;
            }
            #dynamic-pdf-table .td-name-green {
              background: #90ee90 !important;
              font-weight: 700 !important;
            }
            #dynamic-pdf-table .td-name-yellow {
              background: #ffff00 !important;
              font-weight: 700 !important;
            }
            .preview-actions,
            .preview-toolbar,
            .duty-pdf-watermark,
            #legacy-containers,
            #top-nav,
            #sidebar,
            #sidebar-backdrop { display: none !important; }
            .duty-pdf-watermark {
              display: block !important;
              position: absolute !important;
              right: 7mm !important;
              bottom: 5mm !important;
              color: #9ca3af !important;
              font-size: 8pt !important;
              font-weight: 400 !important;
            }
          }
        `;
        document.head.appendChild(printStyle);
        window.print();
      } catch (error) {
        console.error("Error in handlePrint:", error);
        clearDynamicPrintStyles();
        window.print();
      }
    }



window.handlePrint = handlePrint;
