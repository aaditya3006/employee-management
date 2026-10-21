/* ==========================================================================
   RAILSAATHI - LOGIN SCREEN INTERACTION & PARTICLES
   js/sections/login.js
   ========================================================================== */

(function () {
  'use strict';

  // Initialize login screen particles on DOM ready
  function initLoginParticles() {
    const loginParticlesContainer = document.getElementById('login-particles-container');
    if (loginParticlesContainer && typeof loginParticlesContainer.appendChild === 'function') {
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'login-particle';
        const size = Math.random() * 2 + 2 + 'px';
        p.style.width = size;
        p.style.height = size;
        p.style.left = Math.random() * 100 + 'vw';
        p.style.animationDelay = Math.random() * 8 + 's';
        p.style.animationDuration = (Math.random() * 4 + 6) + 's';
        loginParticlesContainer.appendChild(p);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginParticles);
  } else {
    initLoginParticles();
  }

  window.openForgotPasswordModal = function () {
    if (typeof toggleLoginModal === 'function') toggleLoginModal('forgotLoginModal', true);
  };

  window.closeForgotPasswordModal = function () {
    if (typeof toggleLoginModal === 'function') toggleLoginModal('forgotLoginModal', false);
  };

  window.openCreateAccountModal = function () {
    if (typeof toggleLoginModal === 'function') toggleLoginModal('createLoginModal', true);
  };

  window.closeCreateAccountModal = function () {
    if (typeof toggleLoginModal === 'function') toggleLoginModal('createLoginModal', false);
  };
})();
