/* ==========================================================================
   RAILSAATHI - HOME MENU & MODULE LAUNCHER
   js/sections/home-menu.js
   ========================================================================== */

(function () {
  'use strict';

  function launchModule(cat) {
    console.log(`🚀 launchModule("${cat}") called`);
    if (cat === 'night' || cat === 'keyman') {
      showSection('form-section');
      setDutyMode(cat);
    } else if (cat === 'ta') {
      showSection('form-section');
      if (typeof handleMenuSelect === 'function') handleMenuSelect('ta');
    } else if (cat === 'attendance') {
      showSection('form-section');
      if (typeof handleMenuSelect === 'function') handleMenuSelect('unit');
    } else if (cat === 'admin') {
      showSection('admin-section');
    } else if (cat === 'history') {
      showSection('history-section');
    } else if (cat === 'profile') {
      showSection('profile-section');
    } else if (cat === 'settings') {
      showSection('settings-section');
    } else if (cat === 'approve') {
      showSection('approve-section');
    } else {
      showSection('form-section');
      if (typeof handleMenuSelect === 'function') handleMenuSelect(cat);
    }
  }

  window.launchModule = launchModule;
})();
