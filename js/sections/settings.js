/* ==========================================================================
   RAILSAATHI - USER SETTINGS & AUDIT LOGS
   js/sections/settings.js
   ========================================================================== */

    async function loadActivityLogs() {
      try {
        if (!checkPermission('admin')) return;

        const container = document.getElementById('activity-logs-container');
        if (!container) return;

        container.innerHTML = '<div class="text-center text-gray-400">Loading activity logs...</div>';

        // Fetch all logs
        const { data: logs, error } = await db.from('activity_logs').select('*').order('timestamp', { ascending: false });

        if (error || !logs || logs.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-400 py-8">No activity logs found</div>';
          return;
        }

        // Limit to 100
        let displayLogs = logs.length > 100 ? logs.slice(0, 100) : logs;

        let html = '<div class="overflow-y-auto max-h-96">';

        displayLogs.forEach(log => {
          const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown';
          const email = log.email || 'Unknown user';
          const action = log.action || 'Unknown action';
          const details = log.details ? JSON.stringify(log.details) : '';

          html += `
        <div class="border-b border-slate-200 p-3 text-sm hover:bg-slate-100 cursor-pointer transition">
          <div class="flex justify-between items-start mb-1">
            <span class="font-semibold text-blue-600">${email}</span>
            <span class="text-slate-500 text-xs">${timestamp}</span>
          </div>
          <div class="text-slate-700 mb-1">
            <span class="bg-slate-200 px-2 py-1 rounded text-xs font-medium">${action}</span>
          </div>
          ${details ? `<div class="text-slate-600 text-xs mt-1 font-mono bg-slate-100 p-2 rounded">${details}</div>` : ''}
        </div>
      `;
        });

        html += '</div>';
        container.innerHTML = html;

      } catch (error) {
        console.error('Error loading activity logs:', error);
        const container = document.getElementById('activity-logs-container');
        if (container) {
          container.innerHTML = '<div class="text-red-500 py-8">Error loading logs: ' + error.message + '</div>';
        }
      }
    }

    // 💾 Export activity logs to CSV
    async function exportActivityLogs() {
      try {
        if (!checkPermission('admin')) return;

        // Fetch all logs
        const { data: logs, error } = await db.from('activity_logs').select('*').order('timestamp', { ascending: false });

        if (error || !logs || logs.length === 0) {
          alert('No logs to export');
          return;
        }

        // Create CSV content
        let csv = 'Timestamp,User Email,User ID,Action,Role,Details\n';

        logs.forEach(log => {
          const timestamp = log.timestamp ? new Date(log.timestamp.toDate?.() || log.timestamp).toLocaleString() : '';
          const email = log.email || '';
          const uid = log.uid || '';
          const action = log.action || '';
          const role = log.role || '';
          const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';

          csv += `"${timestamp}","${email}","${uid}","${action}","${role}","${details}"\n`;
        });

        // Download CSV file
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        customAlert('Activity logs exported successfully!');

      } catch (error) {
        console.error('Error exporting logs:', error);
        alert('Error exporting logs: ' + error.message);
      }
    }

    // 👥 Load and display user roles management
    async function loadUserRoles() {
      try {
        if (!checkPermission('admin')) return;

        const container = document.getElementById('user-roles-container');
        if (!container) return;

        container.innerHTML = '<div class="text-center text-gray-400">Loading users...</div>';

        const { data: users, error } = await db.from('users').select('*').order('email');

        if (error || !users || users.length === 0) {
          container.innerHTML = '<div class="text-center text-gray-400 py-8">No users found</div>';
          return;
        }

        let html = '<div class="overflow-y-auto max-h-96">';

        users.forEach(user => {
          const uid = user.uid;
          const email = user.email || 'Unknown';
          const currentRole = user.role || 'employee';

          html += `
        <div class="border-b border-slate-200 p-3 flex justify-between items-center hover:bg-slate-100 transition">
          <div>
            <div class="font-semibold text-slate-800">${email}</div>
            <div class="text-xs text-slate-500">${uid}</div>
          </div>
          <div class="flex gap-2 items-center">
            <select id="role-select-${uid}" onchange="updateUserRole('${uid}', this.value)" class="bg-white text-slate-800 px-3 py-1 rounded text-sm border-2 border-slate-200 hover:border-blue-400 transition">
              <option value="employee" ${currentRole === 'employee' ? 'selected' : ''}>Employee</option>
              <option value="supervisor" ${currentRole === 'supervisor' ? 'selected' : ''}>Supervisor</option>
              <option value="admin" ${currentRole === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
        </div>
      `;
        });

        html += '</div>';
        container.innerHTML = html;

      } catch (error) {
        console.error('Error loading user roles:', error);
        const container = document.getElementById('user-roles-container');
        if (container) {
          container.innerHTML = '<div class="text-red-500 py-8">Error loading users: ' + error.message + '</div>';
        }
      }
    }

    // 🔄 Update user role and log the change
    async function updateUserRole(uid, newRole) {
      try {
        if (!checkPermission('admin')) return;

        const { data: user, error } = await db.from('users').select('*').eq('uid', uid).single();
        if (error || !user) throw new Error('User not found');

        const oldRole = user.role || 'employee';
        const email = user.email || 'Unknown';

        if (oldRole === newRole) return; // No change

        // Confirm role change
        if (!confirm(`Change role of ${email} from ${oldRole} to ${newRole}?`)) {
          // Reset dropdown to old value
          document.getElementById(`role-select-${uid}`).value = oldRole;
          return;
        }

        // Update role in database
        await db.from('users').update({
          role: newRole,
          role_last_modified: new Date().toISOString()
        }).eq('uid', uid);

        // Log the role change
        await logActivity('role_updated', {
          userId: uid,
          email: email,
          oldRole: oldRole,
          newRole: newRole
        });

        customAlert(`Role updated for ${email}: ${newRole}`);

      } catch (error) {
        console.error('Error updating user role:', error);
        alert('Error updating role: ' + error.message);
      }
    }

    console.log('Auth object ready:', !!window.auth);
    console.log('Database object ready:', !!window.db);



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



window.loadActivityLogs = loadActivityLogs;
window.exportActivityLogs = exportActivityLogs;
window.loadUserRoles = loadUserRoles;
window.showSettingsPage = showSettingsPage;
