// ============================================
// DEVELOPER DASHBOARD
// ============================================

/**
 * Show developer dashboard
 */
function showDeveloperDashboard() {
  document.querySelectorAll('.container').forEach(container => {
    container.classList.add('hidden');
  });
  
  document.getElementById('developerDashboard').classList.remove('hidden');
  document.getElementById('sidebar').classList.add('hidden');
  document.getElementById('mainContent').classList.remove('shifted');
  
  loadAllUsers();
}

/**
 * Load all users
 */
function loadAllUsers() {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; padding: 40px;">
        <div class="loading-spinner" style="margin: 0 auto;"></div>
        <p style="margin-top: 10px; color: #666;">Inapakia orodha ya watumiaji...</p>
      </td>
    </tr>
  `;
  
  getAllUsers(CONFIG.DEVELOPER_KEY)
    .then(data => {
      if (data.status === 'success') {
        displayUsers(data.users);
        updateUsersStats(data);
      } else {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 40px; color: #f44336;">
              <i class="fas fa-exclamation-circle" style="font-size: 48px; margin-bottom: 15px;"></i>
              <p>${data.message || 'Imeshindikana kupakia watumiaji'}</p>
              <button class="btn btn-primary" onclick="loadAllUsers()" style="margin-top: 15px; width: auto; padding: 8px 20px;">
                <i class="fas fa-sync-alt"></i> Jaribu Tena
              </button>
            </td>
          </tr>
        `;
      }
    })
    .catch(error => {
      console.error('Error loading users:', error);
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <i class="fas fa-wifi-slash" style="font-size: 48px; color: #f44336; margin-bottom: 15px;"></i>
            <p style="color: #f44336;">Hitilafu ya Mtandao</p>
            <p style="color: #666; font-size: 14px;">Imeshindikana kuwasiliana na server.</p>
            <button class="btn btn-primary" onclick="loadAllUsers()" style="margin-top: 15px; width: auto; padding: 8px 20px;">
              <i class="fas fa-sync-alt"></i> Jaribu Tena
            </button>
          </td>
        </tr>
      `;
    });
}

/**
 * Display users in table
 * @param {Array} users - Users array
 */
function displayUsers(users) {
  const tableBody = document.getElementById('usersTableBody');
  if (!tableBody) return;
  
  if (!users || users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 60px;">
          <div style="text-align: center;">
            <div style="font-size: 64px; color: #ccc; margin-bottom: 20px;">📭</div>
            <h3 style="color: #666; margin-bottom: 10px;">Hakuna Watumiaji</h3>
            <p style="color: #999; margin-bottom: 20px;">Hakuna akaunti za watumiaji zilizopo kwenye mfumo</p>
            <button class="btn btn-primary" onclick="showAddUserModal()" style="width: auto; padding: 10px 24px; display: inline-flex; align-items: center; gap: 8px;">
              <i class="fas fa-user-plus"></i> Ongeza Mtumiaji Mpya
            </button>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  let html = '';
  
  users.forEach((user, index) => {
    const isDeveloper = user.email === CONFIG.DEVELOPER_EMAIL;
    const isClosed = user.accountStatus === 'Closed';
    const isExpired = user.accountStatus === 'Trial Expired' || user.accountStatus === 'Subscription Expired';
    
    // Status styling
    let statusClass = 'status-active';
    let statusText = user.accountStatus || 'Active';
    let statusIcon = '<i class="fas fa-check-circle"></i>';
    
    if (isClosed) {
      statusClass = 'status-inactive';
      statusText = 'Imefungwa';
      statusIcon = '<i class="fas fa-lock"></i>';
    } else if (isExpired) {
      statusClass = 'status-inactive';
      statusText = 'Muda Umeisha';
      statusIcon = '<i class="fas fa-hourglass-end"></i>';
    } else if (user.accountStatus === 'Premium') {
      statusClass = 'status-active';
      statusText = 'Premium';
      statusIcon = '<i class="fas fa-crown"></i>';
    }
    
    // Subscription type badge
    let subTypeClass = 'badge-warning';
    let subTypeIcon = 'fa-hourglass-half';
    if (user.subscriptionType === 'Premium' || user.isPremium) {
      subTypeClass = 'badge-success';
      subTypeIcon = 'fa-crown';
    } else if (user.subscriptionType === 'Unlimited') {
      subTypeClass = 'badge-primary';
      subTypeIcon = 'fa-infinity';
    }
    
    // Time remaining
    let timeRemainingText = '';
    if (user.timeRemaining > 0 && !user.isPremium && user.accountStatus !== 'Closed') {
      const days = Math.floor(user.timeRemaining / 1440);
      const hours = Math.floor((user.timeRemaining % 1440) / 60);
      const minutes = user.timeRemaining % 60;
      
      if (days > 0) timeRemainingText = days + ' siku';
      else if (hours > 0) timeRemainingText = hours + ' saa';
      else if (minutes > 0) timeRemainingText = minutes + ' dakika';
    }
    
    html += `<tr${isClosed ? ' style="opacity: 0.7; background: #fafafa;"' : ''}>`;
    html += `<td style="text-align: center; width: 50px; vertical-align: middle;"><strong>${index + 1}</strong></td>`;
    
    // Email column
    html += `<td style="vertical-align: middle;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <i class="fas fa-user-circle" style="font-size: 40px; color: ${isDeveloper ? '#ff9800' : '#4361ee'};"></i>
        <div>
          <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${escapeHtml(user.email)}</div>
          ${isDeveloper ? '<span style="background: #fff3e0; color: #ff9800; font-size: 11px; padding: 2px 8px; border-radius: 12px;"><i class="fas fa-crown"></i> System Developer</span>' : ''}
          ${user.schoolName ? `<div style="font-size: 12px; color: #666; margin-top: 4px;"><i class="fas fa-school"></i> ${escapeHtml(user.schoolName)}</div>` : ''}
        </div>
      </div>
    </td>`;
    
    // School & DB ID column
    html += `<td style="vertical-align: middle;">
      <div><strong>${escapeHtml(user.schoolName || 'Hakuna')}</strong></div>
      ${user.dbId ? `<small style="color: #999; font-size: 11px; font-family: monospace;">ID: ${user.dbId.substring(0, 12)}...</small>` : ''}
    </td>`;
    
    // Subscription column
    html += `<td style="vertical-align: middle;">
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <span class="badge ${subTypeClass}" style="display: inline-flex; align-items: center; gap: 6px; width: fit-content;">
          <i class="fas ${subTypeIcon}"></i> ${user.subscriptionType || 'Trial'}
          ${user.isPremium ? ' <i class="fas fa-check-circle" style="font-size: 10px;"></i>' : ''}
        </span>
        ${timeRemainingText ? `<small style="color: #f57c00;"><i class="fas fa-hourglass-half"></i> ${timeRemainingText} iliyobaki</small>` : ''}
        ${user.trialEndDate && !user.isPremium && user.accountStatus !== 'Closed' ? `<small style="color: #999; font-size: 10px;"><i class="fas fa-calendar"></i> Mwisho: ${formatDate(user.trialEndDate)}</small>` : ''}
        ${user.subscriptionEndDate && user.isPremium ? `<small style="color: #4caf50; font-size: 10px;"><i class="fas fa-calendar-check"></i> Mpaka: ${formatDate(user.subscriptionEndDate)}</small>` : ''}
      </div>
    </td>`;
    
    // Status column
    html += `<td style="vertical-align: middle;">
      <div style="display: flex; flex-direction: column; gap: 5px;">
        <span class="status-indicator ${statusClass}" style="display: inline-flex; align-items: center; gap: 6px; width: fit-content;">
          ${statusIcon} ${statusText}
        </span>
        ${isExpired ? '<small style="color: #f57c00; font-size: 10px;"><i class="fas fa-exclamation-triangle"></i> Inahitaji malipo</small>' : ''}
        ${isClosed ? '<small style="color: #999; font-size: 10px;"><i class="fas fa-ban"></i> Imefungwa</small>' : ''}
      </div>
    </td>`;
    
    // Actions column
    html += `<td style="text-align: center; vertical-align: middle;">
      <div class="developer-actions" style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">`;
    
    if (!isDeveloper) {
      html += `<button class="btn-action" onclick="showSubscriptionModal('${escapeHtml(user.email)}')" title="Dhibiti Muda wa Matumizi" style="background: #4361ee; color: white; padding: 6px 10px; border-radius: 6px;">
        <i class="fas fa-clock"></i> Muda
      </button>`;
      
      html += `<button class="btn-action" onclick="editUserAccount('${escapeHtml(user.email)}')" title="Hariri Akaunti" style="background: #f57c00; color: white; padding: 6px 10px; border-radius: 6px;">
        <i class="fas fa-edit"></i> Hariri
      </button>`;
      
      if (user.accountStatus === 'Closed') {
        html += `<button class="btn-action" onclick="reactivateUserAccount('${escapeHtml(user.email)}')" title="Fungua Akaunti Tena" style="background: #4caf50; color: white; padding: 6px 10px; border-radius: 6px;">
          <i class="fas fa-unlock-alt"></i> Fungua
        </button>`;
      } else {
        html += `<button class="btn-action" onclick="closeUserAccount('${escapeHtml(user.email)}')" title="Funga Akaunti" style="background: #f57c00; color: white; padding: 6px 10px; border-radius: 6px;">
          <i class="fas fa-lock"></i> Funga
        </button>`;
      }
      
      html += `<button class="btn-action" onclick="deleteUserAccount('${escapeHtml(user.email)}')" title="Futa Kabisa" style="background: #d32f2f; color: white; padding: 6px 10px; border-radius: 6px;">
        <i class="fas fa-trash-alt"></i> Futa
      </button>`;
    } else {
      html += `<span style="background: #fff3e0; color: #ff9800; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;">
        <i class="fas fa-shield-alt"></i> Akaunti ya Mfumo
      </span>`;
    }
    
    html += `</div></td></tr>`;
  });
  
  tableBody.innerHTML = html;
}

/**
 * Update users stats
 * @param {Object} data - Users data
 */
function updateUsersStats(data) {
  const statsDiv = document.getElementById('usersStats');
  if (!statsDiv) return;
  
  document.getElementById('totalUsersCount').textContent = data.total || 0;
  document.getElementById('activeUsersCount').textContent = data.active || 0;
  document.getElementById('expiredUsersCount').textContent = data.expired || 0;
  document.getElementById('closedUsersCount').textContent = data.closed || 0;
  
  statsDiv.style.display = 'block';
}

/**
 * Edit user account (developer only)
 * @param {string} email - User email
 */
function editUserAccount(email) {
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Barua pepe ya mtumiaji haijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: 'Inapakia taarifa...',
    text: 'Tafadhali subiri',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });
  
  getUserData(email, CONFIG.DEVELOPER_KEY)
    .then(data => {
      Swal.close();
      
      if (data.status === 'success') {
        Swal.fire({
          title: 'Hariri Akaunti ya Mtumiaji',
          html: `
            <div style="text-align: left;">
              <div class="input-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Barua Pepe</label>
                <input type="email" id="editUserEmail" value="${escapeHtml(data.email)}" 
                       style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Jina la Shule</label>
                <input type="text" id="editUserSchool" value="${escapeHtml(data.schoolName || '')}" 
                       style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Nenosiri Jipya <span style="font-weight: normal; color: #666;">(Acha wazi kama hutaki kubadilisha)</span></label>
                <input type="password" id="editUserPassword" placeholder="Weka nenosiri jipya" 
                       style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
                <small style="color: #666; font-size: 11px; display: block; margin-top: 5px;">
                  <i class="fas fa-info-circle"></i> Nenosiri lazima liwe na angalau herufi 8, herufi kubwa, ndogo na namba
                </small>
              </div>
              <div class="input-group" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Aina ya Usajili</label>
                <select id="editSubscriptionType" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
                  <option value="Trial" ${data.subscriptionType === 'Trial' ? 'selected' : ''}>Trial (Dakika 30)</option>
                  <option value="Premium" ${data.subscriptionType === 'Premium' || data.isPremium ? 'selected' : ''}>Premium</option>
                  <option value="Unlimited" ${data.subscriptionType === 'Unlimited' ? 'selected' : ''}>Unlimited</option>
                </select>
              </div>
              <div class="input-group" id="trialDateGroup" style="margin-bottom: 15px; ${data.subscriptionType === 'Premium' || data.subscriptionType === 'Unlimited' ? 'display: none;' : ''}">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Tarehe ya Mwisho (Trial)</label>
                <input type="datetime-local" id="editTrialEndDate" value="${formatDateForInput(data.trialEndDate)}" 
                       style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
              </div>
              <div class="input-group" id="subscriptionDateGroup" style="margin-bottom: 15px; ${data.subscriptionType !== 'Premium' && data.subscriptionType !== 'Unlimited' ? 'display: none;' : ''}">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">Tarehe ya Mwisho (Subscription)</label>
                <input type="datetime-local" id="editSubscriptionEndDate" value="${formatDateForInput(data.subscriptionEndDate)}" 
                       style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-save"></i> Hifadhi Mabadiliko',
          cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
          confirmButtonColor: '#4361ee',
          cancelButtonColor: '#f72585',
          width: '550px',
          didOpen: () => {
            const subTypeSelect = document.getElementById('editSubscriptionType');
            if (subTypeSelect) {
              subTypeSelect.addEventListener('change', function() {
                const trialGroup = document.getElementById('trialDateGroup');
                const subGroup = document.getElementById('subscriptionDateGroup');
                if (this.value === 'Premium' || this.value === 'Unlimited') {
                  if (trialGroup) trialGroup.style.display = 'none';
                  if (subGroup) subGroup.style.display = 'block';
                } else {
                  if (trialGroup) trialGroup.style.display = 'block';
                  if (subGroup) subGroup.style.display = 'none';
                }
              });
            }
          },
          preConfirm: () => {
            const newEmail = document.getElementById('editUserEmail').value.trim();
            const newSchool = document.getElementById('editUserSchool').value.trim();
            const newPassword = document.getElementById('editUserPassword').value;
            const subscriptionType = document.getElementById('editSubscriptionType').value;
            const trialEndDate = document.getElementById('editTrialEndDate')?.value || '';
            const subscriptionEndDate = document.getElementById('editSubscriptionEndDate')?.value || '';
            
            if (!newEmail) {
              Swal.showValidationMessage('Barua pepe ni lazima');
              return false;
            }
            
            if (newPassword && newPassword.length > 0) {
              const pwCheck = checkPasswordStrength(newPassword);
              if (!pwCheck.valid) {
                Swal.showValidationMessage(pwCheck.message);
                return false;
              }
            }
            
            return { newEmail, newSchool, newPassword, subscriptionType, trialEndDate, subscriptionEndDate };
          }
        }).then(result => {
          if (result.isConfirmed) {
            const { newEmail, newSchool, newPassword, subscriptionType, trialEndDate, subscriptionEndDate } = result.value;
            performEditUser(email, newEmail, newPassword, newSchool, subscriptionType, trialEndDate, subscriptionEndDate);
          }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Imeshindikana',
          text: data.message,
          confirmButtonColor: '#4361ee'
        });
      }
    })
    .catch(error => {
      Swal.close();
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      });
    });
}

/**
 * Perform edit user
 * @param {string} oldEmail - Current email
 * @param {string} newEmail - New email
 * @param {string} newPassword - New password
 * @param {string} newSchool - New school name
 * @param {string} subscriptionType - Subscription type
 * @param {string} trialEndDate - Trial end date
 * @param {string} subscriptionEndDate - Subscription end date
 */
function performEditUser(oldEmail, newEmail, newPassword, newSchool, subscriptionType, trialEndDate, subscriptionEndDate) {
  Swal.fire({
    title: 'Inahifadhi mabadiliko...',
    text: 'Tafadhali subiri',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => Swal.showLoading()
  });
  
  editUserAccount({
    oldEmail: oldEmail,
    newEmail: newEmail,
    newPassword: newPassword,
    newSchoolName: newSchool,
    subscriptionType: subscriptionType,
    trialEndDate: trialEndDate,
    subscriptionEndDate: subscriptionEndDate
  })
  .then(data => {
    Swal.close();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Imefanikiwa!',
        text: data.message,
        confirmButtonColor: '#4361ee'
      }).then(() => loadAllUsers());
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Imeshindikana',
        text: data.message,
        confirmButtonColor: '#4361ee'
      });
    }
  })
  .catch(error => {
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

/**
 * Close user account (developer only)
 * @param {string} email - User email
 */
function closeUserAccount(email) {
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Barua pepe ya mtumiaji haijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: '🔒 Funga Akaunti',
    html: `
      <div style="text-align: left;">
        <p>Una uhakika unataka kufunga akaunti ya <strong>${escapeHtml(email)}</strong>?</p>
        <div style="background: #fff3e0; padding: 12px; border-radius: 8px; margin: 15px 0;">
          <p style="color: #f57c00; font-size: 14px; margin: 0;">
            <i class="fas fa-info-circle"></i> Mtumiaji hataweza kuingia tena kwenye mfumo.
          </p>
          <p style="color: #f57c00; font-size: 14px; margin: 5px 0 0;">
            <i class="fas fa-sync-alt"></i> Unaweza kuifungua tena baadaye.
          </p>
        </div>
        <p>Data zote za shule zitabaki zimehifadhiwa.</p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f57c00',
    cancelButtonColor: '#4361ee',
    confirmButtonText: '<i class="fas fa-lock"></i> Funga Akaunti',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi'
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Inafunga akaunti...',
        text: `Inafunga akaunti ya ${email}`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      
      closeUserAccount(email)
        .then(data => {
          Swal.close();
          if (data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Akaunti Imefungwa!',
              text: data.message,
              confirmButtonColor: '#4361ee'
            }).then(() => loadAllUsers());
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Imeshindikana',
              text: data.message,
              confirmButtonColor: '#4361ee'
            });
          }
        })
        .catch(error => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Hitilafu ya Mtandao',
            text: 'Imeshindikana kuwasiliana na server',
            confirmButtonColor: '#4361ee'
          });
        });
    }
  });
}

/**
 * Reactivate user account (developer only)
 * @param {string} email - User email
 */
function reactivateUserAccount(email) {
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Barua pepe ya mtumiaji haijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: '🔓 Fungua Akaunti Tena',
    html: `
      <div style="text-align: left;">
        <p>Una uhakika unataka kufungua tena akaunti ya <strong>${escapeHtml(email)}</strong>?</p>
        <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin: 15px 0;">
          <p style="color: #4caf50; font-size: 14px; margin: 0;">
            <i class="fas fa-check-circle"></i> Mtumiaji ataweza kuingia tena kwenye mfumo.
          </p>
          <p style="color: #4caf50; font-size: 14px; margin: 5px 0 0;">
            <i class="fas fa-clock"></i> Atapewa dakika 30 za majaribio.
          </p>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4caf50',
    cancelButtonColor: '#4361ee',
    confirmButtonText: '<i class="fas fa-unlock-alt"></i> Fungua Tena',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi'
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Inafungua akaunti tena...',
        text: `Inafungua akaunti ya ${email}`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      
      reactivateUserAccount(email)
        .then(data => {
          Swal.close();
          if (data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Akaunti Imefunguliwa Tena!',
              text: data.message,
              confirmButtonColor: '#4361ee'
            }).then(() => loadAllUsers());
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Imeshindikana',
              text: data.message,
              confirmButtonColor: '#4361ee'
            });
          }
        })
        .catch(error => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Hitilafu ya Mtandao',
            text: 'Imeshindikana kuwasiliana na server',
            confirmButtonColor: '#4361ee'
          });
        });
    }
  });
}

/**
 * Delete user account (developer only)
 * @param {string} email - User email
 */
function deleteUserAccount(email) {
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Barua pepe ya mtumiaji haijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: '⚠️ Futa Akaunti Kwa Kudumu',
    html: `
      <div style="text-align: left; color: #f72585;">
        <p><strong>⚠️ ONYO: HATUA HII HAWEZI KUTENDEULIWA!</strong></p>
        <p>Unaenda kufuta kabisa:</p>
        <ul style="margin: 10px 0 10px 20px;">
          <li>Akaunti ya mtumiaji: <strong>${escapeHtml(email)}</strong></li>
          <li>Data zote za wanafunzi</li>
          <li>Alama zote za mitihani</li>
          <li>Rekodi zote za shule</li>
        </ul>
        <div style="background: #ffebee; padding: 12px; border-radius: 8px; margin: 15px 0;">
          <p style="color: #c62828; font-size: 14px; margin: 0;">
            <i class="fas fa-exclamation-triangle"></i> Hii itafuta kila kitu kinachohusiana na akaunti hii!
          </p>
        </div>
        <p style="margin-top: 15px;">Ili kuthibitisha, andika: <strong style="color: #f72585;">DELETE ${email}</strong></p>
        <input type="text" id="confirmDeleteAccount" class="swal2-input" placeholder="Andika DELETE ${email}" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; margin-top: 10px;">
      </div>
    `,
    icon: 'error',
    showCancelButton: true,
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#4361ee',
    confirmButtonText: '<i class="fas fa-trash-alt"></i> Futa Kabisa',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    width: '550px',
    preConfirm: () => {
      const confirmation = document.getElementById('confirmDeleteAccount').value;
      if (confirmation !== `DELETE ${email}`) {
        Swal.showValidationMessage(`Tafadhali andika DELETE ${email} kuthibitisha`);
        return false;
      }
      return true;
    }
  }).then(result => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Inafuta akaunti...',
        text: `Inafuta akaunti ya ${email} na data zake zote`,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
      
      deleteUserAccount(email)
        .then(data => {
          Swal.close();
          if (data.status === 'success') {
            Swal.fire({
              icon: 'success',
              title: 'Akaunti Imefutwa!',
              html: `
                <div style="text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 15px;">🗑️</div>
                  <p>${data.message}</p>
                  <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    Akaunti ya <strong>${escapeHtml(email)}</strong> imefutwa kikamilifu.
                  </p>
                </div>
              `,
              confirmButtonColor: '#4361ee'
            }).then(() => loadAllUsers());
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Imeshindikana',
              text: data.message,
              confirmButtonColor: '#4361ee'
            });
          }
        })
        .catch(error => {
          Swal.close();
          Swal.fire({
            icon: 'error',
            title: 'Hitilafu ya Mtandao',
            text: 'Imeshindikana kuwasiliana na server',
            confirmButtonColor: '#4361ee'
          });
        });
    }
  });
}

/**
 * Show add user modal
 */
function showAddUserModal() {
  if (Swal.isVisible()) Swal.close();
  
  document.getElementById('newUserEmail').value = '';
  document.getElementById('newUserSchool').value = '';
  document.getElementById('newUserPassword').value = '';
  document.getElementById('newUserConfirmPassword').value = '';
  document.getElementById('newUserTrialEndDate').value = '';
  document.getElementById('newUserSubscriptionEndDate').value = '';
  document.getElementById('newUserSubscriptionType').value = 'Trial';
  
  const strengthFill = document.getElementById('passwordStrengthFill');
  const strengthText = document.getElementById('passwordStrengthText');
  if (strengthFill) {
    strengthFill.style.width = '0%';
    strengthFill.style.background = '#e0e0e0';
  }
  if (strengthText) strengthText.textContent = '';
  
  toggleDateGroups('Trial');
  
  document.getElementById('addUserOverlay').classList.remove('hidden');
  document.getElementById('addUserModal').classList.remove('hidden');
  
  const passwordInput = document.getElementById('newUserPassword');
  if (passwordInput) {
    passwordInput.oninput = function() {
      checkAddUserPasswordStrength(this.value);
    };
  }
  
  const subTypeSelect = document.getElementById('newUserSubscriptionType');
  if (subTypeSelect) {
    subTypeSelect.onchange = function() {
      toggleDateGroups(this.value);
    };
  }
}

/**
 * Toggle date groups based on subscription type
 * @param {string} subscriptionType - Subscription type
 */
function toggleDateGroups(subscriptionType) {
  const trialGroup = document.getElementById('trialDateGroup');
  const subGroup = document.getElementById('subscriptionDateGroup');
  
  if (subscriptionType === 'Trial') {
    if (trialGroup) trialGroup.style.display = 'block';
    if (subGroup) subGroup.style.display = 'none';
  } else {
    if (trialGroup) trialGroup.style.display = 'none';
    if (subGroup) subGroup.style.display = 'block';
  }
}

/**
 * Check add user password strength
 * @param {string} password - Password to check
 */
function checkAddUserPasswordStrength(password) {
  const strengthFill = document.getElementById('passwordStrengthFill');
  const strengthText = document.getElementById('passwordStrengthText');
  
  if (!strengthFill || !strengthText) return;
  
  if (password.length === 0) {
    strengthFill.style.width = '0%';
    strengthFill.style.background = '#e0e0e0';
    strengthText.textContent = '';
    return;
  }
  
  const result = checkPasswordStrength(password);
  let width = '0%';
  let color = '#e0e0e0';
  let message = '';
  
  if (result.strength === 'very-strong') {
    width = '100%';
    color = '#2e7d32';
    message = 'Imara Sana';
  } else if (result.strength === 'strong') {
    width = '100%';
    color = '#4caf50';
    message = 'Nzuri';
  } else if (result.strength === 'good') {
    width = '75%';
    color = '#ffeb3b';
    message = 'Wastani';
  } else if (result.strength === 'fair') {
    width = '50%';
    color = '#ff9800';
    message = 'Dhaifu';
  } else {
    width = '25%';
    color = '#f44336';
    message = 'Dhaifu sana';
  }
  
  strengthFill.style.width = width;
  strengthFill.style.background = color;
  strengthText.textContent = message;
  strengthText.style.color = color;
}

/**
 * Create new user (developer only)
 */
function createNewUser() {
  const email = document.getElementById('newUserEmail').value.trim();
  const schoolName = document.getElementById('newUserSchool').value.trim();
  const password = document.getElementById('newUserPassword').value;
  const confirmPassword = document.getElementById('newUserConfirmPassword').value;
  const subscriptionType = document.getElementById('newUserSubscriptionType').value;
  const trialEndDate = document.getElementById('newUserTrialEndDate').value;
  const subscriptionEndDate = document.getElementById('newUserSubscriptionEndDate').value;
  
  if (!email) {
    Swal.fire({ icon: 'warning', title: 'Barua Pepe Inakosekana', text: 'Tafadhali weka barua pepe', confirmButtonColor: '#4361ee' });
    return;
  }
  
  if (!schoolName) {
    Swal.fire({ icon: 'warning', title: 'Jina la Shule Linakosekana', text: 'Tafadhali weka jina la shule', confirmButtonColor: '#4361ee' });
    return;
  }
  
  if (!password) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Linakosekana', text: 'Tafadhali weka nenosiri', confirmButtonColor: '#4361ee' });
    return;
  }
  
  if (password !== confirmPassword) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Halifanani', text: 'Nenosiri na uthibitisho wake hazifanani', confirmButtonColor: '#4361ee' });
    return;
  }
  
  const pwCheck = checkPasswordStrength(password);
  if (!pwCheck.valid) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Dhaifu', text: pwCheck.message, confirmButtonColor: '#4361ee' });
    return;
  }
  
  if (email === CONFIG.DEVELOPER_EMAIL) {
    Swal.fire({ icon: 'error', title: 'Barua Pepe Haiwezekani', text: 'Barua pepe hii imehifadhiwa kwa ajili ya msanifu wa mfumo', confirmButtonColor: '#4361ee' });
    return;
  }
  
  Swal.fire({
    title: 'Inaunda akaunti...',
    text: `Inaunda akaunti ya ${email}`,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '9999999';
      }
    }
  });
  
  registerUser({
    email: email,
    password: password,
    schoolName: schoolName,
    subscriptionType: subscriptionType,
    trialEndDate: trialEndDate || null,
    subscriptionEndDate: subscriptionEndDate || null
  })
  .then(data => {
    Swal.close();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Akaunti Imefunguliwa!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
            <p>${data.message}</p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              <strong>Mtumiaji:</strong> ${escapeHtml(email)}<br>
              <strong>Aina:</strong> ${subscriptionType}<br>
              <strong>Shule:</strong> ${escapeHtml(schoolName)}
            </p>
          </div>
        `,
        confirmButtonColor: '#4361ee'
      }).then(() => {
        hideAddUserModal();
        loadAllUsers();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Imeshindikana',
        text: data.message,
        confirmButtonColor: '#4361ee'
      });
    }
  })
  .catch(error => {
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

/**
 * Hide add user modal
 */
function hideAddUserModal() {
  document.getElementById('addUserOverlay').classList.add('hidden');
  document.getElementById('addUserModal').classList.add('hidden');
}

/**
 * Show developer password modal
 */
function showDeveloperPasswordModal() {
  if (Swal.isVisible()) Swal.close();
  
  document.getElementById('devOldPassword').value = '';
  document.getElementById('devNewPassword').value = '';
  document.getElementById('devConfirmPassword').value = '';
  
  const strengthFill = document.getElementById('devPasswordStrengthFill');
  const strengthText = document.getElementById('devPasswordStrengthText');
  if (strengthFill) {
    strengthFill.style.width = '0%';
    strengthFill.style.background = '#e0e0e0';
  }
  if (strengthText) strengthText.textContent = '';
  
  setupDeveloperPasswordStrength();
  
  document.getElementById('devChangePasswordOverlay').classList.remove('hidden');
  document.getElementById('devChangePasswordModal').classList.remove('hidden');
  
  setTimeout(() => {
    document.getElementById('devOldPassword').focus();
  }, 100);
}

/**
 * Setup developer password strength
 */
function setupDeveloperPasswordStrength() {
  const passwordInput = document.getElementById('devNewPassword');
  if (passwordInput) {
    passwordInput.oninput = function() {
      const password = this.value;
      const strengthFill = document.getElementById('devPasswordStrengthFill');
      const strengthText = document.getElementById('devPasswordStrengthText');
      
      if (!strengthFill || !strengthText) return;
      
      if (password.length === 0) {
        strengthFill.style.width = '0%';
        strengthFill.style.background = '#e0e0e0';
        strengthText.textContent = '';
        return;
      }
      
      const result = checkPasswordStrength(password);
      let width = '0%';
      let color = '#e0e0e0';
      let message = '';
      
      if (result.strength === 'very-strong') {
        width = '100%';
        color = '#2e7d32';
        message = 'Imara Sana';
      } else if (result.strength === 'strong') {
        width = '100%';
        color = '#4caf50';
        message = 'Nzuri';
      } else if (result.strength === 'good') {
        width = '75%';
        color = '#ffeb3b';
        message = 'Wastani';
      } else if (result.strength === 'fair') {
        width = '50%';
        color = '#ff9800';
        message = 'Dhaifu';
      } else {
        width = '25%';
        color = '#f44336';
        message = 'Dhaifu sana';
      }
      
      strengthFill.style.width = width;
      strengthFill.style.background = color;
      strengthText.textContent = message;
      strengthText.style.color = color;
    };
  }
}

/**
 * Hide developer password modal
 */
function hideDeveloperPasswordModal() {
  document.getElementById('devChangePasswordOverlay').classList.add('hidden');
  document.getElementById('devChangePasswordModal').classList.add('hidden');
  
  document.getElementById('devOldPassword').value = '';
  document.getElementById('devNewPassword').value = '';
  document.getElementById('devConfirmPassword').value = '';
}

/**
 * Change developer password
 */
function changeDeveloperPassword() {
  const currentPassword = document.getElementById('devOldPassword').value;
  const newPassword = document.getElementById('devNewPassword').value;
  const confirmPassword = document.getElementById('devConfirmPassword').value;
  
  if (!currentPassword) {
    Swal.fire({ icon: 'warning', title: 'Taarifa Zinakosekana', text: 'Tafadhali weka nenosiri lako la sasa', confirmButtonColor: '#4361ee' });
    document.getElementById('devOldPassword').focus();
    return;
  }
  
  if (!newPassword) {
    Swal.fire({ icon: 'warning', title: 'Taarifa Zinakosekana', text: 'Tafadhali weka nenosiri jipya', confirmButtonColor: '#4361ee' });
    document.getElementById('devNewPassword').focus();
    return;
  }
  
  if (!confirmPassword) {
    Swal.fire({ icon: 'warning', title: 'Taarifa Zinakosekana', text: 'Tafadhali thibitisha nenosiri jipya', confirmButtonColor: '#4361ee' });
    document.getElementById('devConfirmPassword').focus();
    return;
  }
  
  if (newPassword !== confirmPassword) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Halifanani', text: 'Nenosiri jipya na uthibitisho wake hazifanani', confirmButtonColor: '#4361ee' });
    document.getElementById('devNewPassword').focus();
    return;
  }
  
  const pwCheck = checkPasswordStrength(newPassword);
  if (!pwCheck.valid) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Dhaifu', text: pwCheck.message, confirmButtonColor: '#4361ee' });
    document.getElementById('devNewPassword').focus();
    return;
  }
  
  Swal.fire({
    title: 'Inabadilisha nenosiri la msanifu...',
    text: 'Tafadhali subiri',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '9999999';
      }
    }
  });
  
  updateDeveloperPassword({
    email: CONFIG.DEVELOPER_EMAIL,
    currentPassword: currentPassword,
    newPassword: newPassword
  })
  .then(data => {
    Swal.close();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Nenosiri Limebadilishwa!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
            <p>${data.message}</p>
            <div style="background: #e8f5e9; padding: 12px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #2e7d32; font-size: 13px; margin: 0;">
                <i class="fas fa-shield-alt"></i> Usalama: <strong></strong>
              </p>
              <p style="color: #2e7d32; font-size: 12px; margin: 5px 0 0;">
                Nenosiri limehifadhiwa kwa usalama wa hali ya juu
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#4361ee'
      }).then(() => {
        hideDeveloperPasswordModal();
        document.getElementById('devOldPassword').value = '';
        document.getElementById('devNewPassword').value = '';
        document.getElementById('devConfirmPassword').value = '';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Imeshindikana',
        text: data.message,
        confirmButtonColor: '#4361ee'
      });
    }
  })
  .catch(error => {
    Swal.close();
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}