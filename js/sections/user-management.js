/* ==========================================================================
   RAILSAATHI - USER MANAGEMENT & ADMIN APPROVALS
   js/sections/user-management.js
   ========================================================================== */


    // Track current admin tab
    let currentAdminTab = 'all';

    function switchAdminTab(tab) {
      // Keep track of current tab
      currentAdminTab = tab;
      loadAdminUsers(tab);
    }

    function filterAdminUsers(status) {
      loadAdminUsers(status);
    }

    // Store the real-time listener so we can unsubscribe when needed
    let adminUsersUnsubscribe = null;
    let previousPendingCount = 0;
    let listenerInitialized = false;  // Track if this is the first listener fire

    function loadAdminUsers(filterStatus = 'active') {
      console.log('Loading admin users for filter:', filterStatus);

      if (adminUsersUnsubscribe) {
        try {
          adminUsersUnsubscribe();
        } catch (err) {
          console.warn('Previous admin listener cleanup failed:', err);
        }
      }

      adminUsersUnsubscribe = null;

      (async () => {
        try {
          const { data: users, error } = await db.from('users').select('*').order('email');
          if (error) throw error;

          let active = 0, blocked = 0;
          const renderedUsers = [];

          (users || []).forEach(user => {
            const status = user.status || 'approved';
            if (status === 'approved' && user.email !== 'nandkishor24714@gmail.com') {
              active++;
              renderedUsers.push({ ...user, displayStatus: 'active' });
            } else if (status === 'blocked' || status === 'suspended') {
              blocked++;
              renderedUsers.push({ ...user, displayStatus: 'blocked' });
            }
          });

          const statDivs = document.querySelectorAll('#admin-approval-stats > div');
          if (statDivs[0]) statDivs[0].querySelector('div').textContent = active;
          if (statDivs[1]) statDivs[1].querySelector('div').textContent = blocked;

          listenerInitialized = true;

          const usersList = document.getElementById('admin-users-list');
          if (!usersList) return;
          usersList.innerHTML = '';

          const filtered = renderedUsers.filter(u => u.displayStatus === filterStatus);
          if (filtered.length === 0) {
            usersList.innerHTML = `<div class="text-center text-slate-500 py-12 sm:py-16 px-4 sm:px-6"><p class="text-sm sm:text-base">No ${filterStatus} users found</p></div>`;
            return;
          }

          filtered.forEach(user => {
            const createdDate = user.created_at ? new Date(user.created_at) : new Date();
            const dateStr = createdDate.toLocaleDateString();
            const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
            const statusColors = {
              active: { bg: 'bg-green-100', text: 'text-green-700', label: 'ACTIVE' },
              blocked: { bg: 'bg-red-100', text: 'text-red-700', label: 'BLOCKED' }
            };
            const colors = statusColors[user.displayStatus];
            const avatarColors = { active: 'bg-green-500', blocked: 'bg-red-500' };

            const userCard = document.createElement('div');
            userCard.className = 'flex flex-col gap-4 p-4 sm:p-6 hover:bg-slate-50 transition cursor-pointer border-b border-slate-100 last:border-b-0';
            userCard.innerHTML = `
          <div class="flex gap-3 sm:gap-4 items-start sm:items-center flex-1">
            <div class="w-10 h-10 sm:w-12 sm:h-12 ${avatarColors[user.displayStatus]} text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0">${initials}</div>
            <div class="flex-1 min-w-0">
              <strong class="text-slate-900 text-sm sm:text-base block truncate">${user.name || 'N/A'}</strong>
              <small class="text-slate-600 text-xs sm:text-sm block truncate">${user.email || 'N/A'}</small>
              <small class="text-slate-400 text-xs block">${dateStr}</small>
            </div>
            <div class="${colors.bg} ${colors.text} text-xs font-bold px-2 sm:px-3 py-1 rounded-full flex-shrink-0">${colors.label}</div>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 flex-wrap">
            ${user.displayStatus === 'active' ? `
              <button class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-700 transition active:scale-95" onclick="blockAdminUser('${user.id}')">Block</button>
              <button class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-slate-700 transition active:scale-95" onclick="deleteAdminUser('${user.id}', '${user.email || 'User'}')">Delete</button>
            ` : `
              <button class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-indigo-700 transition active:scale-95" onclick="activateAdminUser('${user.id}')">Activate</button>
              <button class="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-slate-700 transition active:scale-95" onclick="deleteAdminUser('${user.id}', '${user.email || 'User'}')">Delete</button>
            `}
          </div>
        `;
            usersList.appendChild(userCard);
          });
        } catch (error) {
          console.error('❌ Error loading admin users:', error);
          const usersList = document.getElementById('admin-users-list');
          if (usersList) {
            usersList.innerHTML = '<div class="text-red-600 text-center py-6 text-sm sm:text-base">Error loading users. Please try again.</div>';
          }
        }
      })();
    }

    function showActivityModal(uid, name, email) {
      console.log('Showing activity for:', uid);

      const modal = document.getElementById('activity-modal');
      const content = document.getElementById('activity-content');

      db.collection('users').doc(uid).collection('activity').get().then(snapshot => {
        if (snapshot.empty) {
          content.innerHTML = `
        <div class="text-center py-8">
          <p class="text-sm sm:text-base text-slate-600 mb-2">No activity recorded</p>
          <small class="text-xs sm:text-sm text-slate-400">User has not logged in yet</small>
        </div>
      `;
        } else {
          // Get all records and sort in JavaScript
          const activities = [];
          snapshot.forEach(doc => {
            activities.push(doc.data());
          });

          // Sort by timestamp (descending)
          activities.sort((a, b) => {
            const aTime = a.timestamp ? (a.timestamp.seconds || 0) * 1000 : 0;
            const bTime = b.timestamp ? (b.timestamp.seconds || 0) * 1000 : 0;
            return bTime - aTime;
          });

          // Limit to 20
          activities.slice(0, 20);

          let html = `
        <div class="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-slate-200">
          <h3 class="font-bold text-slate-900 text-base sm:text-lg mb-1">${name}</h3>
          <p class="text-slate-600 text-xs sm:text-sm">${email}</p>
        </div>
        <h4 class="font-semibold text-slate-900 text-sm sm:text-base mb-4">Login History</h4>
        <div class="space-y-3">
      `;

          activities.forEach(data => {
            const timestamp = data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date();
            const timeStr = timestamp.toLocaleString();
            const type = data.type || 'login';
            const device = data.device || 'Unknown';
            const statusIcon = type === 'login' ? '✓' : '×';
            const statusColor = type === 'login' ? 'text-green-600' : 'text-red-600';

            html += `
          <div class="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${statusColor} ${type === 'login' ? 'bg-green-100' : 'bg-red-100'}">${statusIcon}</span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-slate-900 text-xs sm:text-sm">${type === 'login' ? 'Logged In' : 'Logged Out'} (${device})</p>
                <p class="text-xs text-slate-600">${timeStr}</p>
              </div>
            </div>
            <span class="text-xs font-bold flex-shrink-0 ${type === 'login' ? 'text-green-600' : 'text-red-600'} uppercase">${type}</span>
          </div>
        `;
          });

          html += '</div>';
          content.innerHTML = html;
        }
      }).catch(err => {
        console.error('Error loading activity:', err);
        content.innerHTML = '<div class="text-red-600 text-center py-6 text-sm sm:text-base">Error loading activity. Please try again.</div>';
      });

      modal.classList.remove('hidden');
    }

    function closeActivityModal() {
      document.getElementById('activity-modal').classList.add('hidden');
    }

    window.approveAdminUser = async function (uid) {
      if (!confirm('Approve this account?')) return;
      console.log('🔄 Approving account:', uid);

      try {
        // Step 1: Update the user status
        const { data, error } = await db.from('users')
          .update({ status: 'approved' })
          .eq('uid', uid);

        if (error) {
          console.error('❌ DATABASE ERROR:', error.code, error.message, error.details);
          showToast('❌ Error: ' + (error.message || 'Failed to approve'));
          return;
        }

        console.log('✅ Update response:', data);

        // Step 2: Verify the update by fetching the user
        const { data: userCheck, error: checkError } = await db.from('users')
          .select('uid, status, email')
          .eq('uid', uid)
          .single();

        if (checkError) {
          console.error('⚠️ Could not verify update:', checkError.message);
        } else {
          console.log('✅ Database verification - User status is now:', userCheck.status);
          if (userCheck.status !== 'approved') {
            console.error('❌ WARNING: Status in database is still:', userCheck.status);
            showToast('⚠️ Approval may not have saved. Trying again...');
            // Retry once more
            await db.from('users').update({ status: 'approved' }).eq('uid', uid);
          }
        }

        showToast('✅ Account approved!');

        // Log the approval action (but don't fail if this errors)
        try {
          await logActivity('account_approved', { uid: uid, action: 'admin_approved_account' });
          console.log('📝 Approval activity logged');
        } catch (logErr) {
          console.warn('⚠️ Activity logging failed (non-critical):', logErr);
        }

        // Switch to active tab and reload users
        console.log('📋 Switching to active tab...');
        switchAdminTab('active');

        // Wait a moment for database to settle, then reload
        setTimeout(() => {
          loadAdminUsers('active');
          console.log('✅ Admin list refreshed');
        }, 1200);

      } catch (err) {
        console.error('❌ UNEXPECTED ERROR:', err);
        showToast('❌ Unexpected error: ' + (err.message || 'Unknown error'));
      }
    }

    window.deleteAdminUser = function (uid, email) {
      const confirm1 = confirm('Delete ' + email + ' permanently? This will remove the account completely from the system.');
      if (!confirm1) return;
      const confirm2 = prompt('Type DELETE to confirm:');
      if (confirm2 !== 'DELETE') return;

      console.log('🗑️ Deleting account:', uid, email);

      db.from('users').delete().eq('uid', uid)
        .then(async (response) => {
          console.log('✅ Account deleted successfully:', response);
          showToast('✅ Account deleted permanently!');

          // Make logging non-blocking (was causing cascading failures)
          try {
            await logActivity('account_deleted', { uid: uid, email: email, action: 'admin_deleted_account' });
          } catch (logErr) {
            console.warn('⚠️ Activity logging failed (non-critical):', logErr);
            // Don't fail the deletion if logging fails
          }

          loadAdminUsers(currentAdminTab);
        })
        .catch(err => {
          console.error('❌ ERROR DELETING ACCOUNT:', err.code, err.message);
          showToast('❌ Error deleting: ' + err.message);
        });
    }

    window.blockAdminUser = function (uid) {
      if (!confirm('Block this user?')) return;
      console.log('❌ Blocking user:', uid);

      db.from('users').update({ status: 'blocked' }).eq('uid', uid)
        .then(async (response) => {
          console.log('✅ User blocked successfully:', response);
          showToast('✅ User blocked!');

          try {
            await logActivity('account_blocked', { uid: uid });
          } catch (logErr) {
            console.warn('⚠️ Activity logging failed:', logErr);
          }

          loadAdminUsers('active');
        })
        .catch(err => {
          console.error('❌ Error blocking user:', err.code, err.message);
          showToast('❌ Error: ' + (err.message || 'Unknown error'));
        });
    }

    window.suspendAdminUser = function (uid, email) {
      if (!confirm('Block ' + email + '?')) return;
      console.log('❌ Blocking account:', uid, email);

      db.from('users').update({ status: 'blocked' }).eq('uid', uid)
        .then(async (response) => {
          console.log('✅ Account blocked successfully:', response);
          showToast('✅ Account blocked!');

          // Make logging non-blocking (was causing cascading failures)
          try {
            await logActivity('account_blocked', { uid: uid, email: email, action: 'admin_blocked_account' });
          } catch (logErr) {
            console.warn('⚠️ Activity logging failed (non-critical):', logErr);
            // Don't fail the block if logging fails
          }

          setTimeout(() => loadAdminUsers('blocked'), 500);
        })
        .catch(err => {
          console.error('❌ ERROR BLOCKING ACCOUNT:', err.code, err.message);
          showToast('❌ Error: ' + (err.message || 'Unknown error'));
        });
    }

    window.activateAdminUser = function (uid) {
      if (!confirm('Activate this user?')) return;
      console.log('✅ Activating user:', uid);

      db.from('users').update({ status: 'approved' }).eq('uid', uid)
        .then(async (response) => {
          console.log('✅ User activated successfully:', response);
          showToast('✅ User activated!');

          // Make logging non-blocking (was causing cascading failures)
          try {
            await logActivity('account_activated', { uid: uid, action: 'admin_activated_account' });
          } catch (logErr) {
            console.warn('⚠️ Activity logging failed (non-critical):', logErr);
            // Don't fail the activation if logging fails
          }

          setTimeout(() => loadAdminUsers('blocked'), 500);
        })
        .catch(err => {
          console.error('❌ ERROR ACTIVATING USER:', err.code, err.message);
          showToast('❌ Error: ' + (err.message || 'Unknown error'));
        });
    }

    function showApproveSection() {
      console.log('Loading User Management Section');

      // Security check - only admin can view this
      const currentUser = window.currentUserAuth;
      if (!currentUser || currentUser.email !== 'nandkishor24714@gmail.com') {
        console.log('Access denied - not admin');
        return;
      }

      // Hide other sections
      const sections = ['form-section', 'preview-section', 'attendance-preview-section', 'ta-preview-section', 'admin-section', 'history-section', 'settings-section'];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      const approveSection = document.getElementById('approve-section');
      if (approveSection) approveSection.style.display = 'block';

      // Load active users
      loadAdminUsers('active');
    }

    function showApprovedAccounts() {
      switchAdminTab('active');
    }

    window.approveUser = function (uid) {
      approveAdminUser(uid);
    }

    window.blockUser = function (uid) {
      blockAdminUser(uid);
    }

    window.suspendUser = function (uid, email) {
      suspendAdminUser(uid, email);
    }

    window.deleteUser = function (uid, email) {
      deleteAdminUser(uid, email);
    }

    // Setup real-time listener for admin to see new accounts immediately
    function setupAdminRealtimeListener() {
      console.log('⚙️ Real-time listener temporarily disabled to prevent data race conditions');
      console.log('   Admin updates will refresh when you switch tabs or click refresh');

      // DISABLED: The previous listener was using .collection().onSnapshot() which is Firestore syntax
      // Supabase Postgres doesn't support this. Polling/manual refresh is used instead.
      // 
      // Previous listener code (disabled):
      // let adminBackgroundListener = db.collection('users').onSnapshot(...)
      //
      // TODO: Re-implement with proper Supabase real-time subscriptions if needed:
      // const subscription = db.from('users').on('*', (payload) => { ... }).subscribe()

      console.log('✅ Listener initialization complete (polling mode)');
    }

    function startMainApp() {
      // Guard: prevent double initialization
      if (window.mainAppStarted) {
        console.log('⚠️ Main app already started, skipping...');
        return;
      }
      window.mainAppStarted = true;

      // Go straight to the dashboard after authentication; the intro splash is no longer shown.
      const introSplash = document.getElementById('intro-splash');
      if (introSplash) {
        introSplash.style.display = 'none';
        introSplash.style.opacity = '0';
        introSplash.style.pointerEvents = 'none';
      }

      dismissIntroToApp();
      console.log('startMainApp called - opening dashboard without intro splash');
    }



window.currentAdminTab = currentAdminTab;
window.loadAdminUsers = loadAdminUsers;
window.switchAdminTab = switchAdminTab;
window.filterAdminUsers = filterAdminUsers;
