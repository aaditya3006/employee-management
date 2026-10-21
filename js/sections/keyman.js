/* ==========================================================================
   RAILSAATHI - KEYMAN DUTY MODULE
   js/sections/keyman.js
   ========================================================================== */

    const keymanBitData = [
      { no: "K - 1", range: "km 1 to  km 7" },
      { no: "K - 2", range: "km 7 to  km 14" },
      { no: "K - 3", range: "km 14 to  km 18" },
      { no: "K - 4", range: "km 18 to  km 23" },
      { no: "K - 5", range: "km 23 to  km 29" },
      { no: "K - 6", range: "km 29 to  km 34" },
      { no: "K - 7", range: "km 34 to  km 39" },
      { no: "K - 8", range: "km 39 to  km 44" }
    ];


    const defaultKeymanDutyNumbers = ["80083", "86639", "85437", "86484", "102861", "80444", "85195", "80374"];
    const keymanDutyNumbers = [...defaultKeymanDutyNumbers];


window.keymanBitData = keymanBitData;
window.defaultKeymanDutyNumbers = defaultKeymanDutyNumbers;
