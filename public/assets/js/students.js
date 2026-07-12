// ============================================
// STUDENT MANAGEMENT
// ============================================

/**
 * Register a single student
 */
function registerStudent() {
  const jina = document.getElementById('studentName').value.trim();
  const jinsi = document.getElementById('jinsi').value;
  const darasa = document.getElementById('darasaRegister').value;

  if (!jina || !jinsi || !darasa) {
    Notiflix.Notify.warning('Tafadhali jaza jina, jinsi, na darasa', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }

  const registerBtn = document.getElementById('registerStudentBtn');
  const originalHTML = registerBtn.innerHTML;
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inasajili...';
  registerBtn.disabled = true;

  const data = {
    action: 'registerStudent',
    dbId: currentDbId,
    jina: jina,
    jinsi: jinsi,
    darasa: darasa
  };

  if (!isOnline()) {
    addToOfflineQueue(data);
    updateStudentCache(jina, jinsi, darasa);
    registerBtn.innerHTML = originalHTML;
    registerBtn.disabled = false;
    Notiflix.Notify.success('Mwanafunzi amesajiliwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    document.getElementById('studentName').value = '';
    document.getElementById('jinsi').value = '';
    loadStudents();
    return;
  }

  apiRequest(data)
    .then(response => {
      registerBtn.innerHTML = originalHTML;
      registerBtn.disabled = false;
      
      if (response.status === 'success') {
        updateStudentCache(jina, jinsi, darasa);
        Notiflix.Notify.success('Mwanafunzi amesajiliwa kikamilifu', {
          timeout: 2000,
          position: 'right-top'
        });
        document.getElementById('studentName').value = '';
        document.getElementById('jinsi').value = '';
        loadStudents();
      } else {
        Notiflix.Notify.failure(response.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      registerBtn.innerHTML = originalHTML;
      registerBtn.disabled = false;
      addToOfflineQueue(data);
      updateStudentCache(jina, jinsi, darasa);
      Notiflix.Notify.warning('Mwanafunzi amehifadhiwa kwenye cache. Itasawazishwa baadaye.', {
        timeout: 3000,
        position: 'right-top'
      });
      document.getElementById('studentName').value = '';
      document.getElementById('jinsi').value = '';
      loadStudents();
    });
}

/**
 * Update student cache
 * @param {string} jina - Student name
 * @param {string} jinsi - Gender
 * @param {string} darasa - Class name
 */
function updateStudentCache(jina, jinsi, darasa) {
  const students = getCachedStudents(darasa);
  const exists = students.some(s => s.jina === jina);
  if (!exists) {
    students.push({ jina: jina, jinsi: jinsi });
    setCachedStudents(darasa, students);
  }
}

/**
 * Load students for a class
 */
function loadStudents() {
  const darasa = document.getElementById('darasaList').value;
  updateStudentsSectionTitle(darasa);
  loadExitSheetsForDropdown();

  const tableBody = document.getElementById('studentsTableBody');
  if (!tableBody) return;

  // Check if it's an exit sheet
  if (darasa.startsWith('Darasa la Saba Exit_')) {
    loadExitSheetStudents(darasa);
    return;
  }

  // Load from cache
  const students = getCachedStudents(darasa);
  displayStudents(students, darasa);

  // Sync from server if online
  if (isOnline() && currentDbId) {
    apiRequest({
      action: 'listStudents',
      dbId: currentDbId,
      darasa: darasa
    })
    .then(data => {
      if (data.status === 'success') {
        setCachedStudents(darasa, data.students);
        displayStudents(data.students, darasa);
      }
    })
    .catch(error => {
      console.log('Background sync failed for students:', error);
    });
  }
}

/**
 * Display students in table
 * @param {Array} students - Students array
 * @param {string} darasa - Class name
 */
function displayStudents(students, darasa) {
  const tableBody = document.getElementById('studentsTableBody');
  if (!tableBody) return;

  if (!students || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon"><i class="fas fa-users-slash"></i></div>
            <h4>Hakuna Wanafunzi</h4>
            <p>Hakuna wanafunzi waliosajiliwa katika darasa la ${darasa}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  
  students.forEach((student, index) => {
    const row = tableBody.insertRow();
    
    row.innerHTML = `
      <td style="text-align: center;">${index + 1}</td>
      <td>
        <strong>${escapeHtml(student.jina)}</strong>
        ${student.jinsi === 'M' ? ' <span class="badge badge-primary"><i class="fas fa-mars"></i></span>' : ' <span class="badge badge-success"><i class="fas fa-venus"></i></span>'}
      </td>
      <td style="text-align: center;">${student.jinsi === 'M' ? 'M' : 'F'}</td>
      <td style="text-align: center;"><span class="badge badge-info"><i class="fas fa-chalkboard-user"></i> ${darasa}</span></td>
      <td style="text-align: center;">
        <div class="student-actions" style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
          <button class="btn-action btn-promote-up" onclick="promoteStudent('${safeEncodeName(student.jina)}', '${darasa}', 'up')" ${darasa === 'Darasa la Saba' ? 'disabled' : ''}>
            <i class="fas fa-arrow-up"></i>
          </button>
          <button class="btn-action btn-promote-down" onclick="promoteStudent('${safeEncodeName(student.jina)}', '${darasa}', 'down')" ${darasa === 'Awali' ? 'disabled' : ''}>
            <i class="fas fa-arrow-down"></i>
          </button>
          <button class="btn-action btn-edit" onclick="editStudent('${safeEncodeName(student.jina)}', '${student.jinsi}', '${darasa}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-action btn-delete" onclick="deleteStudent('${safeEncodeName(student.jina)}', '${darasa}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
  });
}

/**
 * Update students section title
 * @param {string} darasa - Class name
 */
function updateStudentsSectionTitle(darasa) {
  const container = document.getElementById('dynamicSectionTitle');
  if (!container) return;
  
  if (darasa.startsWith('Darasa la Saba Exit_')) {
    const displayName = formatExitSheetName(darasa);
    container.innerHTML = `<h3>👥 Orodha ya Wahitimu wa ${displayName}</h3>`;
  } else {
    container.innerHTML = `<h3>👥 Orodha ya Wanafunzi wa ${darasa}</h3>`;
  }
}

/**
 * Load exit sheets for dropdown
 */
function loadExitSheetsForDropdown() {
  const optgroup = document.getElementById('exitSheetsOptgroup');
  if (!optgroup) return;

  const exitSheets = getCachedExitSheets();
  if (exitSheets.length > 0) {
    populateExitSheetsDropdown(exitSheets);
  }

  if (!isOnline() || !currentDbId) return;

  apiRequest({
    action: 'getAllExitSheets',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedExitSheets(data.exitSheets);
      populateExitSheetsDropdown(data.exitSheets);
    }
  })
  .catch(error => {
    console.log('Failed to load exit sheets:', error);
  });
}

/**
 * Populate exit sheets dropdown
 * @param {Array} exitSheets - Exit sheets array
 */
function populateExitSheetsDropdown(exitSheets) {
  const optgroup = document.getElementById('exitSheetsOptgroup');
  if (!optgroup) return;
  
  if (!exitSheets || exitSheets.length === 0) {
    optgroup.innerHTML = '<option value="" disabled>⚠️ Hakuna Exit Sheets</option>';
    return;
  }

  const sortedSheets = exitSheets.sort((a, b) => b.name.localeCompare(a.name));
  let optionsHTML = '';
  
  sortedSheets.forEach(sheet => {
    const displayName = formatExitSheetName(sheet.name);
    optionsHTML += `
      <option value="${sheet.name}">
        📋 ${displayName} (${sheet.studentCount} wahitimu)
      </option>
    `;
  });
  
  optgroup.innerHTML = optionsHTML;
}

/**
 * Load exit sheet students
 * @param {string} exitSheetName - Exit sheet name
 */
function loadExitSheetStudents(exitSheetName) {
  const tableBody = document.getElementById('studentsTableBody');
  if (!tableBody) return;

  if (!isOnline()) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon">📡</div>
            <h4>Hitaji Mtandao</h4>
            <p>Kupakia orodha ya wahitimu kunahitaji muunganisho wa mtandao</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  Notiflix.Loading.standard('Inapakia orodha ya wahitimu...');

  apiRequest({
    action: 'getExitSheetStudents',
    dbId: currentDbId,
    sheetName: exitSheetName
  })
  .then(data => {
    Notiflix.Loading.remove();
    if (data.status === 'success') {
      displayExitSheetStudents(data.students, exitSheetName);
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
 * Display exit sheet students
 * @param {Array} students - Students array
 * @param {string} exitSheetName - Exit sheet name
 */
function displayExitSheetStudents(students, exitSheetName) {
  const tableBody = document.getElementById('studentsTableBody');
  if (!tableBody) return;

  const displayName = formatExitSheetName(exitSheetName);

  if (!students || students.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 40px;">
          <div class="empty-state">
            <div class="empty-state-icon">🎓</div>
            <h4>Hakuna Wahitimu</h4>
            <p>Hakuna wanafunzi waliohitimu katika ${displayName}</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  
  students.forEach((student, index) => {
    const row = tableBody.insertRow();
    row.innerHTML = `
      <td style="text-align: center;">${index + 1}</td>
      <td>
        <strong>${escapeHtml(student.jina)}</strong>
        ${student.jinsi === 'M' ? ' <span class="badge badge-primary">👦</span>' : ' <span class="badge badge-success">👧</span>'}
      </td>
      <td style="text-align: center;">${student.jinsi === 'M' ? 'Mume' : 'Mke'}</td>
      <td style="text-align: center;">
        <span class="badge badge-info">${displayName}</span>
        <br>
        <small style="color: #666;">${student.mwaka || ''} ${student.mwezi || ''}</small>
      </td>
      <td style="text-align: center;">
        <button class="btn-action btn-primary" onclick="openExitSheet('${exitSheetName}')" title="Fungua Sheet">
          <i class="fas fa-external-link-alt"></i> Fungua
        </button>
      </td>
    `;
  });
}

/**
 * Edit student
 * @param {string} encodedJina - Encoded student name
 * @param {string} jinsi - Gender
 * @param {string} darasa - Class name
 */
function editStudent(encodedJina, jinsi, darasa) {
  const decodedJina = safeDecodeName(encodedJina);
  
  if (!decodedJina) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Jina la mwanafunzi halijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: 'Hariri Mwanafunzi',
    html: `
      <div class="input-group" style="margin-bottom: 15px;">
        <label for="editStudentName" style="display: block; margin-bottom: 5px; font-weight: 500;">Jina la Mwanafunzi</label>
        <input type="text" id="editStudentName" class="swal2-input" value="${escapeHtml(decodedJina)}" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
      </div>
      <div class="input-group">
        <label for="editJinsi" style="display: block; margin-bottom: 5px; font-weight: 500;">Jinsi</label>
        <select id="editJinsi" class="swal2-select" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
          <option value="M" ${jinsi === 'M' ? 'selected' : ''}>Mume (M)</option>
          <option value="F" ${jinsi === 'F' ? 'selected' : ''}>Mke (F)</option>
        </select>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-save"></i> Hifadhi',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    preConfirm: () => {
      const newJina = document.getElementById('editStudentName').value.trim();
      const newJinsi = document.getElementById('editJinsi').value;
      if (!newJina) {
        Swal.showValidationMessage('Jina la mwanafunzi ni lazima');
        return false;
      }
      return { newJina, newJinsi };
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      const { newJina, newJinsi } = result.value;
      
      const data = {
        action: 'editStudent',
        dbId: currentDbId,
        oldJina: decodedJina,
        newJina: newJina,
        jinsi: newJinsi,
        darasa: darasa
      };

      if (!isOnline()) {
        addToOfflineQueue(data);
        updateEditCache(decodedJina, newJina, newJinsi, darasa);
        Swal.fire({
          icon: 'success',
          title: 'Imehifadhiwa Nje ya Mtandao',
          text: 'Mabadiliko yatasawazishwa ukiwa mtandaoni',
          confirmButtonColor: '#4361ee'
        }).then(() => loadStudents());
        return;
      }

      Notiflix.Loading.standard('Inahifadhi mabadiliko...');

      apiRequest(data)
        .then(response => {
          Notiflix.Loading.remove();
          if (response.status === 'success') {
            updateEditCache(decodedJina, newJina, newJinsi, darasa);
            Swal.fire({
              icon: 'success',
              title: 'Imefanikiwa',
              text: response.message,
              confirmButtonColor: '#4361ee',
              timer: 2000
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
          updateEditCache(decodedJina, newJina, newJinsi, darasa);
          Swal.fire({
            icon: 'success',
            title: 'Imehifadhiwa Nje ya Mtandao',
            text: 'Mabadiliko yatasawazishwa ukiwa mtandaoni',
            confirmButtonColor: '#4361ee'
          }).then(() => loadStudents());
        });
    }
  });
}

/**
 * Update edit cache
 * @param {string} oldJina - Old name
 * @param {string} newJina - New name
 * @param {string} newJinsi - New gender
 * @param {string} darasa - Class name
 */
function updateEditCache(oldJina, newJina, newJinsi, darasa) {
  // Update student cache
  const students = getCachedStudents(darasa);
  const updated = students.map(s => 
    s.jina === oldJina ? { jina: newJina, jinsi: newJinsi } : s
  );
  setCachedStudents(darasa, updated);

  // Update results cache
  const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  if (resultsCache[darasa]) {
    for (const termId in resultsCache[darasa]) {
      resultsCache[darasa][termId] = resultsCache[darasa][termId].map(r =>
        r.jina === oldJina ? { ...r, jina: newJina, jinsi: newJinsi } : r
      );
    }
    setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
  }
}

/**
 * Delete student
 * @param {string} encodedJina - Encoded student name
 * @param {string} darasa - Class name
 */
function deleteStudent(encodedJina, darasa) {
  const decodedJina = safeDecodeName(encodedJina);
  
  if (!decodedJina) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Jina la mwanafunzi halijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: 'Thibitisha Kufuta',
    html: `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f72585; margin-bottom: 15px;"></i>
        <p>Una uhakika unataka kumfuta mwanafunzi:</p>
        <p style="font-weight: bold; color: #4361ee; font-size: 18px; margin: 10px 0;">"${escapeHtml(decodedJina)}"</p>
        <p>kutoka darasa la <strong>${darasa}</strong>?</p>
        <p style="color: #f72585; font-size: 12px; margin-top: 15px;">⚠️ Hii itafuta alama zote za mwanafunzi huyu!</p>
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
      const data = {
        action: 'deleteStudent',
        dbId: currentDbId,
        jina: decodedJina,
        darasa: darasa
      };

      if (!isOnline()) {
        addToOfflineQueue(data);
        updateDeleteCache(decodedJina, darasa);
        Swal.fire({
          icon: 'success',
          title: 'Imehifadhiwa Nje ya Mtandao',
          text: 'Mwanafunzi amefutwa na data itasawazishwa baadaye',
          confirmButtonColor: '#4361ee'
        }).then(() => loadStudents());
        return;
      }

      Notiflix.Loading.standard('Inafuta mwanafunzi...');

      apiRequest(data)
        .then(response => {
          Notiflix.Loading.remove();
          if (response.status === 'success') {
            updateDeleteCache(decodedJina, darasa);
            Swal.fire({
              icon: 'success',
              title: 'Imefanikiwa',
              text: response.message,
              confirmButtonColor: '#4361ee',
              timer: 2000
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
          updateDeleteCache(decodedJina, darasa);
          Swal.fire({
            icon: 'success',
            title: 'Imehifadhiwa Nje ya Mtandao',
            text: 'Mwanafunzi amefutwa na data itasawazishwa baadaye',
            confirmButtonColor: '#4361ee'
          }).then(() => loadStudents());
        });
    }
  });
}

/**
 * Update delete cache
 * @param {string} studentName - Student name
 * @param {string} darasa - Class name
 */
function updateDeleteCache(studentName, darasa) {
  // Update student cache
  const students = getCachedStudents(darasa);
  setCachedStudents(darasa, students.filter(s => s.jina !== studentName));

  // Update results cache
  const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  if (resultsCache[darasa]) {
    for (const termId in resultsCache[darasa]) {
      resultsCache[darasa][termId] = resultsCache[darasa][termId].filter(r => r.jina !== studentName);
    }
    setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
  }
}

/**
 * Confirm delete all students
 */
function confirmDeleteAllStudents() {
  const darasa = document.getElementById('darasaList').value;
  const students = getCachedStudents(darasa);
  
  if (students.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Hakuna Wanafunzi',
      text: `Hakuna wanafunzi waliosajiliwa katika darasa la ${darasa}`,
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: 'THIBITISHA KUFUTA WOTE',
    html: `
      <div style="text-align: left;">
        <p style="color: #f72585; font-weight: bold; margin-bottom: 15px;">
          ⚠️ UNAHAKIKA UNATAKA KUFUTA WANAFUNZI WOTE WA DARASA LA <strong>${darasa}</strong>?
        </p>
        <p style="margin-bottom: 10px;">📊 Wanafunzi ${students.length} watafutwa:</p>
        <ul style="text-align: left; margin-left: 20px; max-height: 150px; overflow-y: auto;">
          ${students.slice(0, 10).map(s => `<li>• ${s.jina} (${s.jinsi})</li>`).join('')}
          ${students.length > 10 ? `<li>• ... na wengineo (${students.length - 10} zaidi)</li>` : ''}
        </ul>
        <p style="color: #f72585; font-size: 14px; margin-top: 15px;">
          🔴 HATUA HII HAWEZI KUTENDEULIWA! DATA ZOTE ZITAPOTEKA KWA KUDUMU!
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f72585',
    cancelButtonColor: '#4361ee',
    confirmButtonText: 'Ndio, Futa Wote',
    cancelButtonText: 'Hapana, Acha'
  }).then(result => {
    if (result.isConfirmed) {
      deleteAllStudents(darasa);
    }
  });
}

/**
 * Delete all students
 * @param {string} darasa - Class name
 */
function deleteAllStudents(darasa) {
  const students = getCachedStudents(darasa);
  if (students.length === 0) return;

  const data = {
    action: 'deleteAllStudents',
    dbId: currentDbId,
    darasa: darasa
  };

  if (!isOnline()) {
    students.forEach(student => {
      addToOfflineQueue({
        action: 'deleteStudent',
        dbId: currentDbId,
        jina: student.jina,
        darasa: darasa
      });
    });
    clearStudentCaches(darasa);
    Swal.fire({
      icon: 'success',
      title: 'Imefanikiwa',
      text: `Wanafunzi ${students.length} wamefutwa nje ya mtandao`,
      confirmButtonColor: '#4361ee'
    }).then(() => loadStudents());
    return;
  }

  Notiflix.Loading.standard(`Inafuta wanafunzi ${students.length}...`);

  apiRequest(data)
    .then(response => {
      Notiflix.Loading.remove();
      if (response.status === 'success') {
        clearStudentCaches(darasa);
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa',
          text: response.message,
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
      students.forEach(student => {
        addToOfflineQueue({
          action: 'deleteStudent',
          dbId: currentDbId,
          jina: student.jina,
          darasa: darasa
        });
      });
      clearStudentCaches(darasa);
      Swal.fire({
        icon: 'success',
        title: 'Imehifadhiwa Nje ya Mtandao',
        text: `Wanafunzi ${students.length} wamefutwa na data itasawazishwa baadaye`,
        confirmButtonColor: '#4361ee'
      }).then(() => loadStudents());
    });
}

/**
 * Clear student caches
 * @param {string} darasa - Class name
 */
function clearStudentCaches(darasa) {
  // Clear student cache
  const studentCache = getCache(CONFIG.CACHE_KEYS.STUDENTS, {});
  delete studentCache[darasa];
  setCache(CONFIG.CACHE_KEYS.STUDENTS, studentCache);

  // Clear results cache
  const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  delete resultsCache[darasa];
  setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
}

/**
 * Download student template
 */
function downloadStudentTemplate() {
  const darasa = document.getElementById('darasaTemplate').value;
  
  if (!darasa) {
    Notiflix.Notify.warning('Tafadhali chagua darasa kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }

  if (!isOnline()) {
    Notiflix.Notify.warning('Huwezi kupakua kiolezo ukiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }

  const downloadBtn = document.querySelector('#studentDashboard .btn-success[onclick="downloadStudentTemplate()"]');
  let originalHTML = '';
  
  if (downloadBtn) {
    originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza...';
    downloadBtn.disabled = true;
  }

  apiRequest({
    action: 'downloadStudentTemplate',
    dbId: currentDbId,
    darasa: darasa
  })
  .then(data => {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    }
    
    if (data.status === 'success') {
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = `${darasa.replace(/ /g, '_')}_Usajili_Wanafunzi.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Notiflix.Notify.success(`Kiolezo cha ${darasa} kinapakuliwa`, {
        timeout: 2000,
        position: 'right-top'
      });
    } else {
      Notiflix.Notify.failure(data.message || 'Imeshindikana kutengeneza kiolezo', {
        timeout: 3000,
        position: 'right-top'
      });
    }
  })
  .catch(error => {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    }
    Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
      timeout: 3000,
      position: 'right-top'
    });
  });
}

/**
 * Upload student template
 */
function uploadStudentTemplate() {
  const fileInput = document.getElementById('studentTemplateFile');
  const file = fileInput.files[0];
  const darasa = document.getElementById('darasaTemplate').value;

  if (!file) {
    Notiflix.Notify.warning('Tafadhali chagua faili ya Excel', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }

  if (!darasa) {
    Notiflix.Notify.warning('Tafadhali chagua darasa kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    fileInput.value = '';
    return;
  }

  if (!isOnline()) {
    Notiflix.Notify.warning('Huwezi kupakia kiolezo ukiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    fileInput.value = '';
    return;
  }

  const validExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValidExtension) {
    Notiflix.Notify.warning('Tafadhali chagua faili ya Excel (.xlsx au .xls)', {
      timeout: 2000,
      position: 'right-top'
    });
    fileInput.value = '';
    return;
  }

  const progressDiv = document.getElementById('templateUploadProgress');
  const progressFill = document.getElementById('templateProgressFill');
  const progressStatus = document.getElementById('templateUploadStatus');
  
  progressDiv.style.display = 'block';
  progressFill.style.width = '10%';
  progressStatus.textContent = 'Inasoma faili...';

  const reader = new FileReader();
  
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    const base64Data = arrayBufferToBase64(arrayBuffer);
    
    progressFill.style.width = '30%';
    progressStatus.textContent = 'Inatuma faili kwa server...';
    
    apiRequest({
      action: 'uploadStudentTemplate',
      dbId: currentDbId,
      darasa: darasa,
      fileName: file.name,
      fileData: base64Data
    })
    .then(data => {
      progressFill.style.width = '100%';
      
      if (data.status === 'success') {
        progressStatus.textContent = 'Imekamilika!';
        if (data.registeredStudents) {
          data.registeredStudents.forEach(student => {
            updateStudentCache(student.jina, student.jinsi, darasa);
          });
        }
        Notiflix.Notify.success(data.message, {
          timeout: 3000,
          position: 'right-top'
        });
        fileInput.value = '';
        progressDiv.style.display = 'none';
        loadStudents();
      } else {
        progressStatus.textContent = 'Imeshindikana';
        Notiflix.Notify.failure(data.message || 'Hitilafu katika usajili', {
          timeout: 3000,
          position: 'right-top'
        });
        fileInput.value = '';
        progressDiv.style.display = 'none';
      }
    })
    .catch(error => {
      progressFill.style.width = '100%';
      progressStatus.textContent = 'Hitilafu';
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
      fileInput.value = '';
      progressDiv.style.display = 'none';
    });
  };
  
  reader.onerror = function() {
    progressDiv.style.display = 'none';
    Notiflix.Notify.failure('Imeshindikana kusoma faili', {
      timeout: 2000,
      position: 'right-top'
    });
    fileInput.value = '';
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * Open student tab
 * @param {string} tabName - Tab name
 * @param {HTMLElement} element - Clicked element
 */
function openStudentTab(tabName, element) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  element.classList.add('active');
  document.getElementById(tabName).classList.add('active');
  
  if (tabName === 'studentsList') {
    setTimeout(() => loadStudents(), 100);
  }
}