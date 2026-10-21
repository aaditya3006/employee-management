/* ==========================================================================
   RAILSAATHI - THEME & USER SETTINGS
   js/core/theme.js
   ========================================================================== */

let currentMarketingLandingTheme = 'dark';

    function applyMarketingLandingTheme(theme) {
      const nextTheme = theme === 'dark' ? 'dark' : 'light';
      const landing = document.getElementById('railsaathi-landing');
      currentMarketingLandingTheme = nextTheme;

      if (landing) {
        landing.setAttribute('data-theme', nextTheme);
      }

      if (document.body) {
        document.body.dataset.landingTheme = nextTheme;
      }

      document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
        const isDark = nextTheme === 'dark';
        button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        button.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        const icon = button.querySelector('[data-theme-icon]');
        if (icon) {
          icon.innerHTML = isDark
            ? '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>'
            : '<path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z"></path>';
        }
      });

      try {
        localStorage.setItem('railsaathiLandingTheme', nextTheme);
      } catch (error) {
        console.warn('Unable to persist landing theme:', error);
      }
    }


    // ===== SETTINGS SECTION =====
    let userSettings = {
      theme: 'light',
      fontSize: 'medium',
      layout: 'standard',
      twoFactor: false
    };

    async function loadSettings() {
      try {
        console.log('⚙️ loadSettings() called');
        const user = window.currentUserAuth;
        if (!user) {
          console.warn('No user logged in, using default settings');
          return;
        }

        // Try to fetch user settings from database
        try {
          const { data: settingsData, error } = await db.from('user_settings').select('*').eq('uid', user.id).single();

          if (!error && settingsData) {
            userSettings = settingsData;
            console.log('✅ Settings loaded from database:', userSettings);
          } else {
            // Fall back to localStorage if database has no settings
            const savedSettings = localStorage.getItem('userSettings_' + user.id);
            if (savedSettings) {
              userSettings = JSON.parse(savedSettings);
              console.log('✅ Settings loaded from localStorage:', userSettings);
            }
          }
        } catch (dbErr) {
          console.warn('Database error loading settings, using localStorage:', dbErr);
          const savedSettings = localStorage.getItem('userSettings_' + user.id);
          if (savedSettings) {
            userSettings = JSON.parse(savedSettings);
            console.log('✅ Settings loaded from localStorage:', userSettings);
          }
        }

        // Update radio button selections with delay to ensure DOM is ready
        setTimeout(() => {
          const themeRadio = document.querySelector(`input[name="theme"][value="${userSettings.theme || 'light'}"]`);
          const fontSizeRadio = document.querySelector(`input[name="fontSize"][value="${userSettings.fontSize || 'medium'}"]`);
          const layoutRadio = document.querySelector(`input[name="layout"][value="${userSettings.layout || 'standard'}"]`);
          const twoFactorToggle = document.getElementById('twoFactorToggle');

          if (themeRadio) themeRadio.checked = true;
          if (fontSizeRadio) fontSizeRadio.checked = true;
          if (layoutRadio) layoutRadio.checked = true;
          if (twoFactorToggle) twoFactorToggle.checked = userSettings.twoFactor || false;

          console.log('✅ Settings UI updated');
        }, 100);

        // APPLY the visual changes immediately
        applyTheme(userSettings.theme || 'light');
        applyFontSize(userSettings.fontSize || 'medium');
        applyLayout(userSettings.layout || 'standard');

        // Load security data for admins (wrapped in try-catch to not break settings)
        if (checkPermission('admin')) {
          try {
            await Promise.all([
              loadActivityLogs().catch(err => console.warn('Activity logs load failed:', err)),
              loadUserRoles().catch(err => console.warn('User roles load failed:', err))
            ]);
          } catch (err) {
            console.warn('Security section load error (non-critical):', err);
          }
        }

        console.log('🎨 Settings applied to UI - READY');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }

    function applyTheme(theme) {
      userSettings.theme = theme;

      // Apply CSS changes
      const root = document.documentElement;
      if (theme === 'dark') {
        document.body.style.backgroundColor = '#1a1a1a';
        document.body.style.color = '#ffffff';
        root.style.colorScheme = 'dark';
      } else if (theme === 'railway') {
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#ffffff';
        root.style.colorScheme = 'light';
      } else {
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
        root.style.colorScheme = 'light';
      }

      // Save to localStorage immediately
      const user = window.currentUserAuth;
      if (user) {
        localStorage.setItem('userSettings_' + user.id, JSON.stringify(userSettings));
      }

      console.log('🎨 Theme applied:', theme);
      showToast('Theme applied!');
    }

    function applyFontSize(size) {
      userSettings.fontSize = size;

      // Apply font size changes
      let baseSize = 16;
      if (size === 'small') baseSize = 14;
      else if (size === 'large') baseSize = 18;
      document.body.style.fontSize = baseSize + 'px';

      // Save to localStorage immediately
      const user = window.currentUserAuth;
      if (user) {
        localStorage.setItem('userSettings_' + user.id, JSON.stringify(userSettings));
      }

      console.log('📝 Font size applied:', size, '(' + baseSize + 'px)');
      showToast('Font size changed!');
    }

    function applyLayout(layout) {
      userSettings.layout = layout;

      const mainWrapper = document.getElementById('main-wrapper');
      if (layout === 'compact') {
        if (mainWrapper) {
          mainWrapper.classList.add('max-w-2xl');
          mainWrapper.classList.remove('max-w-3xl', 'max-w-full');
        }
      } else if (layout === 'wide') {
        if (mainWrapper) {
          mainWrapper.classList.add('max-w-full');
          mainWrapper.classList.remove('max-w-2xl', 'max-w-3xl');
        }
      } else {
        if (mainWrapper) {
          mainWrapper.classList.add('max-w-3xl');
          mainWrapper.classList.remove('max-w-2xl', 'max-w-full');
        }
      }

      // Save to localStorage immediately
      const user = window.currentUserAuth;
      if (user) {
        localStorage.setItem('userSettings_' + user.id, JSON.stringify(userSettings));
      }

      console.log('📱 Layout applied:', layout);
      showToast('Layout changed!');
    }

    async function toggleTwoFactor() {
      try {
        userSettings.twoFactor = document.getElementById('twoFactorToggle').checked;

        const user = window.currentUserAuth;
        if (user) {
          // Save to Firebase immediately
          await db.from('user_settings').upsert({
            uid: user.id,
            twoFactor: userSettings.twoFactor,
            updatedAt: new Date().toISOString()
          });

          // Also save to localStorage
          localStorage.setItem('userSettings_' + user.id, JSON.stringify(userSettings));

          // Log the security event
          await logActivity('2fa_toggled', {
            enabled: userSettings.twoFactor
          });
        }

        showToast('2FA ' + (userSettings.twoFactor ? 'enabled' : 'disabled'));
        console.log('🔐 2FA toggled:', userSettings.twoFactor);
      } catch (error) {
        console.error('Error toggling 2FA:', error);
        customAlert('Error updating 2FA setting');
        document.getElementById('twoFactorToggle').checked = !userSettings.twoFactor;
      }
    }

    async function saveSettings() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          customAlert('User not logged in');
          return;
        }

        // Save to database
        await db.from('user_settings').upsert({
          uid: user.id,
          theme: userSettings.theme,
          fontSize: userSettings.fontSize,
          layout: userSettings.layout,
          twoFactor: userSettings.twoFactor,
          updatedAt: new Date().toISOString()
        });

        // Also save to localStorage for mobile/offline support
        localStorage.setItem('userSettings_' + user.id, JSON.stringify(userSettings));

        showToast('✅ Settings saved successfully!');
        console.log('💾 Settings saved to Firestore and localStorage');
      } catch (error) {
        console.error('Error saving settings:', error);
        customAlert('Failed to save settings: ' + error.message);
      }
    }
