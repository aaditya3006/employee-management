/* ==========================================================================
   RAILSAATHI - CORE CONFIGURATION & CONSTANTS
   js/core/config.js
   ========================================================================== */

window.MARKETING_DOWNLOAD_URL = window.MARKETING_DOWNLOAD_URL || 'https://rgdtiaportal.live/app-release.apk';
var MARKETING_DOWNLOAD_URL = window.MARKETING_DOWNLOAD_URL;

window.LOGIN_RATE_LIMIT = window.LOGIN_RATE_LIMIT || {
  maxAttempts: 5,
  lockoutDurationMinutes: 5
};
var LOGIN_RATE_LIMIT = window.LOGIN_RATE_LIMIT;

window.PASSWORD_RESET_RATE_LIMIT = window.PASSWORD_RESET_RATE_LIMIT || {
  maxAttempts: 3,
  timeWindowMinutes: 15
};
var PASSWORD_RESET_RATE_LIMIT = window.PASSWORD_RESET_RATE_LIMIT;

window.monthMap = window.monthMap || {
  'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
  'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
};
var monthMap = window.monthMap;

    // ==========================================
    function initSupabase() {
      if (window.auth && window.db) {
        console.log('✅ Supabase already initialized');
        return;
      }

      if (!window.supabase) {
        console.error('❌ Supabase SDK not loaded');
        setTimeout(initSupabase, 100); // Retry after 100ms
        return;
      }

      try {
        const SUPABASE_URL = 'https://uqcabtpiuvaijdflycjk.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxY2FidHBpdXZhaWpkZmx5Y2prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxODQ1MDMsImV4cCI6MjA4OTc2MDUwM30.0RbFogjj__ulJzISAIYPXZW3K3SX6vUPiFMY6rgQ_Wc';

        const { createClient } = window.supabase;

        // Create client with session persistence enabled
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: localStorage, // Store session in browser localStorage
            storageKey: 'supabase.auth.token'
          }
        });

        window.supabase = supabaseClient;
        window.auth = supabaseClient.auth;
        window.db = supabaseClient;

        // Make available in global scope for all code
        window.currentUserRole = 'employee';
        window.currentUserAuth = null;

        console.log('✅ Supabase initialized successfully');

        // 🔒 Dashboard security check - show login if no valid session
        window.auth.onAuthStateChange(async (event, session) => {
          if (event === 'INITIAL_SESSION' && session) {
            // Supabase emits INITIAL_SESSION when a saved login is restored after
            // refresh. Open the app for that user just as we do after sign-in.
            window.currentUserAuth = session.user;
            window.hideMarketingLanding?.();

            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) loginScreen.style.display = 'none';

            // Defer database work until after the auth callback has returned.
            setTimeout(async () => {
              if (window.currentUserAuth?.id !== session.user.id) return;

              try {
                if (typeof initializeUserRole === 'function') {
                  await initializeUserRole(session.user);
                }
                if (window.currentUserAuth?.id !== session.user.id) return;

                if (typeof updateAdminUIVisibility === 'function') updateAdminUIVisibility();
                if (typeof updateSidebarForAdmin === 'function') updateSidebarForAdmin(session.user);
                if (typeof startMainApp === 'function') startMainApp();
                if (typeof loadDataFromDB === 'function') loadDataFromDB();
              } catch (error) {
                console.error('Could not restore the signed-in dashboard:', error);
              }
            }, 0);
          } else if (event === 'SIGNED_IN' && session) {
            window.hideMarketingLanding?.();
            window.currentUserAuth = session.user;
            // Initialize user role on login
            if (typeof initializeUserRole === 'function') {
              await initializeUserRole(session.user);
            }
          } else if (event === 'SIGNED_OUT' || !session) {
            window.replaceEmployeeList?.([]);
            window.renderEmployeeTable?.();

            // Check for direct phone auth session
            const savedPhoneUser = localStorage.getItem('railsaathi_auth_user');
            if (savedPhoneUser) {
              try {
                const parsedUser = JSON.parse(savedPhoneUser);
                if (parsedUser && (parsedUser.id || parsedUser.uid)) {
                  const uid = parsedUser.id || parsedUser.uid;
                  window.currentUserAuth = {
                    id: uid,
                    uid: uid,
                    email: parsedUser.email || (parsedUser.phone + '@railsaathi.local'),
                    phone: parsedUser.phone,
                    role: parsedUser.role || 'employee',
                    user_metadata: { full_name: parsedUser.name, name: parsedUser.name, phone: parsedUser.phone }
                  };
                  window.currentUserRole = parsedUser.role || 'employee';
                  window.hideMarketingLanding?.();
                  if (typeof updateSidebarUserDisplay === 'function') {
                    updateSidebarUserDisplay(parsedUser.name, parsedUser.phone);
                  }
                  if (typeof updateAdminUIVisibility === 'function') updateAdminUIVisibility();
                  if (typeof updateSidebarForAdmin === 'function') updateSidebarForAdmin(window.currentUserAuth);
                  const loginScreen = document.getElementById('login-screen');
                  if (loginScreen) loginScreen.style.display = 'none';
                  const mainApp = document.getElementById('main-wrapper');
                  if (mainApp) mainApp.style.display = 'block';
                  if (typeof loadDataFromDB === 'function') loadDataFromDB();
                  if (typeof startMainApp === 'function') startMainApp();
                  return;
                }
              } catch (e) {
                console.warn('⚠️ Error restoring phone session:', e);
              }
            }

            // No logged-in user found - show login screen
            const loginScreen = document.getElementById('login-screen');
            const mainApp = document.getElementById('main-wrapper');
            if (loginScreen && mainApp) {
              loginScreen.style.display = 'flex';
              mainApp.style.display = 'none';
            }
            console.log('✅ No active session found - Login screen shown');
            window.currentUserAuth = null;
            window.currentUserRole = 'employee';
            window.resolvePreAuthExperience?.();
          }
        });
      } catch (err) {
        console.error('❌ Failed to initialize Supabase:', err);
      }
    }

    // Initialize as soon as Supabase SDK is available

    // Initialize as soon as Supabase SDK is available
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initSupabase();
        setTimeout(() => { if (typeof setupAuthFormListeners === 'function') setupAuthFormListeners(); }, 100);
      });
    } else {
      initSupabase();
      setTimeout(() => { if (typeof setupAuthFormListeners === 'function') setupAuthFormListeners(); }, 100);
    }
