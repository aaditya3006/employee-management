/* ==========================================================================
   RAILSAATHI - NAVIGATION & CORE UI HELPERS
   js/core/navigation.js
   ========================================================================== */

let downloadStatusTimerA = null;
let downloadStatusTimerB = null;
let downloadStatusTimerC = null;
let pendingAction = null;
let pendingIndex = null;

    function hideAppDownloadStatus() {
      const status = document.getElementById('login-download-status');
      const bar = document.getElementById('login-download-status-bar');
      if (status) {
        status.style.display = 'none';
        status.classList.remove('is-success');
      }
      if (bar) bar.style.width = '0%';
    }

    function showAppDownloadStatus(title, text, progress, isSuccess = false) {
      const status = document.getElementById('login-download-status');
      const statusTitle = document.getElementById('login-download-status-title');
      const statusText = document.getElementById('login-download-status-text');
      const statusBar = document.getElementById('login-download-status-bar');

      if (!status || !statusTitle || !statusText || !statusBar) return;

      status.style.display = 'block';
      status.classList.toggle('is-success', isSuccess);
      statusTitle.textContent = title;
      statusText.textContent = text;
      statusBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
    }

    function triggerAppDownload() {
      const downloadUrl = MARKETING_DOWNLOAD_URL;

      clearTimeout(downloadStatusTimerA);
      clearTimeout(downloadStatusTimerB);
      clearTimeout(downloadStatusTimerC);

      showAppDownloadStatus('Preparing download', 'Opening the Railsaathi APK download now.', 20);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      downloadStatusTimerA = setTimeout(() => {
        showAppDownloadStatus('Download started', 'Your browser is opening the APK file.', 55);
      }, 700);

      downloadStatusTimerB = setTimeout(() => {
        showAppDownloadStatus('Almost done', 'Please confirm the download prompt if it appears.', 82);
      }, 1800);

      downloadStatusTimerC = setTimeout(() => {
        showAppDownloadStatus('Thank you', 'Thank you for downloading Railsaathi.', 100, true);
        setTimeout(hideAppDownloadStatus, 2500);
      }, 3200);
    }



window.startAppDownload = function () {
  if (typeof triggerAppDownload === 'function') {
    triggerAppDownload();
  }
};

    // ==========================================

    function updateSidebarForAdmin(user) {
      const sidebarAssignBtn = document.getElementById('sidebar-assign-btn');
      const sidebarApproveBtn = document.getElementById('sidebar-approve-btn');
      const topbarApproveBtn = document.getElementById('topbar-approve-btn');

      // Check if user is admin by email OR by role
      const isAdmin = user && (user.email === 'nandkishor24714@gmail.com' || checkPermission('admin'));

      console.log('👥 updateSidebarForAdmin - user:', user?.email, '- isAdmin:', isAdmin, '- currentUserRole:', currentUserRole);

      if (isAdmin) {
        console.log('✅ Admin user detected, showing Approve buttons');
        if (sidebarAssignBtn) sidebarAssignBtn.style.display = 'none';
        if (sidebarApproveBtn) sidebarApproveBtn.style.display = 'block';
        if (topbarApproveBtn) topbarApproveBtn.style.display = 'block';
      } else {
        console.log('❌ Non-admin user, hiding Approve buttons');
        if (sidebarAssignBtn) sidebarAssignBtn.style.display = 'block';
        if (sidebarApproveBtn) sidebarApproveBtn.style.display = 'none';
        if (topbarApproveBtn) topbarApproveBtn.style.display = 'none';
      }
    }


    // ==========================================
    //   ORIGINAL APP CODE (KEPT FULLY INTACT)
    // ==========================================

    const introSplash = document.getElementById('intro-splash');

    function dismissIntroToApp() {
      if (window.introsplashTimer) clearTimeout(window.introsplashTimer);

      const skipBtn = document.getElementById('skip-intro-btn');
      if (skipBtn) skipBtn.style.display = 'none';

      const introSplash = document.getElementById('intro-splash');
      introSplash.style.transition = 'opacity 0.3s ease-out';
      introSplash.style.opacity = '0';
      introSplash.style.pointerEvents = 'none';

      setTimeout(() => {
        introSplash.style.display = 'none';

        // EXPLICITLY show all main app elements
        document.getElementById('main-wrapper').style.display = 'block';
        document.getElementById('top-nav').style.display = 'block';
        document.getElementById('main-footer').style.display = 'block';
        document.getElementById('bg-image').style.display = 'block';

        // Hide preview sections FIRST before showing form-section to prevent flashing
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('attendance-preview-section').style.display = 'none';
        document.getElementById('ta-preview-section').style.display = 'none';

        // Initialize and hide form-section temporarily while setting up
        const formSection = document.getElementById('form-section');
        if (formSection) {
          formSection.style.display = 'none';
        }

        // Re-update admin UI visibility now that app is showing
        console.log('🎯 Updating admin UI visibility after intro dismissal - currentUserRole:', currentUserRole);

        // Update visa AFTER showing main wrapper so elements are visible
        updateAdminUIVisibility();
        updateSidebarForAdmin(window.currentUserAuth);

        // Setup form BEFORE showing it to prevent flashing
        setupForm();

        // NOW show form-section after setup is complete
        if (formSection) {
          formSection.classList.remove('hidden');
          formSection.style.display = 'block';
        }

        // Note: loadProfileData() and loadSettings() disabled - tables not found in Supabase
        // Uncomment if you create user_settings and users tables
        loadProfileData();  // Load profile data for sidebar display
        // loadSettings();     // Load and apply user's theme, font size, and layout settings

        // If user is admin, start real-time listener for new account approvals
        const currentUser = window.currentUserAuth;
        if (currentUser && currentUser.email === 'nandkishor24714@gmail.com') {
          console.log('👨‍💼 Admin detected - initializing real-time listener for pending accounts');
          // Start immediately showing pending accounts
          setTimeout(() => {
            loadAdminUsers('pending');
            console.log('✅ Real-time listener initialized - watching for new approval requests');
          }, 100);
        }

        console.log('Dashboard fully loaded');
      }, 300);
    }

    function showIntroDashboard() {
      dismissIntroToApp();
    }

    function launchModule(cat) {
      dismissIntroToApp();
      handleMenuSelect(cat);
    }

    function openSidebar() {
      document.getElementById('sidebar').classList.remove('-translate-x-full');
      document.getElementById('sidebar-backdrop').classList.add('active');
    }
    function closeSidebar() {
      document.getElementById('sidebar').classList.add('-translate-x-full');
      document.getElementById('sidebar-backdrop').classList.remove('active');
    }

    function showSettingsPage() {
      console.log('📍 showSettingsPage() called');

      try {
        window.scrollTo(0, 0);

        const sections = ['form-section', 'admin-section', 'history-section', 'data-section', 'profile-section', 'settings-section', 'approve-section', 'security-section', 'home-section', 'preview-section', 'attendance-preview-section', 'ta-preview-section'];
        sections.forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.classList.add('hidden');
            el.style.display = 'none';
          }
        });

        const mainWrapper = document.getElementById('main-wrapper');
        const navEl = document.getElementById('top-nav');
        const footerEl = document.getElementById('main-footer');
        const bgEl = document.getElementById('bg-image');

        if (mainWrapper) mainWrapper.style.display = 'block';
        if (navEl) navEl.style.display = 'block';
        if (footerEl) footerEl.style.display = 'block';
        if (bgEl) bgEl.style.display = 'block';

        const settingsEl = document.getElementById('settings-section');
        if (!settingsEl) {
          console.error('❌ Settings section element not found in DOM');
          return;
        }

        settingsEl.classList.remove('hidden');
        settingsEl.style.display = 'block';
        settingsEl.style.visibility = 'visible';
        settingsEl.style.opacity = '1';
        settingsEl.style.height = 'auto';
        settingsEl.style.overflow = 'visible';

        setTimeout(() => {
          settingsEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        }, 50);

        // Note: loadSettings() disabled - tables not found in Supabase
        // loadSettings().catch(err => console.error('loadSettings error:', err));
      } catch (error) {
        console.error('❌ Error in showSettingsPage:', error);
      }
    }

    function toggleUserMenu() {
      const userMenuOptions = document.getElementById('user-menu-options');
      const toggleIcon = document.getElementById('user-menu-toggle-icon');

      if (userMenuOptions.classList.contains('hidden')) {
        userMenuOptions.classList.remove('hidden');
        toggleIcon.style.transform = 'rotate(180deg)';
      } else {
        userMenuOptions.classList.add('hidden');
        toggleIcon.style.transform = 'rotate(0deg)';
      }
    }

    function customAlert(msg) {
      document.getElementById('alert-modal-msg').innerText = msg;
      document.getElementById('alert-modal-overlay').style.display = 'flex';
    }


    let sectionHeadingTimer = null;
    let sectionHeadingIndex = 0;
    let sectionHeadingDeleting = false;
    let sectionHeadingTarget = '';

    function runSectionHeadingTyping() {
      const heading = document.getElementById('section-heading-text');
      if (!heading) return;

      const targetText = sectionHeadingTarget || heading.dataset.headingText || '';
      if (!targetText) {
        heading.textContent = '';
        return;
      }

      let speed = sectionHeadingDeleting ? 70 : 120;

      if (!sectionHeadingDeleting) {
        heading.textContent = targetText.substring(0, sectionHeadingIndex + 1);
        sectionHeadingIndex += 1;

        if (sectionHeadingIndex >= targetText.length) {
          sectionHeadingDeleting = true;
          speed = 1800;
        }
      } else {
        heading.textContent = targetText.substring(0, Math.max(sectionHeadingIndex - 1, 0));
        sectionHeadingIndex -= 1;

        if (sectionHeadingIndex <= 0) {
          sectionHeadingDeleting = false;
          speed = 500;
        }
      }

      sectionHeadingTimer = setTimeout(runSectionHeadingTyping, speed);
    }

    function setSectionHeading(text) {
      const heading = document.getElementById('section-heading-text');
      if (!heading) return;

      sectionHeadingTarget = String(text || '').trim();
      heading.dataset.headingText = sectionHeadingTarget;
      heading.setAttribute('aria-label', sectionHeadingTarget);
      heading.textContent = '';
      sectionHeadingIndex = 0;
      sectionHeadingDeleting = false;

      if (sectionHeadingTimer) clearTimeout(sectionHeadingTimer);
      runSectionHeadingTyping();
    }


    function showSection(id) {
      console.log(`📍 showSection("${id}") called`);

      if (introSplash && introSplash.style.display !== 'none' && introSplash.style.opacity !== '0') {
        introSplash.style.transition = 'opacity 0.3s';
        introSplash.style.opacity = '0';
        introSplash.style.pointerEvents = 'none';
        setTimeout(() => { introSplash.style.display = 'none'; }, 300);
      }
      const homeEl = document.getElementById('home-section');
      if (homeEl) homeEl.style.display = 'none';

      // Hide all form-related sections
      const formSection = document.getElementById('form-section');
      ['form-section', 'admin-section', 'history-section', 'data-section', 'profile-section', 'settings-section', 'approve-section', 'security-section'].forEach(s => {
        const el = document.getElementById(s);
        if (el) {
          el.classList.add('hidden');
          el.style.display = 'none';
        }
      });

      if (id === 'home-section') {
        mainWrapper.style.display = 'none'; navEl.style.display = '';
        footerEl.style.display = ''; bgEl.style.display = '';
        previewEl.style.display = 'none'; attPreviewEl.style.display = 'none'; taPreviewEl.style.display = 'none';
        if (homeEl) homeEl.style.display = 'block';
      } else if (id === 'preview-section') {
        mainWrapper.style.display = 'none'; navEl.style.display = 'none';
        footerEl.style.display = 'none'; bgEl.style.display = 'none';
        previewEl.style.display = 'flex'; attPreviewEl.style.display = 'none'; taPreviewEl.style.display = 'none';
      } else if (id === 'attendance-preview-section') {
        mainWrapper.style.display = 'none'; navEl.style.display = 'none';
        footerEl.style.display = 'none'; bgEl.style.display = 'none';
        previewEl.style.display = 'none'; attPreviewEl.style.display = 'flex'; taPreviewEl.style.display = 'none';
      } else if (id === 'ta-preview-section') {
        mainWrapper.style.display = 'none'; navEl.style.display = 'none';
        footerEl.style.display = 'none'; bgEl.style.display = 'none';
        previewEl.style.display = 'none'; attPreviewEl.style.display = 'none'; taPreviewEl.style.display = 'flex';
        updateTaPreviewModeUI();
      } else {
        mainWrapper.style.display = 'block'; navEl.style.display = 'block';
        footerEl.style.display = 'block'; bgEl.style.display = 'block';
        previewEl.style.display = 'none'; attPreviewEl.style.display = 'none'; taPreviewEl.style.display = 'none';
        const target = document.getElementById(id);
        if (target) {
          target.classList.remove('hidden');
          target.style.display = 'block';
          console.log(`✅ Section "${id}" displayed`);
        } else {
          console.error(`❌ Section "${id}" not found in DOM`);
        }
      }
      if (id === 'form-section') setupForm();
      if (id === 'admin-section') {
        console.log('📋 Admin section clicked - loading pending accounts');
        loadAdminUsers('pending');
      }
      if (id === 'settings-section') {
        showSettingsPage();
        return;
      }
      if (id === 'security-section') {
        console.log('🔐 Security section clicked - loading activity logs and user roles');
        loadActivityLogs();
        loadUserRoles();
      }
      if (id === 'history-section') loadHistoryFromDB();
      window.scrollTo(0, 0);
    }



    function openPwModal(action, index) {
      // Permission check for clearHistory
      if (action === 'clearHistory' && !isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to clear logs.\nOnly administrators can delete history records.');
        return;
      }

      pendingAction = action;
      pendingIndex = (index !== undefined) ? index : -1;
      const msgEl = document.getElementById('pw-modal-msg');
      const btnEl = document.getElementById('pw-confirm-btn');
      if (action === 'clearHistory') {
        msgEl.innerText = 'Enter password to PERMANENTLY delete all history logs from database.';
        btnEl.className = 'flex-1 py-3 rounded-xl font-bold bg-red-600 text-white';
        btnEl.innerText = 'Clear All';
      } else {
        msgEl.innerText = 'Enter password to confirm this action.';
        btnEl.className = 'flex-1 py-3 rounded-xl font-bold bg-blue-600 text-white';
        btnEl.innerText = 'Confirm';
      }
      document.getElementById('pw-input').value = '';
      document.getElementById('pw-modal-overlay').style.display = 'flex';
      setTimeout(() => document.getElementById('pw-input').focus(), 100);
    }

    function closePwModal() {
      document.getElementById('pw-modal-overlay').style.display = 'none';
      document.getElementById('pw-input').value = '';
      pendingAction = null; pendingIndex = -1;
    }

    async function confirmPwAction() {
      if (document.getElementById('pw-input').value !== "Nand@1990") {
        customAlert("Incorrect Password! Please try again.");
        document.getElementById('pw-input').value = '';
        document.getElementById('pw-input').focus();
        return;
      }
      const btnText = document.getElementById('pw-confirm-btn');
      const originalText = btnText.innerText;
      const originalClass = btnText.className;
      btnText.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2 inline text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;
      btnText.disabled = true;
      try {
        if (pendingAction === 'clearHistory') {
          // Fetch all records to know count for logging
          try {
            const { data: allRecords, error: fetchErr } = await window.db.from("print_history").select("*");
            // Delete all records
            if (!fetchErr) {
              const { error: deleteErr } = await window.db.from("print_history").delete().neq('id', null);
            }
          } catch (e) {
            // Silently ignore if print_history table doesn't exist
          }
          printHistory = [];
          renderHistory();
          showToast("History Purged.");

          // Log activity
          await logActivity('history_cleared', {
            recordsDeleted: allRecords ? allRecords.length : 0
          });
        }
      } catch (error) {
        console.error("Database Error:", error);
        if (error.message !== "Validation Failed") customAlert("Database Error: " + (error.message || "Unknown error occurred."));
      }
      resetButton(btnText, originalText, originalClass);
      closePwModal();
    }

    function resetButton(btnText, originalText, originalClass) {
      btnText.innerText = originalText; btnText.className = originalClass; btnText.disabled = false;
    }


    function validateAndOpenPwModal() { processBulkAddDirect(); }



    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = "✅ " + msg; t.style.display = 'flex';
      setTimeout(() => t.style.display = 'none', 3000);
    }
