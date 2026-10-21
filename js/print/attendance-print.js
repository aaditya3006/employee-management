/* ==========================================================================
   RAILSAATHI - ATTENDANCE PRINT ENGINE (RULE R3 IMMUTABLE)
   js/print/attendance-print.js
   ========================================================================== */

    function printAtt(mode) {
      if (mode === 'today') { buildAttTable([currentAttData], 'today'); executeAttPrint('landscape'); }
      else { showTillNow(); }
    }

    function executeAttPrint(orientation) {
      clearDynamicPrintStyles();
      const styleEl = document.createElement('style');
      styleEl.id = 'dynamic-print-style';
      styleEl.innerHTML = orientation === 'landscape'
        ? `@media print { @page { size: landscape; margin: 10mm; } #att-pdf-content { width: 100% !important; } }`
        : `@media print { @page { size: portrait; margin: 10mm; } #att-pdf-content { width: 100% !important; } }`;
      document.head.appendChild(styleEl);
      window.print();
    }



window.printAtt = printAtt;
window.executeAttPrint = executeAttPrint;
