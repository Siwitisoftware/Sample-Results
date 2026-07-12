// ============================================
// STAFF MANAGEMENT
// ============================================

/**
 * Register a staff member
 */
function registerStaffMember() {
  const name = document.getElementById('staffName').value.trim();
  const email = document.getElementById('staffEmailRegister').value.trim();
  const password = document.getElementById('staffPasswordRegister').value;
  
  if (!name || !email || !password) {
    Notiflix.Notify.warning('Tafadhali jaza jina, barua pepe na nenosiri', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    Notiflix.Notify.warning('Tafadhali weka barua pepe sahihi', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const passwordCheck = validateStaffPassword(password);
  if (!passwordCheck.valid) {
    Notiflix.Notify.warning(passwordCheck.message, {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const registerBtn = document.getElementById('registerStaffBtn');
  let originalHTML = '';
  
  if (registerBtn) {
    originalHTML = registerBtn.innerHTML;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inasajili...';
    registerBtn.disabled = true;
  }
  
  const data = {
    action: 'registerStaff',
    dbId: currentDbId,
    name: name,
    email: email,
    password: password
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    // Update cache optimistically
    const staffCache = getCachedStaff();
    staffCache.push({ name: name, email: email, password: '********' });
    setCachedStaff(staffCache);
    
    if (registerBtn) {
      registerBtn.innerHTML = originalHTML;
      registerBtn.disabled = false;
    }
    
    Notiflix.Notify.success('Staff amesajiliwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    
    document.getElementById('staffName').value = '';
    document.getElementById('staffEmailRegister').value = '';
    document.getElementById('staffPasswordRegister').value = '';
    loadStaffMembers();
    return;
  }
  
  apiRequest(data)
    .then(response => {
      if (registerBtn) {
        registerBtn.innerHTML = originalHTML;
        registerBtn.disabled = false;
      }
      
      if (response.status === 'success') {
        const staffCache = getCachedStaff();
        staffCache.push({ name: name, email: email, password: '********' });
        setCachedStaff(staffCache);
        
        Notiflix.Notify.success('Staff amesajiliwa kikamilifu', {
          timeout: 2000,
          position: 'right-top'
        });
        
        document.getElementById('staffName').value = '';
        document.getElementById('staffEmailRegister').value = '';
        document.getElementById('staffPasswordRegister').value = '';
        loadStaffMembers();
      } else {
        Notiflix.Notify.failure(response.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      if (registerBtn) {
        registerBtn.innerHTML = originalHTML;
        registerBtn.disabled = false;
      }
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
    });
}

/**
 * Load staff members
 */
function loadStaffMembers() {
  const tableBody = document.getElementById('staffTable').getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  
  // Load from cache immediately
  const cachedStaff = getCachedStaff();
  if (cachedStaff.length > 0) {
    displayStaffMembers(cachedStaff);
  } else {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-users-slash"></i></div>
            <h4>Hakuna Staff</h4>
            <p>Hakuna staff waliosajiliwa kwenye mfumo</p>
          </div>
        </td>
      </tr>
    `;
  }
  
  if (!currentDbId) return;
  
  // Sync from server if online
  if (isOnline()) {
    apiRequest({
      action: 'listStaff',
      dbId: currentDbId
    })
    .then(response => {
      if (response.status === 'success') {
        const staffWithMaskedPassword = response.staff.map(s => ({
          ...s,
          password: '********'
        }));
        setCachedStaff(staffWithMaskedPassword);
        
        // Check if data changed
        const currentEmails = getCurrentStaffEmails();
        const newEmails = staffWithMaskedPassword.map(s => s.email);
        if (JSON.stringify(currentEmails) !== JSON.stringify(newEmails)) {
          displayStaffMembers(staffWithMaskedPassword);
        }
      }
    })
    .catch(error => {
      console.log('Background sync failed for staff:', error);
    });
  }
}

/**
 * Get current staff emails from table
 * @returns {Array} Staff emails
 */
function getCurrentStaffEmails() {
  const tableBody = document.getElementById('staffTable').getElementsByTagName('tbody')[0];
  if (!tableBody) return [];
  
  const emails = [];
  for (let i = 0; i < tableBody.rows.length; i++) {
    const row = tableBody.rows[i];
    if (row.cells[1] && !row.cells[1].innerHTML.includes('Hakuna')) {
      const email = row.cells[1].textContent.trim();
      if (email) emails.push(email);
    }
  }
  return emails;
}

/**
 * Display staff members
 * @param {Array} staff - Staff array
 */
function displayStaffMembers(staff) {
  const tableBody = document.getElementById('staffTable').getElementsByTagName('tbody')[0];
  if (!tableBody) return;
  
  if (!staff || staff.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 60px;">
          <div style="font-size: 48px; margin-bottom: 15px;">👥</div>
          <p>Hakuna staff waliosajiliwa</p>
          <p style="font-size: 12px; color: #666;">Bonyeza "Sajili Staff" kuongeza staff mpya</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // Use Set to prevent duplicates
  const uniqueStaff = [];
  const seenEmails = new Set();
  
  for (const s of staff) {
    if (s.email && !seenEmails.has(s.email)) {
      seenEmails.add(s.email);
      uniqueStaff.push(s);
    }
  }
  
  let html = '';
  
  uniqueStaff.forEach((staffMember, index) => {
    const escapedName = escapeHtml(staffMember.name);
    const escapedEmail = escapeHtml(staffMember.email);
    const encodedEmail = encodeURIComponent(staffMember.email);
    const encodedName = encodeURIComponent(staffMember.name);
    
    html += `
      <tr>
        <td style="padding: 12px;">
          <strong>${escapedName}</strong>
        </td>
        <td style="padding: 12px;">
          ${escapedEmail}
        </td>
        <td style="padding: 12px;">
          <span style="font-family: monospace; color: #666;">••••••••</span>
          <small style="display: block; color: #4caf50; font-size: 10px;">
            <i class="fas fa-shield-alt"></i> Imelindwa
          </small>
        </td>
        <td style="padding: 12px; text-align: center;">
          <button class="btn-action btn-edit" data-email="${encodedEmail}" data-name="${encodedName}" data-action="edit">
            <i class="fas fa-edit"></i> Hariri
          </button>
          <button class="btn-action btn-delete" data-email="${encodedEmail}" data-action="delete">
            <i class="fas fa-trash-alt"></i> Futa
          </button>
        </td>
      </tr>
    `;
  });
  
  tableBody.innerHTML = html;
  attachStaffButtonListeners();
}

/**
 * Attach staff button listeners
 */
function attachStaffButtonListeners() {
  // Edit buttons
  document.querySelectorAll('#staffTable .btn-edit').forEach(button => {
    button.removeEventListener('click', handleStaffEdit);
    button.addEventListener('click', handleStaffEdit);
  });
  
  // Delete buttons
  document.querySelectorAll('#staffTable .btn-delete').forEach(button => {
    button.removeEventListener('click', handleStaffDelete);
    button.addEventListener('click', handleStaffDelete);
  });
}

/**
 * Handle staff edit
 * @param {Event} event - Click event
 */
function handleStaffEdit(event) {
  const button = event.currentTarget;
  const encodedEmail = button.getAttribute('data-email');
  const encodedName = button.getAttribute('data-name');
  
  const email = decodeURIComponent(encodedEmail);
  const name = decodeURIComponent(encodedName);
  
  editStaffMember(email, name);
}

/**
 * Handle staff delete
 * @param {Event} event - Click event
 */
function handleStaffDelete(event) {
  const button = event.currentTarget;
  const encodedEmail = button.getAttribute('data-email');
  const email = decodeURIComponent(encodedEmail);
  
  deleteStaffMember(email);
}

/**
 * Edit staff member
 * @param {string} email - Staff email
 * @param {string} name - Staff name
 */
function editStaffMember(email, name) {
  Swal.fire({
    title: 'Hariri Staff Member',
    html: `
      <div class="input-group" style="margin-bottom: 15px;">
        <label for="editStaffName" style="display: block; margin-bottom: 5px; font-weight: 500;">Jina la Staff</label>
        <input type="text" id="editStaffName" value="${escapeHtml(name)}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
      </div>
      <div class="input-group" style="margin-bottom: 15px;">
        <label for="editStaffEmail" style="display: block; margin-bottom: 5px; font-weight: 500;">Barua Pepe</label>
        <input type="email" id="editStaffEmail" value="${escapeHtml(email)}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
      </div>
      <div class="input-group" style="margin-bottom: 15px;">
        <label for="editStaffPassword" style="display: block; margin-bottom: 5px; font-weight: 500;">Nenosiri Jipya</label>
        <input type="password" id="editStaffPassword" placeholder="Acha wazi kama hutaki kubadilisha" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
        <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
          <i class="fas fa-info-circle"></i> Acha wazi kama hutaki kubadilisha nenosiri
        </small>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-save"></i> Hifadhi',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    preConfirm: () => {
      const newName = document.getElementById('editStaffName').value.trim();
      const newEmail = document.getElementById('editStaffEmail').value.trim();
      const newPassword = document.getElementById('editStaffPassword').value;
      
      if (!newName || !newEmail) {
        Swal.showValidationMessage('Jina na barua pepe ni lazima');
        return false;
      }
      
      return { newName, newEmail, newPassword };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { newName, newEmail, newPassword } = result.value;
      
      Swal.fire({
        title: 'Inahifadhi...',
        text: 'Tafadhali subiri',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      
      const data = {
        action: 'editStaff',
        dbId: currentDbId,
        oldEmail: email,
        name: newName,
        email: newEmail,
        password: newPassword || undefined
      };
      
      if (!isOnline()) {
        addToOfflineQueue(data);
        updateStaffEditCache(email, newName, newEmail);
        Swal.close();
        Notiflix.Notify.success('Staff amehaririwa nje ya mtandao', {
          timeout: 2000,
          position: 'right-top'
        });
        loadStaffMembers();
        return;
      }
      
      apiRequest(data)
        .then(response => {
          Swal.close();
          if (response.status === 'success') {
            updateStaffEditCache(email, newName, newEmail);
            Notiflix.Notify.success('Staff amehaririwa kikamilifu', {
              timeout: 2000,
              position: 'right-top'
            });
            loadStaffMembers();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Imeshindikana',
              text: response.message,
              confirmButtonColor: '#4361ee'
            });
          }
        })
        .catch(error => {
          Swal.close();
          Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
            timeout: 3000,
            position: 'right-top'
          });
        });
    }
  });
}

/**
 * Update staff edit cache
 * @param {string} oldEmail - Current email
 * @param {string} newName - New name
 * @param {string} newEmail - New email
 */
function updateStaffEditCache(oldEmail, newName, newEmail) {
  const staff = getCachedStaff();
  const updated = staff.map(s => {
    if (s.email === oldEmail) {
      return { ...s, name: newName, email: newEmail };
    }
    return s;
  });
  setCachedStaff(updated);
}

/**
 * Delete staff member
 * @param {string} email - Staff email
 */
function deleteStaffMember(email) {
  Swal.fire({
    title: 'Thibitisha Kufuta',
    html: `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f72585; margin-bottom: 15px;"></i>
        <p>Una uhakika unataka kumfuta staff member:</p>
        <p style="font-weight: bold; color: #4361ee; font-size: 16px; margin: 10px 0;">"${escapeHtml(email)}"</p>
        <p style="color: #f72585; font-size: 12px; margin-top: 15px;">⚠️ Hii itamfuta kabisa kutoka kwenye mfumo!</p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f72585',
    cancelButtonColor: '#4361ee',
    confirmButtonText: '<i class="fas fa-trash-alt"></i> Ndio, Futa',
    cancelButtonText: '<i class="fas fa-times"></i> Hapana'
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Inafuta staff...',
        text: 'Tafadhali subiri',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      
      const data = {
        action: 'deleteStaff',
        dbId: currentDbId,
        email: email
      };
      
      if (!isOnline()) {
        addToOfflineQueue(data);
        updateStaffDeleteCache(email);
        Swal.close();
        Notiflix.Notify.success('Staff amefutwa nje ya mtandao', {
          timeout: 2000,
          position: 'right-top'
        });
        loadStaffMembers();
        return;
      }
      
      apiRequest(data)
        .then(response => {
          Swal.close();
          if (response.status === 'success') {
            updateStaffDeleteCache(email);
            Notiflix.Notify.success('Staff amefutwa kikamilifu', {
              timeout: 2000,
              position: 'right-top'
            });
            loadStaffMembers();
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Imeshindikana',
              text: response.message,
              confirmButtonColor: '#4361ee'
            });
          }
        })
        .catch(error => {
          Swal.close();
          Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
            timeout: 3000,
            position: 'right-top'
          });
        });
    }
  });
}

/**
 * Update staff delete cache
 * @param {string} email - Staff email
 */
function updateStaffDeleteCache(email) {
  const staff = getCachedStaff();
  setCachedStaff(staff.filter(s => s.email !== email));
}

/**
 * Check staff password strength
 */
function checkStaffPasswordStrength() {
  const password = document.getElementById('staffPasswordRegister').value;
  const strengthFill = document.getElementById('staffPasswordStrengthFill');
  const strengthText = document.getElementById('staffPasswordStrengthText');
  
  if (!strengthFill || !strengthText) return;
  
  if (password.length === 0) {
    strengthFill.style.width = '0%';
    strengthFill.className = 'password-strength-fill';
    strengthText.textContent = '';
    strengthText.className = 'password-strength-text';
    return;
  }
  
  let strength = 0;
  let message = '';
  let colorClass = '';
  let width = '0%';
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  
  if (strength <= 2) {
    width = '25%';
    colorClass = 'weak';
    message = 'Dhaifu sana - Ongeza herufi kubwa, ndogo na namba';
  } else if (strength <= 3) {
    width = '50%';
    colorClass = 'fair';
    message = 'Dhaifu - Ongeza herufi kubwa, ndogo au namba';
  } else if (strength <= 4) {
    width = '75%';
    colorClass = 'good';
    message = 'Wastani - Bado unaweza kuongeza nguvu';
  } else {
    width = '100%';
    colorClass = 'strong';
    message = 'Nzuri - Nenosiri lina nguvu ya kutosha';
  }
  
  strengthFill.style.width = width;
  strengthFill.className = `password-strength-fill ${colorClass}`;
  strengthText.textContent = message;
  strengthText.className = `password-strength-text ${colorClass}`;
}

// Add event listener for staff password strength
document.addEventListener('DOMContentLoaded', function() {
  const staffPasswordInput = document.getElementById('staffPasswordRegister');
  if (staffPasswordInput) {
    staffPasswordInput.addEventListener('input', checkStaffPasswordStrength);
  }
});