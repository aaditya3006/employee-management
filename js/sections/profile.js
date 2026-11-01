/* ==========================================================================
   RAILSAATHI - USER PROFILE & ACCOUNT CREDENTIALS
   js/sections/profile.js
   ========================================================================== */

    // ===== PROFILE SECTION =====
    let userProfileData = {};

    async function loadProfileData() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          console.warn('No authenticated user found');
          return;
        }

        // Fetch user profile from database
        const { data: profileData, error } = await db.from('users').select('*').eq('uid', user.id).single();
        const rawMetadataName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const metadataName = String(rawMetadataName).trim();
        const validMetadataName = metadataName && !/^not\s+set$/i.test(metadataName) ? metadataName : '';

        if (!error && profileData) {
          userProfileData = profileData;
        } else {
          // Use the name supplied with the authenticated account when no profile row exists.
          userProfileData = {
            name: validMetadataName || 'Railway Employee',
            email: user.email,
            pfNumber: 'Not Set',
            designation: 'Not Set',
            department: 'ENGINEERING',
            division: 'RGD–TIA',
            station: 'NES',
            doi: 'Not Set'
          };
        }

        // Display profile data
        const userEmail = userProfileData.email || user.email;
        const profileName = [
          userProfileData.name,
          userProfileData.full_name,
          userProfileData.employee_name,
          [userProfileData.first_name, userProfileData.last_name].filter(Boolean).join(' ')
        ].map(value => String(value || '').trim()).find(value => value && !/^not\s+set$/i.test(value));
        const userName = profileName || validMetadataName || 'Railway Employee';
        window.currentEmployeeName = userName;
        if (typeof window.syncTaLockedName === 'function') window.syncTaLockedName();
       if (typeof window.updateHomeWelcomeTitle === 'function') window.updateHomeWelcomeTitle();

        // Update profile section if it exists
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        if (profileNameEl) profileNameEl.value = userName;
        if (profileEmailEl) profileEmailEl.value = userEmail;

        const profilePfEl = document.getElementById('profile-pf');
        const profileDesigEl = document.getElementById('profile-designation');
        const profileDeptEl = document.getElementById('profile-department');
        const profileDivEl = document.getElementById('profile-division');
        const profileStnEl = document.getElementById('profile-station');
        const profileDoiEl = document.getElementById('profile-doi');

        if (profilePfEl) profilePfEl.value = userProfileData.pfNumber || 'Not Set';
        if (profileDesigEl) profileDesigEl.value = userProfileData.designation || 'Not Set';
        if (profileDeptEl) profileDeptEl.value = userProfileData.department || 'ENGINEERING';
        if (profileDivEl) profileDivEl.value = userProfileData.division || 'RGD–TIA';
        if (profileStnEl) profileStnEl.value = userProfileData.station || 'NES';
        if (profileDoiEl) profileDoiEl.value = userProfileData.doi || 'Not Set';

        // Update email in header
        const profileHeaderEl = document.getElementById('profile-email-header');
        if (profileHeaderEl) profileHeaderEl.textContent = userEmail;

        // Update sidebar user info
        const initials = userName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(n => n.charAt(0)).join('').toUpperCase();
        const avatarEl = document.getElementById('sidebar-user-avatar');
        const nameEl = document.getElementById('sidebar-user-name');
        const emailEl = document.getElementById('sidebar-user-email');

        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = userName;
        if (emailEl) emailEl.textContent = userEmail;

        console.log('Profile data loaded successfully');
      } catch (error) {
        console.error('Error loading profile:', error);
        // Only show alert if we're actively viewing the profile section
        if (document.getElementById('profile-section') && document.getElementById('profile-section').style.display !== 'none') {
          customAlert('Failed to load profile details');
        }
      }
    }

    function handleEditProfile() {
      customAlert('Edit profile functionality coming soon!');
    }

    function uploadProfilePhoto() {
      customAlert('Photo upload functionality coming soon!');
    }



    // ===== MODAL FUNCTIONS =====
    function openChangePasswordModal() {
      document.getElementById('change-password-modal').style.display = 'flex';
    }

    function closeChangePasswordModal() {
      document.getElementById('change-password-modal').style.display = 'none';
      document.getElementById('current-password').value = '';
      document.getElementById('new-password').value = '';
      document.getElementById('confirm-password').value = '';
    }

    async function submitChangePassword() {
      try {
        const currentPass = document.getElementById('current-password').value;
        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (!currentPass || !newPass || !confirmPass) {
          customAlert('Please fill all fields');
          return;
        }

        if (newPass !== confirmPass) {
          customAlert('New passwords do not match');
          return;
        }

        if (newPass.length < 6) {
          customAlert('Password must be at least 6 characters');
          return;
        }

        if (currentPass === newPass) {
          customAlert('New password must be different from current password');
          return;
        }

        const user = window.currentUserAuth;
        if (!user) {
          customAlert('User not logged in');
          return;
        }

        // Re-authenticate user with current password (Supabase method)
        const { error: authError } = await window.auth.signInWithPassword(user.email, currentPass);
        if (authError) throw authError;

        // Update password
        const { error: updateError } = await window.auth.updateUser({ password: newPass });
        if (updateError) throw updateError;

        // Log the password change
        await logActivity('password_changed', {
          email: user.email
        });

        showToast('✅ Password changed successfully!');
        closeChangePasswordModal();
      } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
          customAlert('Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
          customAlert('Password is too weak');
        } else {
          customAlert('Error: ' + (error.message || 'Failed to change password'));
        }
      }
    }

    async function openUpdateEmailPhone() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          customAlert('User not logged in');
          return;
        }

        // Load current user data from database
        const { data: userData, error } = await db.from('users').select('*').eq('uid', user.id).single();
        if (!error && userData) {
          const email = userData.email || user.email;
          const phone = userData.phone || '';

          document.getElementById('update-email').value = email;
          document.getElementById('update-phone').value = phone;
        } else {
          document.getElementById('update-email').value = user.email;
          document.getElementById('update-phone').value = '';
        }

        document.getElementById('update-contact-modal').style.display = 'flex';
      } catch (error) {
        console.error('Error opening update contact modal:', error);
        customAlert('Error loading contact information');
      }
    }

    function closeUpdateContactModal() {
      document.getElementById('update-contact-modal').style.display = 'none';
      document.getElementById('update-email').value = '';
      document.getElementById('update-phone').value = '';
    }

    async function submitUpdateContact() {
      try {
        const email = document.getElementById('update-email').value.trim();
        const phone = document.getElementById('update-phone').value.trim();

        if (!email || !phone) {
          customAlert('Please fill all fields');
          return;
        }

        if (phone.length !== 10 || !/^\d{10}$/.test(phone)) {
          customAlert('Please enter a valid 10-digit phone number');
          return;
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          customAlert('Please enter a valid email address');
          return;
        }

        const user = window.currentUserAuth;
        if (!user) {
          customAlert('User not logged in');
          return;
        }

        // Check if new email is different
        const newEmail = email !== user.email;

        if (newEmail) {
          // Update email in Supabase Auth
          const { error: emailError } = await window.auth.updateUser({ email: email });
          if (emailError) throw emailError;

          // Log the email change
          await logActivity('email_updated', {
            oldEmail: user.email,
            newEmail: email
          });
        }

        // Update in database
        const updateData = {
          email: email,
          phone: phone,
          updatedAt: new Date().toISOString()
        };

        await db.from('users').update(updateData).eq('uid', user.id);

        // Update local profile data
        userProfileData.email = email;
        userProfileData.phone = phone;

        // Log phone change if different
        const { data: oldData } = await db.from('users').select('phone').eq('uid', user.id).single();
        const oldPhone = oldData?.phone;
        if (oldPhone && oldPhone !== phone) {
          await logActivity('phone_updated', {
            oldPhone: oldPhone,
            newPhone: phone
          });
        }

        showToast('✅ Contact information updated successfully!');
        closeUpdateContactModal();

      } catch (error) {
        console.error('Error updating contact:', error);
        if (error.code === 'auth/email-already-in-use' || error.code === 'user_already_exists') {
          customAlert('Email is already in use by another account');
        } else {
          customAlert('Error: ' + (error.message || 'Failed to update contact'));
        }
      }
    }

    async function logoutAllDevices() {
      try {
        const user = window.currentUserAuth;
        if (!user) {
          customAlert('No user logged in');
          return;
        }

        if (confirm('This will logout from all devices. Continue?')) {
          // Log the logout event
          await logActivity('logout_all_devices', {
            email: user.email
          });

          // Sign out from Firebase
          await window.auth.signOut();

          customAlert('✅ Logged out from all devices');

          // Redirect to login
          setTimeout(() => {
            location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error logging out:', error);
        customAlert('Error during logout: ' + error.message);
      }
    }

window.userProfileData = userProfileData;
window.loadProfileData = loadProfileData;
window.handleEditProfile = handleEditProfile;
window.uploadProfilePhoto = uploadProfilePhoto;
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.submitChangePassword = submitChangePassword;
window.openUpdateEmailPhone = openUpdateEmailPhone;
window.closeUpdateContactModal = closeUpdateContactModal;
window.submitUpdateContact = submitUpdateContact;
