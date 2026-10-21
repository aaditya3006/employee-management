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
          @page { size: A4 portrait; margin: 10mm; }
          @media print {
            html, body { width: 210mm !important; background: #fff !important; }
            #pdf-content {
              display: block !important;
              width: 190mm !important;
              min-height: 277mm !important;
              margin: 0 auto !important;
              padding: 8mm !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
            }
            #dynamic-pdf-table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }
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
              height: 45px !important;
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
            #legacy-containers,
            #top-nav,
            #sidebar,
            #sidebar-backdrop { display: none !important; }
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
