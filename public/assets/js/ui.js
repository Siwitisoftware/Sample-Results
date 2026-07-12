// ============================================
// UI HELPERS
// ============================================

/**
 * Toggle sidebar
 */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.toggle('active');
  
  if (window.innerWidth > 768) {
    mainContent.classList.toggle('shifted', sidebar.classList.contains('active'));
  } else {
    if (overlay) {
      overlay.classList.toggle('active', sidebar.classList.contains('active'));
    }
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('active'));
  }
}

/**
 * Close sidebar (for mobile)
 */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const overlay = document.querySelector('.sidebar-overlay');
  
  sidebar.classList.remove('active');
  mainContent.classList.remove('shifted');
  if (overlay) overlay.classList.remove('active');
  document.body.classList.remove('sidebar-open');
}

/**
 * Show dashboard
 * @param {string} dashboard - Dashboard name
 */
function showDashboard(dashboard) {
  // Hide all containers
  const containers = [
    'auth', 'register', 'studentDashboard', 'subjectDashboard',
    'resultsDashboard', 'reportDashboard', 'staffDashboard',
    'systemSettingsDashboard', 'forgotPasswordModal', 'developerDashboard'
  ];
  
  containers.forEach(container => {
    const el = document.getElementById(container);
    if (el) el.classList.add('hidden');
  });

  const userType = localStorage.getItem('userType') || 'owner';
  const isStaff = userType === 'staff';
  
  // Prevent staff from accessing report if trial expired
  if (isStaff && dashboard === 'report') {
    if (subscriptionStatus && subscriptionStatus.status === 'expired' && !subscriptionStatus.isPremium) {
      dashboard = 'student';
      setTimeout(() => {
        Swal.fire({
          icon: 'error',
          title: 'ACCESS BLOCKED',
          html: `
            <div style="text-align: center;">
              <p style="color: #f44336; font-weight: bold;">Report Dashboard is LOCKED</p>
              <p style="font-size: 14px; color: #666; margin-top: 10px;">
                Trial/subscription period has ended. Report features are completely disabled.
              </p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Please contact the school owner to renew subscription.
              </p>
            </div>
          `,
          confirmButtonColor: '#4361ee',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
      }, 50);
      disableStaffReportMenu();
    }
  }
  
  // Prevent staff from accessing restricted dashboards
  if (isStaff && (dashboard === 'staff' || dashboard === 'systemSettings')) {
    dashboard = 'student';
    Notiflix.Notify.warning('This section is for school owners only', {
      timeout: 3000,
      position: 'right-top'
    });
  }

  localStorage.setItem('currentDashboard', dashboard);

  const sidebar = document.getElementById('sidebar');
  const isDashboardView = !['auth', 'register', 'forgotPassword'].includes(dashboard);
  
  if (isDashboardView) {
    if (sidebar) sidebar.classList.remove('hidden');
    const schoolNameDisplay = document.getElementById('schoolNameDisplay');
    if (schoolNameDisplay && currentSchoolName) {
      schoolNameDisplay.textContent = currentSchoolName;
    }
    if (isOnline()) {
      setTimeout(() => autoPreloadData(), 1000);
    }
  } else {
    if (sidebar) sidebar.classList.add('hidden');
  }

  // Show selected dashboard
  const dashboardMap = {
    'student': 'studentDashboard',
    'subject': 'subjectDashboard',
    'results': 'resultsDashboard',
    'report': 'reportDashboard',
    'staff': 'staffDashboard',
    'systemSettings': 'systemSettingsDashboard',
    'auth': 'auth',
    'register': 'register',
    'forgotPassword': 'forgotPasswordModal',
    'developer': 'developerDashboard'
  };

  const dashboardId = dashboardMap[dashboard];
  if (dashboardId) {
    const el = document.getElementById(dashboardId);
    if (el) {
      el.classList.remove('hidden');
      // Load data based on dashboard
      if (dashboard === 'student') loadStudents();
      else if (dashboard === 'subject') loadSubjects();
      else if (dashboard === 'results') { loadTerms(); loadResults(); }
      else if (dashboard === 'report') { loadTerms(); loadReport(); }
      else if (dashboard === 'staff') loadStaffMembers();
      else if (dashboard === 'systemSettings') loadSystemSettings();
      else if (dashboard === 'developer') loadAllUsers();
    }
  }

  // Update active menu
  updateActiveMenu(dashboard);

  // Show/hide staff and system settings menus
  if (isStaff) {
    document.getElementById('staffMenuLi')?.classList.add('hidden');
    document.getElementById('systemSettingsMenuLi')?.classList.add('hidden');
    if (subscriptionStatus && subscriptionStatus.status === 'expired' && !subscriptionStatus.isPremium) {
      disableStaffReportMenu();
    }
  } else {
    document.getElementById('staffMenuLi')?.classList.remove('hidden');
    document.getElementById('systemSettingsMenuLi')?.classList.remove('hidden');
  }

  // Adjust sidebar for mobile/desktop
  if (window.innerWidth <= 768) {
    if (sidebar) sidebar.classList.remove('active');
    document.getElementById('mainContent').classList.remove('shifted');
  } else {
    if (isDashboardView) {
      if (sidebar) sidebar.classList.add('active');
      document.getElementById('mainContent').classList.add('shifted');
    } else {
      if (sidebar) sidebar.classList.remove('active');
      document.getElementById('mainContent').classList.remove('shifted');
    }
  }
  
  // Show/hide sidebar timer
  const sidebarTimer = document.getElementById('sidebarTimer');
  if (sidebarTimer) {
    if (isDashboardView && subscriptionStatus) {
      sidebarTimer.classList.remove('hidden');
    } else {
      sidebarTimer.classList.add('hidden');
    }
  }
}

/**
 * Update active menu
 * @param {string} dashboard - Dashboard name
 */
function updateActiveMenu(dashboard) {
  const menuMap = {
    'student': 'studentMenu',
    'subject': 'subjectMenu',
    'results': 'resultsMenu',
    'report': 'reportMenu',
    'staff': 'staffMenu',
    'systemSettings': 'systemSettingsMenu'
  };
  
  document.querySelectorAll('.sidebar ul li a').forEach(menu => {
    menu.classList.remove('active');
  });
  
  const menuId = menuMap[dashboard];
  if (menuId) {
    const menu = document.getElementById(menuId);
    if (menu) menu.classList.add('active');
  }
}

/**
 * Show change password modal
 */
function showChangePasswordModal() {
  if (Swal.isVisible()) Swal.close();
  
  document.getElementById('changeOldPassword').value = '';
  document.getElementById('changeNewPassword').value = '';
  document.getElementById('changeConfirmPassword').value = '';
  
  document.getElementById('changePasswordOverlay').classList.remove('hidden');
  document.getElementById('changePasswordModal').classList.remove('hidden');
  
  setTimeout(() => {
    document.getElementById('changeOldPassword').focus();
  }, 100);
}

/**
 * Hide change password modal
 */
function hideChangePasswordModal() {
  document.getElementById('changePasswordOverlay').classList.add('hidden');
  document.getElementById('changePasswordModal').classList.add('hidden');
  
  document.getElementById('changeOldPassword').value = '';
  document.getElementById('changeNewPassword').value = '';
  document.getElementById('changeConfirmPassword').value = '';
}

/**
 * Handle change password
 */
function handleChangePassword() {
  const oldPassword = document.getElementById('changeOldPassword').value;
  const newPassword = document.getElementById('changeNewPassword').value;
  const confirmPassword = document.getElementById('changeConfirmPassword').value;
  
  if (!oldPassword || !newPassword || !confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'Taarifa Zinakosekana',
      text: 'Tafadhali jaza nenosiri zote',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (newPassword !== confirmPassword) {
    Swal.fire({
      icon: 'warning',
      title: 'Nenosiri Halifanani',
      text: 'Nenosiri jipya na uthibitisho wake hazifanani',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const pwCheck = checkPasswordStrength(newPassword);
  if (!pwCheck.valid) {
    Swal.fire({
      icon: 'warning',
      title: 'Nenosiri Dhaifu',
      text: pwCheck.message,
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const userType = localStorage.getItem('userType') || 'owner';
  const staffName = localStorage.getItem('staffName');
  const userEmail = localStorage.getItem('currentUserEmail');
  
  if (!currentDbId) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mfumo',
      text: 'Taarifa za shule hazijapatikana. Tafadhali ingia tena.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  let requestData = {};
  
  if (userType === 'owner') {
    requestData = {
      action: 'updateOwnerPassword',
      dbId: currentDbId,
      currentPassword: oldPassword,
      newPassword: newPassword
    };
  } else if (userType === 'staff') {
    if (!staffName) {
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Staff',
        text: 'Jina la staff halijapatikana. Tafadhali ingia tena.',
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    requestData = {
      action: 'updateStaffPasswordByName',
      dbId: currentDbId,
      staffName: staffName,
      currentPassword: oldPassword,
      newPassword: newPassword
    };
  } else if (userType === 'developer') {
    requestData = {
      action: 'updateDeveloperPassword',
      email: userEmail,
      currentPassword: oldPassword,
      newPassword: newPassword
    };
  }
  
  Swal.fire({
    title: 'Inabadilisha nenosiri...',
    text: 'Tafadhali subiri',
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '999999';
      }
    }
  });
  
  apiRequest(requestData)
    .then(data => {
      Swal.close();
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa!',
          html: `
            <div style="text-align: center;">
              <p>${data.message}</p>
              <p style="font-size: 14px; color: #4caf50; margin-top: 10px;">
                <i class="fas fa-shield-alt"></i> Nenosiri limehifadhiwa kwa usalama
              </p>
            </div>
          `,
          confirmButtonColor: '#4361ee'
        }).then(() => hideChangePasswordModal());
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
 * Show system settings tab
 * @param {string} tabName - Tab name
 * @param {HTMLElement} element - Clicked element
 */
function openSystemTab(tabName, element) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  element.classList.add('active');
  document.getElementById(tabName).classList.add('active');
  
  if (tabName === 'graduationClassesTab') {
    loadGraduationClassesList();
  }
}

/**
 * Load graduation classes list
 */
function loadGraduationClassesList() {
  const tbody = document.getElementById('graduationClassesBody');
  if (!tbody) return;
  
  const exitSheets = getCachedExitSheets();
  if (exitSheets.length > 0) {
    displayGraduationClasses(exitSheets);
  } else {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">Inapakia...</td></tr>';
  }
  
  if (!isOnline() || !currentDbId) return;
  
  apiRequest({
    action: 'getAllExitSheets',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedExitSheets(data.exitSheets);
      displayGraduationClasses(data.exitSheets);
    }
  })
  .catch(error => {
    console.error('Error loading graduation classes:', error);
  });
}

/**
 * Display graduation classes
 * @param {Array} graduationClasses - Graduation classes
 */
function displayGraduationClasses(graduationClasses) {
  const tbody = document.getElementById('graduationClassesBody');
  if (!tbody) return;
  
  if (!graduationClasses || graduationClasses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Hakuna madarasa ya wahitimu yaliyopo</td></tr>';
    return;
  }
  
  const sortedClasses = graduationClasses.sort((a, b) => b.name.localeCompare(a.name));
  let html = '';
  
  sortedClasses.forEach(graduationClass => {
    const displayName = formatGraduationClassName(graduationClass.name);
    html += `
      <tr>
        <td>${escapeHtml(displayName)}</td>
        <td>${graduationClass.studentCount || 0} wahitimu</td>
        <td>${graduationClass.year || '-'}</td>
        <td>${graduationClass.month || '-'}</td>
        <td>
          <button class="btn btn-action btn-primary" onclick="openGraduationClass('${escapeHtml(graduationClass.name)}')">
            🔗 Fungua (12h)
          </button>
        </td>
      </tr>
    `;
  });
  
  tbody.innerHTML = html;
}

/**
 * Format graduation class name
 * @param {string} className - Class name
 * @returns {string} Formatted name
 */
function formatGraduationClassName(className) {
  const parts = className.split('_');
  if (parts.length >= 4) {
    const year = parts[2] || 'Unknown';
    const month = parts[3] || 'Unknown';
    return 'Darasa la Wahitimu (' + year + ' ' + month + ')';
  }
  return className;
}

/**
 * Open graduation class
 * @param {string} className - Class name
 */
function openGraduationClass(className) {
  Notiflix.Loading.standard('Inatengeneza link ya muda wa saa 12...');
  
  apiRequest({
    action: 'createTemporaryExitSheetLink',
    dbId: currentDbId,
    sheetName: className
  })
  .then(data => {
    Notiflix.Loading.remove();
    if (data.status === 'success') {
      Swal.fire({
        title: 'Darasa la Wahitimu Imefunguliwa',
        html: `
          <p>Darasa la wahitimu <strong>${formatGraduationClassName(className)}</strong> imefunguliwa kwenye tab mpya.</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            🔗 Link hii itaisha baada ya <strong>saa 12</strong> na itafutaka automatik.
          </p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Fungua Sasa',
        cancelButtonText: 'Funga',
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#f72585'
      }).then(result => {
        if (result.isConfirmed) {
          window.open(data.sheetUrl, '_blank');
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
    Notiflix.Loading.remove();
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

/**
 * Open exit sheet
 * @param {string} sheetName - Sheet name
 */
function openExitSheet(sheetName) {
  Notiflix.Loading.standard('Inatengeneza link ya muda wa saa 12...');
  
  apiRequest({
    action: 'createTemporaryExitSheetLink',
    dbId: currentDbId,
    sheetName: sheetName
  })
  .then(data => {
    Notiflix.Loading.remove();
    if (data.status === 'success') {
      Swal.fire({
        title: 'Exit Sheet Imefunguliwa',
        html: `
          <p>Exit sheet <strong>${sheetName}</strong> imefunguliwa kwenye tab mpya.</p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            🔗 Link hii itaisha baada ya <strong>saa 12</strong> na itafutaka automatik.
          </p>
          <p style="font-size: 12px; color: #f8961e;">
            ⚠️ Hakikisha umepakua data yote unayohitaji kabla ya muda kuisha.
          </p>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: 'Fungua Sasa',
        cancelButtonText: 'Funga',
        confirmButtonColor: '#4361ee',
        cancelButtonColor: '#f72585'
      }).then(result => {
        if (result.isConfirmed) {
          window.open(data.sheetUrl, '_blank');
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
    Notiflix.Loading.remove();
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

/**
 * Manual promote students
 */
function manualPromoteStudentsNow() {
  Swal.fire({
    title: 'Thibitisha Usogeaji',
    html: `
      <div style="text-align: left;">
        <p style="color: #f8961e; font-weight: bold; margin-bottom: 15px;">
          ⚠️ UNAHAKIKA UNATAKA KUSOGEZA WANAFUNZI WOTE DARASA LA MBELE?
        </p>
        <p style="margin-bottom: 10px;">📊 Mchakato huu utafanyika kama ifuatavyo:</p>
        <ul style="text-align: left; margin-left: 20px;">
          <li>• <strong>Darasa la Saba</strong> → Sheet Mpya ya Exit (Watahitimu)</li>
          <li>• <strong>Darasa la Sita</strong> → Darasa la Saba</li>
          <li>• <strong>Darasa la Tano</strong> → Darasa la Sita</li>
          <li>• <strong>Darasa la Nne</strong> → Darasa la Tano</li>
          <li>• <strong>Darasa la Tatu</strong> → Darasa la Nne</li>
          <li>• <strong>Darasa la Pili</strong> → Darasa la Tatu</li>
          <li>• <strong>Darasa la Kwanza</strong> → Darasa la Pili</li>
          <li>• <strong>Awali</strong> → Darasa la Kwanza</li>
          <li>• <strong>Awali</strong> → Litabaki wazi kwa wanafunzi wapya</li>
        </ul>
        <p style="color: #f8961e; font-size: 14px; margin-top: 15px;">🔴 HATUA HII HAWEZI KUTENDEULIWA!</p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f8961e',
    cancelButtonColor: '#4361ee',
    confirmButtonText: 'Ndio, Sogeza Sasa',
    cancelButtonText: 'Hapana, Acha',
    width: '650px'
  }).then(result => {
    if (result.isConfirmed) {
      Notiflix.Loading.standard('Inasogeza wanafunzi darasa la mbele...');
      
      apiRequest({
        action: 'manualPromoteStudents',
        dbId: currentDbId
      })
      .then(data => {
        Notiflix.Loading.remove();
        if (data.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Imefanikiwa',
            html: `
              <p>${data.message}</p>
              <p style="font-size: 14px; color: #666; margin-top: 10px;">
                Wanafunzi ${data.promoted} wamesogezwa darasa la mbele kikamilifu.
              </p>
              ${data.sabaGraduated > 0 ? `
                <div style="background: #f0f9ff; padding: 10px; border-radius: 8px; margin: 10px 0;">
                  <p style="font-size: 12px; color: #0369a1; margin: 0;">
                    <strong>✅ Wahitimu wa Darasa la Saba (${data.sabaGraduated}):</strong><br>
                    • Sheet: <strong>${data.exitSheetName}</strong><br>
                    • Mwaka: <strong>${data.graduationYear}</strong><br>
                    • Mwezi: <strong>${data.graduationMonth}</strong>
                  </p>
                </div>
              ` : ''}
              <p style="font-size: 12px; color: #4caf50;">
                ✅ Darasa la Awali limetayarishwa kwa ajili ya wanafunzi wapya
              </p>
            `,
            confirmButtonColor: '#4361ee',
            width: '600px'
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
        Notiflix.Loading.remove();
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
 * Promote single student
 * @param {string} encodedJina - Encoded student name
 * @param {string} currentDarasa - Current class
 * @param {string} direction - Direction (up/down)
 */
function promoteStudent(encodedJina, currentDarasa, direction) {
  const decodedJina = safeDecodeName(encodedJina);
  const classes = CONFIG.CLASSES;
  
  const currentIndex = classes.indexOf(currentDarasa);
  let newDarasa;
  
  if (direction === 'up') {
    if (currentIndex === classes.length - 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Haiwezekani',
        text: `${decodedJina} tayari yuko kwenye darasa la juu kabisa (Darasa la Saba)`,
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    newDarasa = classes[currentIndex + 1];
  } else {
    if (currentIndex === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Haiwezekani',
        text: `${decodedJina} tayari yuko kwenye darasa la chini kabisa (Awali)`,
        confirmButtonColor: '#4361ee'
      });
      return;
    }
    newDarasa = classes[currentIndex - 1];
  }
  
  const actionText = direction === 'up' ? 'kupandisha' : 'kurudisha';
  
  Swal.fire({
    title: 'Thibitisha Usogeaji',
    html: `
      <div style="text-align: left;">
        <p>Una uhakika unataka ${actionText} mwanafunzi:</p>
        <p style="font-weight: bold; color: var(--primary); margin: 10px 0;">${decodedJina}</p>
        <p>Kutoka: <strong>${currentDarasa}</strong></p>
        <p>Kwenda: <strong>${newDarasa}</strong></p>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    confirmButtonText: `Ndio, ${direction === 'up' ? 'Pandisha' : 'Rudisha'}`,
    cancelButtonText: 'Hapana, Acha'
  }).then(result => {
    if (result.isConfirmed) {
      performStudentPromotion(decodedJina, currentDarasa, newDarasa, direction);
    }
  });
}

/**
 * Perform student promotion
 * @param {string} studentName - Student name
 * @param {string} oldDarasa - Current class
 * @param {string} newDarasa - New class
 * @param {string} direction - Direction
 */
function performStudentPromotion(studentName, oldDarasa, newDarasa, direction) {
  const data = {
    action: 'promoteSingleStudent',
    dbId: currentDbId,
    studentName: studentName,
    oldDarasa: oldDarasa,
    newDarasa: newDarasa
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    updateStudentPromotionCache(studentName, oldDarasa, newDarasa);
    Swal.fire({
      icon: 'success',
      title: 'Imefanikiwa',
      text: `Mwanafunzi amesogezwa nje ya mtandao. Data itasawazishwa ukiwa mtandaoni.`,
      confirmButtonColor: '#4361ee'
    }).then(() => loadStudents());
    return;
  }
  
  Notiflix.Loading.standard(`Inasogeza mwanafunzi ${direction === 'up' ? 'darasa la juu' : 'darasa la chini'}...`);
  
  apiRequest(data)
    .then(response => {
      Notiflix.Loading.remove();
      if (response.status === 'success') {
        updateStudentPromotionCache(studentName, oldDarasa, newDarasa);
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa',
          html: `
            <p>${response.message}</p>
            <p style="font-size: 14px; color: #666;">
              ${studentName} amesogezwa kutoka <strong>${oldDarasa}</strong> kwenda <strong>${newDarasa}</strong>
            </p>
          `,
          confirmButtonColor: '#4361ee'
        }).then(() => loadStudents());
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
      Notiflix.Loading.remove();
      addToOfflineQueue(data);
      updateStudentPromotionCache(studentName, oldDarasa, newDarasa);
      Swal.fire({
        icon: 'success',
        title: 'Imehifadhiwa Nje ya Mtandao',
        text: 'Mwanafunzi amesogezwa na data itasawazishwa ukiwa mtandaoni.',
        confirmButtonColor: '#4361ee'
      }).then(() => loadStudents());
    });
}

/**
 * Update student promotion cache
 * @param {string} studentName - Student name
 * @param {string} oldDarasa - Current class
 * @param {string} newDarasa - New class
 */
function updateStudentPromotionCache(studentName, oldDarasa, newDarasa) {
  // Update student cache
  const students = getCachedStudents(oldDarasa);
  const student = students.find(s => s.jina === studentName);
  
  if (student) {
    // Remove from old class
    setCachedStudents(oldDarasa, students.filter(s => s.jina !== studentName));
    
    // Add to new class
    const newStudents = getCachedStudents(newDarasa);
    newStudents.push(student);
    setCachedStudents(newDarasa, newStudents);
  }
}

/**
 * Load system settings
 */
function loadSystemSettings() {
  const cachedSettings = getCachedSystemSettings();
  
  if (cachedSettings.schoolName) {
    document.getElementById('schoolNameInput').value = cachedSettings.schoolName;
    document.getElementById('currentEmail').value = cachedSettings.ownerEmail || '';
    document.getElementById('schoolNameSystemSettings').textContent = cachedSettings.schoolName;
  }
  
  if (!isOnline() || !currentDbId) return;
  
  apiRequest({
    action: 'getSystemSettings',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      const settings = {
        schoolName: data.schoolName,
        ownerEmail: data.ownerEmail,
        timestamp: Date.now()
      };
      setCachedSystemSettings(settings);
      
      document.getElementById('schoolNameInput').value = data.schoolName;
      document.getElementById('currentEmail').value = data.ownerEmail;
      document.getElementById('schoolNameSystemSettings').textContent = data.schoolName;
    }
  })
  .catch(error => {
    console.log('Background sync failed for system settings:', error);
  });
}

/**
 * Manual preload data
 */
function manualPreloadData() {
  if (!isOnline()) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtandao',
      text: 'Kupakia data kunahitaji mtandao',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: 'Pakia Data',
    html: `
      <div style="text-align: left;">
        <p>Hii itapakia data ya mihula yote na wanafunzi kwenye cache ya mfumo.</p>
        <div style="margin: 15px 0; padding: 10px; background: #f0f9ff; border-radius: 5px;">
          <p><strong>Data itakayopakuliwa:</strong></p>
          <p>• Orodha ya mihula yote</p>
          <p>• Alama za kila muhula kwa kila darasa</p>
          <p>• Orodha ya wanafunzi wote</p>
          <p>• Mipangilio ya madaraja</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Muda: <strong>dakika 1-2</strong> kulingana na kasi ya mtandao
        </p>
      </div>
    `,
    icon: 'info',
    showCancelButton: true,
    confirmButtonText: 'Ndio, Pakia',
    cancelButtonText: 'Ghairi',
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585'
  }).then(result => {
    if (result.isConfirmed) {
      Notiflix.Loading.standard('Inapakia data... Inachukua dakika 1-2');
      
      const startTime = Date.now();
      preloadAllData();
      
      setTimeout(() => {
        Notiflix.Loading.remove();
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        Swal.fire({
          icon: 'success',
          title: 'Imepakuliwa',
          html: `
            <div style="text-align: left;">
              <p>Data zimepakuliwa kikamilifu kwenye cache ya mfumo.</p>
              <div style="margin: 15px 0; padding: 10px; background: #f0fff4; border-radius: 5px;">
                <p><strong>Taarifa:</strong></p>
                <p>• Muda uliotumika: ${duration} sekunde</p>
                <p>• Data iko tayari kwa matumizi ya offline</p>
                <p>• Cache itasasishwa kila saa 1 automatikali</p>
              </div>
              <p style="color: #666; font-size: 14px;">
                Data hii itatumika wakati mfumo uko nje ya mtandao.
              </p>
            </div>
          `,
          confirmButtonColor: '#4361ee'
        });
      }, 3000);
    }
  });
}

/**
 * Preload all data
 */
function preloadAllData() {
  if (!currentDbId || !isOnline()) return;
  
  // Load terms
  apiRequest({
    action: 'listTerms',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedTerms(data.terms);
      
      // Load students for each class
      CONFIG.CLASSES.forEach(darasa => {
        apiRequest({
          action: 'listStudents',
          dbId: currentDbId,
          darasa: darasa
        })
        .then(studentData => {
          if (studentData.status === 'success') {
            setCachedStudents(darasa, studentData.students);
          }
        })
        .catch(error => console.log('Error preloading students:', error));
      });
      
      // Load grade settings for each class
      CONFIG.CLASSES.forEach(darasa => {
        apiRequest({
          action: 'getGradeSettings',
          dbId: currentDbId,
          darasa: darasa
        })
        .then(gradeData => {
          if (gradeData.status === 'success') {
            setCachedGradeSettings(darasa, gradeData.grades);
          }
        })
        .catch(error => console.log('Error preloading grade settings:', error));
      });
    }
  })
  .catch(error => console.log('Error preloading terms:', error));
}

/**
 * Auto preload data
 */
function autoPreloadData() {
  if (!isOnline()) return;
  
  const lastPreload = localStorage.getItem('lastDataPreload');
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  
  if (!lastPreload || (now - parseInt(lastPreload)) > oneHour) {
    console.log('Auto-preloading data...');
    preloadAllData();
    localStorage.setItem('lastDataPreload', now.toString());
  }
}