/* ==========================================================================
   RAILSAATHI - AUTHENTICATION, ROLES & SECURITY
   js/core/auth.js
   ========================================================================== */

window.safeToggleLoginModal = function (id, show) {
  if (typeof toggleLoginModal === 'function') {
    toggleLoginModal(id, show);
  } else {
    console.warn('toggleLoginModal not yet defined, retrying in 100ms...');
    setTimeout(() => window.safeToggleLoginModal(id, show), 100);
  }
};

    /* ==========================================
       INPUT VALIDATION & SANITIZATION FUNCTIONS
    =============================================== */

    // 🔒 Sanitize input to prevent XSS attacks
    function sanitizeInput(input) {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }

    // 📊 Real-time password strength indicator
    function updatePasswordStrengthIndicator() {
      const passwordField = document.getElementById('reg-password');
      const confirmField = document.getElementById('reg-confirm');
      const strengthDiv = document.getElementById('password-strength');
      const strengthText = document.getElementById('strength-text');
      const pwHint = document.getElementById('pw-hint');
      const pwMatch = document.getElementById('pw-match');
      const requirements = document.getElementById('pw-requirements');

      const password = passwordField.value;

      if (!password) {
        strengthDiv.style.display = 'none';
        pwMatch.style.display = 'none';
        if (requirements) requirements.style.display = 'none';
        return;
      }

      // Show strength indicator
      strengthDiv.style.display = 'block';
      if (requirements) requirements.style.display = 'block';

      const passwordChecks = {
        'pw-req-length': password.length >= 8,
        'pw-req-case': /[a-z]/.test(password) && /[A-Z]/.test(password),
        'pw-req-number': /[0-9]/.test(password),
        'pw-req-special': /[^A-Za-z0-9]/.test(password)
      };
      Object.entries(passwordChecks).forEach(([id, isMet]) => {
        const requirement = document.getElementById(id);
        if (!requirement) return;
        requirement.classList.toggle('is-met', isMet);
        requirement.textContent = `${isMet ? '✓' : '✗'} ${requirement.textContent.substring(2)}`;
      });

      const strengthResult = getPasswordStrengthLevel(password);
      const bars = 5;
      const filledBars = Math.ceil((strengthResult.level / 5) * bars);

      // Update strength bars
      for (let i = 1; i <= bars; i++) {
        const bar = document.getElementById('strength-bar-' + i);
        if (i <= filledBars) {
          bar.style.background = strengthResult.color;
        } else {
          bar.style.background = 'rgba(255,255,255,0.2)';
        }
      }

      // Update strength text
      strengthText.textContent = strengthResult.label;
      strengthText.style.color = strengthResult.color;

      // Check validation
      const validation = validatePasswordStrength(password);
      // Check password match
      if (confirmField.value) {
        if (password === confirmField.value) {
          pwMatch.style.display = 'block';
          pwMatch.style.color = '#10b981';
          pwMatch.textContent = '✓ Passwords match';
        } else {
          pwMatch.style.display = 'block';
          pwMatch.style.color = '#ef5350';
          pwMatch.textContent = '✗ Passwords do not match';
        }
      } else {
        pwMatch.style.display = 'none';
      }
    }

    // Add real-time validation to confirm password field
    setTimeout(() => {
      const confirmField = document.getElementById('reg-confirm');
      if (confirmField) {
        confirmField.addEventListener('input', updatePasswordStrengthIndicator);
      }
      const passwordField = document.getElementById('reg-password');
      if (passwordField) {
        passwordField.addEventListener('input', updatePasswordStrengthIndicator);
      }
    }, 500);

    // Validate email format
    function isValidEmail(email) {
      if (!email) return false;
      const clean = email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(clean) && clean.length <= 254;
    }

    // ✔️ Validate name (no special characters except spaces and hyphens)
    function isValidName(name) {
      // Only allow letters, spaces, hyphens, and allows many languages
      const nameRegex = /^[\p{L}\s\-']{2,100}$/u;
      return nameRegex.test(name);
    }

    // ✔️ Check password strength - ENHANCED
    function validatePasswordStrength(password) {
      const requirements = [
        password && password.length >= 8,
        /[a-z]/.test(password || '') && /[A-Z]/.test(password || ''),
        /[0-9]/.test(password || ''),
        /[^A-Za-z0-9]/.test(password || '')
      ];
      return requirements.every(Boolean)
        ? { valid: true, message: 'Password is valid' }
        : { valid: false, message: 'Password must meet all listed requirements' };
    }

    // ✔️ Get password strength indicator
    function getPasswordStrengthLevel(password) {
      if (!password) return { level: 0, label: 'Very Weak', color: '#ef4444' };

      let strength = 0;

      if (password.length >= 6) strength++;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

      const levels = [
        { level: 0, label: 'Very Weak', color: '#ef4444' },
        { level: 1, label: 'Weak', color: '#f97316' },
        { level: 2, label: 'Fair', color: '#eab308' },
        { level: 3, label: 'Good', color: '#3b82f6' },
        { level: 4, label: 'Strong', color: '#10b981' },
        { level: 5, label: 'Very Strong', color: '#059669' }
      ];

      return levels[Math.min(strength, 5)];
    }

    // 🔒 Prevent script injection in form fields
    function sanitizeFormInput(value, fieldType = 'text') {
      // Remove any HTML tags and dangerous characters
      let sanitized = (value || '').replace(/<[^>]*>/g, '');

      if (fieldType === 'name') {
        // Keep names readable and let validation decide whether the characters are allowed.
        sanitized = sanitized.replace(/[\u0000-\u001F\u007F]/g, '').trim();
      } else if (fieldType === 'email') {
        // Normalize email addresses before validation and auth submission.
        sanitized = normalizeEmailForAuth(sanitized);
      }

      return sanitized;
    }

    // 📋 Validate entire registration form
    function validateRegistrationForm(name, email, division, password, confirmPassword) {
      const errors = [];

      // Name validation
      if (!name || name.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
      } else if (!isValidName(name)) {
        errors.push('Name contains invalid characters. Use letters, spaces, and hyphens only');
      }

      // Email / Mobile validation
      if (!email || !isValidEmail(email)) {
        errors.push('Please enter a valid email address');
      }

      if (!division || division.trim().length < 2) {
        errors.push('Working division is required');
      }

      // Password validation
      const pwdValidation = validatePasswordStrength(password);
      if (!pwdValidation.valid) {
        errors.push(pwdValidation.message);
      }

      // Password confirmation
      if (password !== confirmPassword) {
        errors.push('Passwords do not match');
      }

      return { isValid: errors.length === 0, errors: errors };
    }

    /* ==========================================
       ADVANCED SECURITY FEATURES
       - Role-Based Access
       - Two-Factor Authentication (OTP)
       - Activity Logging
    ============================================= */

    // Global variables for security
    let otpVerified = false;
    let pendingOtpEmail = null;
    let isCreatingAccount = false;

    function normalizeEmailForAuth(value) {
      let normalized = String(value ?? '');

      try {
        normalized = normalized.normalize('NFKC');
      } catch (err) {
        // Older browsers may not support String.normalize.
      }

      return normalized.replace(/[\s\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase();
    }

    // 🔐 Initialize user role on page load
    async function initializeUserRole(user) {
      console.log('🔐 initializeUserRole called for:', user?.email);

      if (user) {
        try {
          const adminEmail = 'nandkishor24714@gmail.com';
          const isAdminUser = user.email === adminEmail;
          console.log('👤 User email:', user.email, '- Is admin email?', isAdminUser);

          // For admin user, ensure they have admin role in Supabase
          if (isAdminUser) {
            const { data: userDoc, error } = await db
              .from('users')
              .select('*')
              .eq('uid', user.id)
              .single();

            console.log('📄 Admin user document exists?', userDoc);

            if (userDoc) {
              const userData = userDoc;
              currentUserRole = userData.role || 'admin';
              console.log('📝 User data role:', userData.role, '- Set currentUserRole to:', currentUserRole);

              // If admin user doesn't have admin role set, update it
              if (userData.role !== 'admin') {
                await db
                  .from('users')
                  .update({
                    role: 'admin',
                    role_last_modified: new Date().toISOString(),
                    email: user.email
                  })
                  .eq('uid', user.id);

                currentUserRole = 'admin';
                console.log('✅ Admin role assigned to nandkishor24714@gmail.com');
              }
            } else {
              // Create admin user document if it doesn't exist
              await db
                .from('users')
                .upsert({
                  uid: user.id,
                  email: user.email,
                  role: 'admin',
                  status: 'approved',
                  created_at: new Date().toISOString(),
                  role_last_modified: new Date().toISOString()
                });

              currentUserRole = 'admin';
              console.log('✅ Admin user document created for nandkishor24714@gmail.com');
            }
          } else {
            // For non-admin users, get their role from Supabase
            const { data: userDoc, error } = await db
              .from('users')
              .select('*')
              .eq('uid', user.id)
              .single();

            if (userDoc) {
              currentUserRole = userDoc.role || 'employee';
            } else {
              currentUserRole = 'employee'; // Default role
            }
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          currentUserRole = 'employee';
        }
      }
    }

    // 🔑 Get current user role
    function getUserRole() {
      return currentUserRole || 'employee';
    }

    // 🛡️ Update admin UI elements visibility based on user role
    function updateAdminUIVisibility() {
      const isAdmin = checkPermission('admin');
      console.log('🛡️ updateAdminUIVisibility called - isAdmin:', isAdmin, '- currentUserRole:', currentUserRole);

      // Show/hide approve button if user is supervisor or admin
      const approveBtn = document.getElementById('topbar-approve-btn');
      const isSupervisor = checkPermission('supervisor');
      if (approveBtn) {
        approveBtn.style.display = (isAdmin || isSupervisor) ? 'block' : 'none';
      }
    }

    // ✅ Check if user has specific role
    function hasRole(requiredRole) {
      const userRole = getUserRole();
      if (requiredRole === 'admin') return userRole === 'admin';
      if (requiredRole === 'supervisor') return userRole === 'admin' || userRole === 'supervisor';
      return true; // employees have basic access
    }

    // 📊 ENHANCED: Log activity for audit trail - logs all security-relevant events
    async function logActivity(action, details = {}) {
      const user = window.currentUserAuth;
      if (!user) {
        console.warn('⚠️ Cannot log activity - no authenticated user');
        return;
      }

      try {
        // 🔒 Sanitize details to prevent injection
        const sanitizedDetails = {};
        for (const [key, value] of Object.entries(details)) {
          if (typeof value === 'string') {
            sanitizedDetails[key] = sanitizeInput(value);
          } else {
            sanitizedDetails[key] = value;
          }
        }

        // Get current timestamp
        const logTimestamp = new Date();

        // Capture browser/device information for security audit
        const logEntry = {
          uid: currentUserAuth?.id,
          email: currentUserAuth?.email,
          role: getUserRole(),
          action: action,
          timestamp: logTimestamp.toISOString(),
          details: sanitizedDetails,
          user_agent: navigator.userAgent,
          device_type: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
          browser: getBrowserInfo()
        };

        // Critical actions should be logged prominently
        const criticalActions = ['login', 'logout', 'create_account', 'delete_employee', 'clear_logs', 'role_change', 'employee_approval', 'failed_login'];
        if (criticalActions.includes(action)) {
          console.log('🚨 SECURITY EVENT LOGGED:', action, '- User:', sanitizeInput(currentUserAuth?.email));
          logEntry.security_event = true;
          logEntry.severity = action.includes('failed') ? 'warning' : 'info';
        }

        // Add to activity logs
        const { error } = await db
          .from('activity_logs')
          .insert([logEntry]);

        if (error) throw error;
        console.log('✅ Activity logged:', action, 'for user:', sanitizeInput(currentUserAuth?.email));

      } catch (err) {
        console.error('❌ Error logging activity:', err);
      }
    }

    // Get browser information for audit trail
    function getBrowserInfo() {
      const ua = navigator.userAgent;
      let browser = 'Unknown';

      if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') > -1) browser = 'Safari';
      else if (ua.indexOf('Edge') > -1) browser = 'Edge';
      else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';

      return browser;
    }

    // 🔐 Generate OTP (6-digit code)
    function generateOTP() {
      return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // 📧 Send OTP via email (simulated - in production use Firebase Cloud Functions)
    async function sendOTPEmail(email) {
      const otp = generateOTP();
      const expiryTime = new Date().getTime() + (5 * 60 * 1000); // 5 minutes expiry

      try {
        // Store OTP in database temporarily
        await db.from('otps').upsert({
          email: email,
          otp: otp,
          expiry: expiryTime,
          verified: false,
          createdAt: new Date().toISOString()
        });

        // In production, send via email service
        console.log(`📧 OTP for ${email}: ${otp}`);

        // For demo, show alert
        customAlert(`⚠️ Demo Mode: Your OTP is ${otp}\n\nIn production, this would be sent to your email.`);

        return true;
      } catch (err) {
        console.error('Error sending OTP:', err);
        return false;
      }
    }

    // ✔️ Verify OTP
    async function verifyOTP(email, enteredOtp) {
      try {
        const { data: otpData, error } = await db.from('otps').select('*').eq('email', email).single();

        if (error || !otpData) {
          return { success: false, message: 'OTP not found. Request a new one.' };
        }

        const currentTime = new Date().getTime();

        if (currentTime > otpData.expiry) {
          await db.from('otps').delete().eq('email', email);
          return { success: false, message: 'OTP expired. Request a new one.' };
        }

        if (otpData.otp !== enteredOtp) {
          return { success: false, message: 'Invalid OTP. Please try again.' };
        }

        // OTP verified
        await db.from('otps').delete().eq('email', email);
        otpVerified = true;
        return { success: true, message: 'OTP verified successfully!' };
      } catch (err) {
        console.error('Error verifying OTP:', err);
        return { success: false, message: 'Error verifying OTP.' };
      }
    }

    // 🎯 Check role-based permissions
    function checkPermission(requiredRole) {
      const userRole = getUserRole();
      const roleHierarchy = { 'admin': 3, 'supervisor': 2, 'employee': 1 };
      const requiredLevel = roleHierarchy[requiredRole] || 1;
      const userLevel = roleHierarchy[userRole] || 1;

      return userLevel >= requiredLevel;
    }

    // 📋 Load and display activity logs
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



    function toggleLoginModal(id, show) {
      const modal = document.getElementById(id);
      if (show) modal.classList.add('active');
      else modal.classList.remove('active');
    }

    function toggleLoginPassword() {
      const pwd = document.getElementById('login-password');
      const icon = document.getElementById('loginToggleIcon');
      if (pwd.type === 'password') {
        pwd.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        pwd.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }


    function showLoginError(msg) {
      const el = document.getElementById('login-error-msg');
      // Support both plain text and HTML
      if (msg.includes('<') && msg.includes('>')) {
        el.innerHTML = msg;
      } else {
        el.textContent = msg;
      }
      el.style.display = 'block';
    }
    function hideLoginError() {
      document.getElementById('login-error-msg').style.display = 'none';
    }

    // 🔐 Rate limiting for login attempts (per IP/email)
    var loginAttempts = window.loginAttempts || {};
    window.loginAttempts = loginAttempts;

    var passwordResetAttempts = window.passwordResetAttempts || {};
    window.passwordResetAttempts = passwordResetAttempts;

    function checkLoginAttempts(email) {
      const now = Date.now();
      const lockoutDuration = LOGIN_RATE_LIMIT.lockoutDurationMinutes * 60 * 1000;

      if (!loginAttempts[email]) {
        loginAttempts[email] = { attempts: [], locked: false, lockedUntil: 0 };
      }

      // Check if still locked
      if (loginAttempts[email].locked && now < loginAttempts[email].lockedUntil) {
        const remainingTime = Math.ceil((loginAttempts[email].lockedUntil - now) / 60000);
        return {
          allowed: false,
          reason: `⛔ Account temporarily locked. Try again in ${remainingTime} minute(s).`
        };
      }

      // Reset lock if duration passed
      if (loginAttempts[email].locked && now >= loginAttempts[email].lockedUntil) {
        loginAttempts[email].locked = false;
        loginAttempts[email].attempts = [];
      }

      return { allowed: true };
    }

    function recordFailedLoginAttempt(email) {
      const now = Date.now();
      const lockoutDuration = LOGIN_RATE_LIMIT.lockoutDurationMinutes * 60 * 1000;

      if (!loginAttempts[email]) {
        loginAttempts[email] = { attempts: [], locked: false, lockedUntil: 0 };
      }

      loginAttempts[email].attempts.push(now);

      if (loginAttempts[email].attempts.length >= LOGIN_RATE_LIMIT.maxAttempts) {
        loginAttempts[email].locked = true;
        loginAttempts[email].lockedUntil = now + lockoutDuration;
        console.warn('🚨 Login attempts exceeded for:', sanitizeInput(email));
      }
    }

    function resetLoginAttempts(email) {
      if (loginAttempts[email]) {
        loginAttempts[email].attempts = [];
        loginAttempts[email].locked = false;
      }
    }

    // 🔐 Rate limiting for password reset (track attempts per email)



    function sendPasswordReset() {
      const emailInput = document.getElementById('forgot-email').value.trim();

      // 🔒 Validate email format
      if (!emailInput || !isValidEmail(emailInput)) {
        customAlert('⚠️ Please enter a valid email address.');
        return;
      }

      const email = emailInput.toLowerCase();
      const now = Date.now();

      // 🔐 SECURITY: Rate limiting for password reset
      if (!passwordResetAttempts[email]) {
        passwordResetAttempts[email] = [];
      }

      // Remove old attempts outside the time window
      const timeWindow = PASSWORD_RESET_RATE_LIMIT.timeWindowMinutes * 60 * 1000;
      passwordResetAttempts[email] = passwordResetAttempts[email].filter(time => now - time < timeWindow);

      // Check if limit exceeded
      if (passwordResetAttempts[email].length >= PASSWORD_RESET_RATE_LIMIT.maxAttempts) {
        const remainingTime = Math.ceil((timeWindow - (now - passwordResetAttempts[email][0])) / 60000);
        customAlert(`⛔ Too many password reset requests. Please wait ${remainingTime} minute(s) before trying again.`);
        return;
      }

      // Add this attempt
      passwordResetAttempts[email].push(now);

      // 📝 Log password reset attempt
      console.log('🔑 Password reset requested for:', sanitizeInput(email));

      window.auth.resetPasswordForEmail(email)
        .then(() => {
          customAlert('✅ Password reset email sent!\n\nCheck your inbox (and spam folder) for the reset link.\n\n⏱️ The link will expire in 1 hour.');
          toggleLoginModal('forgotLoginModal', false);
        })
        .catch(err => {
          console.error('❌ Password reset error:', err.code);
          let msg = 'Error sending password reset email.';
          if (err.code === 'auth/user-not-found') {
            // For security, don't reveal if email exists
            msg = '✅ If this email is registered, you will receive a password reset link.';
          } else if (err.code === 'auth/invalid-email') {
            msg = 'Invalid email address format.';
          } else if (err.code === 'auth/too-many-requests') {
            msg = 'Too many attempts. Please try again later.';
          }
          customAlert(msg);
        });
    }

    // 🔄 Clear all browser caches and storage
    async function clearAllCaches() {
      try {
        // Preserve Supabase's persisted session when clearing app storage. The
        // login flow calls this immediately after sign-in, so removing this key
        // leaves the in-memory UI signed in while database requests get 401s.
        const supabaseAuthStorageKey = 'supabase.auth.token';
        const supabaseAuthSession = localStorage.getItem(supabaseAuthStorageKey);

        // Clear local app state without discarding the active Supabase session.
        localStorage.clear();
        if (supabaseAuthSession !== null) {
          localStorage.setItem(supabaseAuthStorageKey, supabaseAuthSession);
        }
        console.log('✅ LocalStorage cleared; Supabase session preserved');

        // Clear sessionStorage
        sessionStorage.clear();
        console.log('✅ SessionStorage cleared');

        // Clear IndexedDB
        const dbs = await indexedDB.databases();
        for (let db of dbs) {
          indexedDB.deleteDatabase(db.name);
        }
        console.log('✅ IndexedDB cleared');

        // Clear service worker caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (let cacheName of cacheNames) {
            await caches.delete(cacheName);
          }
          console.log('✅ Service worker caches cleared');
        }

        console.log('🧹 All caches cleared successfully');
      } catch (error) {
        console.error('⚠️ Error clearing caches:', error);
      }
    }

    function updateSidebarUserDisplay(name, phone) {
      const rawMetadataName = window.currentUserAuth?.user_metadata?.full_name || window.currentUserAuth?.user_metadata?.name || '';
      const metadataName = String(rawMetadataName).trim();
      const validMetadataName = metadataName && !/^not\s+set$/i.test(metadataName) ? metadataName : '';
      const suppliedName = String(name || '').trim();
      const displayName = suppliedName && !/^not\s+set$/i.test(suppliedName)
        ? suppliedName
        : (validMetadataName || 'Railway Employee');
      window.currentEmployeeName = displayName;
      if (typeof window.syncTaLockedName === 'function') window.syncTaLockedName();
       if (typeof window.updateHomeWelcomeTitle === 'function') window.updateHomeWelcomeTitle();
      const initials = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n.charAt(0)).join('').toUpperCase();
      const avatarEl = document.getElementById('sidebar-user-avatar');
      const nameEl = document.getElementById('sidebar-user-name');
      const emailEl = document.getElementById('sidebar-user-email');

      if (avatarEl) avatarEl.textContent = initials || 'RE';
      if (nameEl) nameEl.textContent = displayName;
      if (emailEl) emailEl.textContent = phone ? `+91 ${phone}` : 'Active Session';
    }

    window.updateSidebarUserDisplay = updateSidebarUserDisplay;

    // Initialize form listeners when DOM is ready
    function setupAuthFormListeners() {
      console.log('Setting up auth form listeners...');

      const loginForm = document.getElementById('loginForm');
      const createForm = document.getElementById('createAccountForm');

      console.log('Found loginForm:', !!loginForm);
      console.log('Found createForm:', !!createForm);

      if (!loginForm || !createForm) {
        console.error('❌ Auth forms not found in DOM');
        return;
      }

      // LOGIN FORM - using addEventListener for reliability
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        console.log('LOGIN FORM SUBMITTED');
        hideLoginError();

        const rawInput = document.getElementById('login-email').value.trim();
        const email = rawInput.toLowerCase();

        const password = document.getElementById('login-password').value;
        const btnText = document.getElementById('loginBtnText');
        const loader = document.getElementById('loginLoader');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Validate email format
        if (!rawInput || !isValidEmail(rawInput)) {
          showLoginError('Please enter a valid email address.');
          return;
        }

        if (!password) {
          showLoginError('Please enter your password.');
          return;
        }

        // 🔐 SECURITY: Check rate limiting
        const rateCheckResult = checkLoginAttempts(email);
        if (!rateCheckResult.allowed) {
          showLoginError(rateCheckResult.reason);
          return;
        }

        if (!window.auth) {
          showLoginError('Authentication service not ready. Please refresh the page.');
          return;
        }

        submitBtn.disabled = true;
        btnText.textContent = 'VERIFYING...';
        loader.style.display = 'block';

        console.log('🔐 Attempting login with:', sanitizeInput(email));

        try {
          const { data, error } = await window.auth.signInWithPassword({ email, password });

          if (error) throw error;
          const userCredential = data.user;
          console.log('✅ LOGIN SUCCESSFUL:', userCredential.id);

          // 🔐 Reset login attempts on successful login
          resetLoginAttempts(email);

          const adminEmail = 'nandkishor24714@gmail.com';

          // Initialize user role
          window.currentUserAuth = userCredential;
          await initializeUserRole(userCredential);
          console.log('🔑 User role initialized:', window.currentUserRole);
          // Log login activity
          await logActivity('login', { method: 'email_password' });

          // Check if user is admin or has admin role
          if (email === adminEmail || checkPermission('admin')) {
            console.log('✅ Admin user detected - allowing access');
            console.log('🔐 Admin permission check passed:', checkPermission('admin'));

            // 🧹 Clear caches on successful admin login
            await clearAllCaches();

            btnText.textContent = 'SIGN IN';
            loader.style.display = 'none';
            submitBtn.disabled = false;

            // Update UI visibility before dismissing login screen
            updateAdminUIVisibility();
            updateSidebarForAdmin(userCredential);

            // Pre-load admin data in background
            setTimeout(() => {
              console.log('📋 Pre-loading admin data...');
              loadAdminUsers('pending');
              loadDataFromDB();
            }, 100);

            dismissLoginScreen();
          } else {
            // For non-admin users, allow them to login
            console.log('✅ User is logged in - allowing access');

            // 🧹 Clear caches on successful login
            await clearAllCaches();

            btnText.textContent = 'SIGN IN';
            loader.style.display = 'none';
            submitBtn.disabled = false;

            // Update UI visibility for non-admin users
            updateAdminUIVisibility();
            updateSidebarForAdmin(userCredential);

            // Pre-load user data in background
            setTimeout(() => {
              loadDataFromDB();
            }, 100);

            dismissLoginScreen();
          }
        } catch (err) {
          console.error('❌ LOGIN ERROR:', err.code, err.message);

          // 🔐 SECURITY: Record failed login attempt
          recordFailedLoginAttempt(email);

          btnText.textContent = 'SIGN IN';
          loader.style.display = 'none';
          submitBtn.disabled = false;

          let msg = '❌ Login failed. Please check your credentials.';
          if (err.code === 'auth/user-not-found') msg = '⚠️ No account found with this email. Please create an account first.';
          else if (err.code === 'auth/wrong-password') msg = '⚠️ Incorrect password. Please try again.';
          else if (err.code === 'auth/invalid-email') msg = '⚠️ Invalid email address format.';
          else if (err.code === 'auth/too-many-requests') msg = '⛔ Too many failed attempts. Please try again later.';
          else if (err.code === 'auth/invalid-credential') msg = '❌ Invalid credentials. Check email and password.';
          else if (err.code === 'auth/user-disabled') msg = '⛔ This account has been disabled. Contact admin.';

          showLoginError(msg);
        }
      });

      // CREATE ACCOUNT FORM - using addEventListener for reliability
      createForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (isCreatingAccount) {
          return;
        }

        const nameInput = document.getElementById('reg-name').value.trim();
        const emailInput = document.getElementById('reg-email').value.trim();
        const divisionInput = document.getElementById('reg-division').value.trim();
        const passwordInput = document.getElementById('reg-password').value;
        const confirmInput = document.getElementById('reg-confirm').value;
        const errEl = document.getElementById('reg-error-msg');
        const submitBtn = createForm.querySelector('button[type="submit"]');

        errEl.style.display = 'none';

        // 🔒 SECURITY: Sanitize inputs to prevent XSS
        const name = sanitizeFormInput(nameInput, 'name');
        const email = sanitizeFormInput(emailInput, 'email');
        const division = sanitizeFormInput(divisionInput, 'text').trim();
        const password = passwordInput; // Don't sanitize password
        const confirm = confirmInput;

        // 📋 ENHANCED VALIDATION using new validation functions
        const validationResult = validateRegistrationForm(name, email, division, password, confirm);

        if (!validationResult.isValid) {
          const errorMessage = validationResult.errors.join('\n• ');
          errEl.innerHTML = '<strong>⚠️ Validation Errors:</strong><br>• ' + errorMessage;
          errEl.style.display = 'block';
          return;
        }

        // 🔐 Log registration attempt
        console.log('📝 Registration attempt - Email:', email);

        // Disable button and show loading
        isCreatingAccount = true;
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'CREATING...';

        try {
          // 🔹 STEP 1: Create user in Supabase Auth with validated password
          console.log('👤 Creating account for:', sanitizeInput(email));
          const { data: authData, error: signUpError } = await window.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                full_name: name,
                working_division: division
              }
            }
          });

          if (signUpError || !authData?.user) throw signUpError || new Error('Failed to create auth user');
          const user = authData.user;

          // The database trigger creates the public.users row from this Auth metadata.
          console.log('✅ Auth account created. UID:', user.id);

          // Create the optional employee record when the current session permits it.
          try {
            if (authData.session) {
              await window.db.from('employees').upsert({
                email: email.toLowerCase(),
                status: 'approved'
              });
            }
          } catch (e) {
            console.warn('⚠️ Employee table sync skipped (non-critical):', e);
          }

          console.log('✅ ADMIN NOTIFIED - USER READY FOR APPROVAL');

          // 🔹 STEP 4: Email verification handled by Supabase
          console.log('📧 Supabase will handle email verification if configured');

          // 🔹 SUCCESS: Account creation complete
          console.log('✅ ACCOUNT FULLY CREATED AND ACTIVE');
          createForm.reset();
          errEl.style.display = 'none';

          // Show success message with clear instructions
          setTimeout(async () => {
            const successMsg = document.getElementById('login-error-msg');
            successMsg.innerHTML = `
            <div style="text-align: center;">
              <div style="font-size: 13px; margin-bottom: 8px;">✅ Account Created Successfully!</div>
              <div style="font-size: 11px; line-height: 1.5;">
                <strong>Your account is now active and ready to use.</strong><br><br>
                Please login with your credentials below.
              </div>
            </div>
          `;
            successMsg.style.display = 'block';
            successMsg.style.background = 'rgba(34, 197, 94, 0.15)';
            successMsg.style.borderColor = 'rgba(34, 197, 94, 0.4)';
            successMsg.style.color = '#22c55e';
            successMsg.style.padding = '20px';

            // Close the signup modal
            toggleLoginModal('createLoginModal', false);

            // Auto-fill email for convenience
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = '';
            document.getElementById('login-password').focus();

            // Auto-dismiss message after 5 seconds
            setTimeout(() => {
              successMsg.style.display = 'none';
            }, 5000);

            console.log('✅ REGISTRATION COMPLETE - Ready for login');
          }, 300);

        } catch (error) {
          console.error('❌ ERROR:', error.code, error.message);

          // Keep the modal open so the user can correct the input without restarting.
          toggleLoginModal('createLoginModal', true);

          let msg = error.message;
          if (error.code === 'user_already_exists' || error.code === 'auth/email-already-in-use' || error.message?.includes('already registered')) msg = 'This email is already registered. Please login or use a different email.';
          else if (error.code === 'weak_password' || error.code === 'auth/weak-password') msg = 'Password is too weak. Use at least 6 characters.';
          else if (error.code === 'invalid_email' || error.code === 'auth/invalid-email' || error.code === 'email_address_invalid') msg = 'Invalid email address format. Remove spaces or hidden characters and try again.';
          else if (error.code === 'auth/operation-not-allowed') msg = 'Account creation is not enabled. Please contact admin.';
          else if (error.code === 'over_email_send_rate_limit' || error.message?.includes('429')) msg = '⏳ Too many registration attempts. Please wait 15-60 minutes before trying again.';
          else if (error.message?.includes('Error sending confirmation email') || error.error_code === 'unexpected_failure' || error.message?.includes('confirmation email')) msg = '⚠️ Email confirmation limit reached. In Supabase Dashboard -> Authentication -> Providers -> Email, please disable "Confirm email" or set up custom SMTP.';
          else if (error.code === 'permission-denied' || error.message?.includes('row-level security')) msg = 'Database configuration error. Please contact admin. (RLS Policy Issue)';
          else if (error.message?.includes('violates row-level security policy')) msg = 'Database configuration error. Please contact admin to enable account registration.';
          else if (msg && msg.length > 100) msg = 'Error: ' + msg.substring(0, 80) + '...';

          errEl.textContent = msg;
          errEl.style.display = 'block';
        } finally {
          isCreatingAccount = false;
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });

      console.log('✅ Auth forms initialized successfully');
    }

    // Original login code (kept for backward compatibility)

    function dismissLoginScreen() {
      const loginScreen = document.getElementById('login-screen');
      window.hideMarketingLanding?.();
      loginScreen.style.transition = 'opacity 0.3s ease-out';
      loginScreen.style.opacity = '0';
      loginScreen.style.pointerEvents = 'none';
      setTimeout(() => {
        loginScreen.style.display = 'none';
        startMainApp();
      }, 300);
    }

    function handleLogout() {
      document.getElementById('logout-modal-overlay').style.display = 'flex';
    }

    function closeLogoutModal() {
      document.getElementById('logout-modal-overlay').style.display = 'none';
    }

    async function confirmLogout() {
      const currentUser = window.currentUserAuth;
      const uid = currentUser ? currentUser.id : null;

      // Track logout activity
      if (uid) {
        const deviceInfo = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(deviceInfo);
        const device = isMobile ? 'Mobile' : 'Desktop';

        try {
          await db.from('activity_logs').insert({
            uid: uid,
            action: 'logout',
            timestamp: new Date().toISOString(),
            device_type: device
          });
        } catch (err) {
          console.error('Error logging activity:', err);
        }
      }

      try {
        localStorage.removeItem('railsaathi_auth_user');
      } catch (e) {}

      window.auth.signOut().then(async () => {
        // 🧹 Clear caches on logout
        await clearAllCaches();

        closeLogoutModal();
        // Reset main app flag
        window.mainAppStarted = false;

        // Show login screen again
        const loginScreen = document.getElementById('login-screen');
        loginScreen.style.display = 'flex';
        loginScreen.style.opacity = '1';
        loginScreen.style.pointerEvents = '';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        hideLoginError();

        // Hide main app completely
        document.getElementById('main-wrapper').style.display = 'none';
        document.getElementById('top-nav').style.display = 'none';
        document.getElementById('main-footer').style.display = 'none';
        document.getElementById('bg-image').style.display = 'none';
        document.getElementById('preview-section').style.display = 'none';
        document.getElementById('attendance-preview-section').style.display = 'none';
        document.getElementById('ta-preview-section').style.display = 'none';

        const homeEl = document.getElementById('home-section');
        if (homeEl) homeEl.style.display = 'none';

        const introSplash = document.getElementById('intro-splash');
        if (introSplash) introSplash.style.display = 'none';

        window.navigatePreAuthSurface?.('login');

        console.log('User logged out successfully');
      }).catch(err => {
        console.error('Logout error:', err);
        closeLogoutModal();
        customAlert('Logout failed: ' + err.message);
      });
    }



    // ── Permission Check Helper ──
    function isAdminUser() {
      const currentUser = window.currentUserAuth;
      // Support both email-based (backward compatibility) and role-based admin check
      const isEmailAdmin = currentUser && currentUser.email === 'nandkishor24714@gmail.com';
      const isRoleAdmin = typeof checkPermission === 'function' ? checkPermission('admin') : false;
      return isEmailAdmin || isRoleAdmin;
    }

    window.isAdminUser = isAdminUser;
    window.setupAuthFormListeners = setupAuthFormListeners;
