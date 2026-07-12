// ============================================
// SUBJECT MANAGEMENT
// ============================================

/**
 * Register a subject
 */
function registerSubject() {
  const somo = document.getElementById('subjectName').value.trim();

  if (!somo) {
    Swal.fire({
      icon: 'warning',
      title: 'Taarifa Zinakosekana',
      text: 'Tafadhali jaza jina la somo',
      confirmButtonColor: '#4361ee',
      timer: 2000
    });
    return;
  }

  const registerBtn = document.getElementById('registerSubjectBtn');
  const originalHTML = registerBtn.innerHTML;
  registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inasajili...';
  registerBtn.disabled = true;

  const data = {
    action: 'registerSubject',
    dbId: currentDbId,
    somo: somo
  };

  if (!isOnline()) {
    addToOfflineQueue(data);
    updateSubjectCache(somo);
    registerBtn.innerHTML = originalHTML;
    registerBtn.disabled = false;
    Swal.fire({
      icon: 'success',
      title: 'Imefanikiwa',
      text: 'Somo limesajiliwa nje ya mtandao. Data itasawazishwa ukiwa mtandaoni.',
      confirmButtonColor: '#4361ee',
      timer: 2000
    }).then(() => {
      document.getElementById('subjectName').value = '';
      loadSubjects();
    });
    return;
  }

  apiRequest(data)
    .then(data => {
      registerBtn.innerHTML = originalHTML;
      registerBtn.disabled = false;
      
      if (data.status === 'success') {
        updateSubjectCache(somo);
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa',
          text: data.message,
          confirmButtonColor: '#4361ee',
          timer: 2000
        }).then(() => {
          document.getElementById('subjectName').value = '';
          loadSubjects();
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
      registerBtn.innerHTML = originalHTML;
      registerBtn.disabled = false;
      addToOfflineQueue(data);
      updateSubjectCache(somo);
      Swal.fire({
        icon: 'success',
        title: 'Imefanikiwa',
        text: 'Somo limesajiliwa nje ya mtandao. Data itasawazishwa ukiwa mtandaoni.',
        confirmButtonColor: '#4361ee',
        timer: 2000
      }).then(() => {
        document.getElementById('subjectName').value = '';
        loadSubjects();
      });
    });
}

/**
 * Update subject cache
 * @param {string} somo - Subject name
 */
function updateSubjectCache(somo) {
  const subjects = getCachedSubjects();
  const exists = subjects.some(s => s.somo === somo);
  if (!exists) {
    subjects.push({ somo: somo });
    setCachedSubjects(subjects);
  }
}

/**
 * Load subjects
 */
function loadSubjects() {
  const tableBody = document.getElementById('subjectsTable').getElementsByTagName('tbody')[0];
  const subjectSelect = document.getElementById('subjectSelect');
  
  if (tableBody) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="2" style="text-align: center; padding: 40px;">
          <div class="loading-spinner" style="width: 24px; height: 24px; margin: 0 auto;"></div>
          <p style="margin-top: 10px;">Inapakia orodha ya masomo...</p>
        </td>
      </tr>
    `;
  }
  
  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">Chagua Somo</option>';
  }

  // Load from cache
  const cachedSubjects = getCachedSubjects();
  if (cachedSubjects.length > 0) {
    subjects = cachedSubjects;
    displaySubjects(subjects);
  }

  if (!isOnline() || !currentDbId) {
    if (cachedSubjects.length === 0 && tableBody) {
      tableBody.innerHTML = '<tr><td colspan="2" style="text-align: center;">Hakuna masomo yaliyosajiliwa</td></tr>';
    }
    return;
  }

  apiRequest({
    action: 'listSubjects',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      subjects = data.subjects;
      setCachedSubjects(subjects);
      displaySubjects(subjects);
    } else if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: #f44336;">${data.message}</td></tr>`;
    }
  })
  .catch(error => {
    if (subjects.length === 0 && tableBody) {
      tableBody.innerHTML = '<tr><td colspan="2" style="text-align: center; color: #f44336;">Hitilafu ya mtandao</td></tr>';
    }
  });
}

/**
 * Display subjects
 * @param {Array} subjectsArray - Subjects array
 */
function displaySubjects(subjectsArray) {
  const tableBody = document.querySelector('#subjectsTable tbody');
  const subjectSelect = document.getElementById('subjectSelect');
  
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (subjectSelect) {
    subjectSelect.innerHTML = '<option value="">-- Chagua Somo --</option>';
  }
  
  if (!subjectsArray || subjectsArray.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 40px;">Hakuna masomo yaliyosajiliwa</td></tr>';
    return;
  }
  
  subjectsArray.forEach((subject, index) => {
    const row = tableBody.insertRow();
    const safeSubject = subject.somo;
    
    row.innerHTML = `
      <td style="text-align: center; width: 50px;">${index + 1}</td>
      <td>${escapeHtml(safeSubject)}</td>
      <td style="text-align: center;">
        <button class="btn-action btn-edit" onclick="editSubject('${safeEncodeName(safeSubject)}')">
          <i class="fas fa-edit"></i> Hariri
        </button>
        <button class="btn-action btn-delete" onclick="deleteSubject('${safeEncodeName(safeSubject)}')">
          <i class="fas fa-trash-alt"></i> Futa
        </button>
      </td>
    `;
    
    // Add to subject select dropdown
    if (subjectSelect) {
      const option = document.createElement('option');
      option.value = safeSubject;
      option.textContent = safeSubject;
      subjectSelect.appendChild(option);
    }
  });
}

/**
 * Edit subject
 * @param {string} encodedSomo - Encoded subject name
 */
function editSubject(encodedSomo) {
  const decodedSomo = safeDecodeName(encodedSomo);
  
  if (!decodedSomo) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Jina la somo halijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: 'Hariri Somo',
    html: `
      <div class="input-group" style="margin-bottom: 15px;">
        <label for="editSubjectName" style="display: block; margin-bottom: 5px; font-weight: 500;">Jina la Somo</label>
        <input type="text" id="editSubjectName" class="swal2-input" value="${escapeHtml(decodedSomo)}" style="width: 100%; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-save"></i> Hifadhi',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    preConfirm: () => {
      const newSomo = document.getElementById('editSubjectName').value.trim();
      if (!newSomo) {
        Swal.showValidationMessage('Jina la somo ni lazima');
        return false;
      }
      if (newSomo === decodedSomo) {
        Swal.showValidationMessage('Jina la somo halijabadilika');
        return false;
      }
      return newSomo;
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      performEditSubject(decodedSomo, result.value);
    }
  });
}

/**
 * Perform edit subject
 * @param {string} oldSomo - Current subject name
 * @param {string} newSomo - New subject name
 */
function performEditSubject(oldSomo, newSomo) {
  const data = {
    action: 'editSubject',
    dbId: currentDbId,
    oldSomo: oldSomo,
    newSomo: newSomo
  };

  if (!isOnline()) {
    addToOfflineQueue(data);
    updateSubjectEditCache(oldSomo, newSomo);
    Swal.fire({
      icon: 'success',
      title: 'Imehifadhiwa Nje ya Mtandao',
      text: 'Somo limehaririwa na data itasawazishwa baadaye',
      confirmButtonColor: '#4361ee'
    }).then(() => {
      loadSubjects();
      loadResults();
      loadReport();
    });
    return;
  }

  Notiflix.Loading.standard('Inahariri somo...');

  apiRequest(data)
    .then(response => {
      Notiflix.Loading.remove();
      if (response.status === 'success') {
        updateSubjectEditCache(oldSomo, newSomo);
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa',
          text: response.message,
          confirmButtonColor: '#4361ee',
          timer: 2000
        }).then(() => {
          loadSubjects();
          loadResults();
          loadReport();
        });
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
      updateSubjectEditCache(oldSomo, newSomo);
      Swal.fire({
        icon: 'success',
        title: 'Imehifadhiwa Nje ya Mtandao',
        text: 'Somo limehaririwa na data itasawazishwa baadaye',
        confirmButtonColor: '#4361ee'
      }).then(() => {
        loadSubjects();
        loadResults();
        loadReport();
      });
    });
}

/**
 * Update subject edit cache
 * @param {string} oldSomo - Current subject name
 * @param {string} newSomo - New subject name
 */
function updateSubjectEditCache(oldSomo, newSomo) {
  // Update subject cache
  const subjects = getCachedSubjects();
  const updated = subjects.map(s => 
    s.somo === oldSomo ? { somo: newSomo } : s
  );
  setCachedSubjects(updated);
  subjects = updated;

  // Update selected subjects cache
  const selectedCache = getCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, {});
  for (const darasa in selectedCache) {
    selectedCache[darasa] = selectedCache[darasa].map(s => 
      s === oldSomo ? newSomo : s
    );
  }
  setCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, selectedCache);

  // Update results and report caches
  const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  for (const darasa in resultsCache) {
    for (const termId in resultsCache[darasa]) {
      resultsCache[darasa][termId] = resultsCache[darasa][termId].map(result => {
        if (result.scores && result.scores[oldSomo] !== undefined) {
          result.scores[newSomo] = result.scores[oldSomo];
          delete result.scores[oldSomo];
        }
        return result;
      });
    }
  }
  setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
}

/**
 * Delete subject
 * @param {string} encodedSomo - Encoded subject name
 */
function deleteSubject(encodedSomo) {
  const decodedSomo = safeDecodeName(encodedSomo);
  
  if (!decodedSomo) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Jina la somo halijapatikana',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: 'Thibitisha Kufuta Somo',
    html: `
      <div style="text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f72585; margin-bottom: 15px;"></i>
        <p>Una uhakika unataka kufuta somo:</p>
        <p style="font-weight: bold; color: #4361ee; font-size: 18px; margin: 10px 0;">"${escapeHtml(decodedSomo)}"</p>
        <p style="color: #f72585; font-size: 12px; margin-top: 15px;">⚠️ Hii itafuta alama zote za somo hili!</p>
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
      performDeleteSubject(decodedSomo);
    }
  });
}

/**
 * Perform delete subject
 * @param {string} somo - Subject name
 */
function performDeleteSubject(somo) {
  const data = {
    action: 'deleteSubject',
    dbId: currentDbId,
    somo: somo
  };

  if (!isOnline()) {
    addToOfflineQueue(data);
    updateSubjectDeleteCache(somo);
    Swal.fire({
      icon: 'success',
      title: 'Imehifadhiwa Nje ya Mtandao',
      text: 'Somo limefutwa na data itasawazishwa baadaye',
      confirmButtonColor: '#4361ee'
    }).then(() => {
      loadSubjects();
      loadResults();
      loadReport();
    });
    return;
  }

  Notiflix.Loading.standard('Inafuta somo...');

  apiRequest(data)
    .then(response => {
      Notiflix.Loading.remove();
      if (response.status === 'success') {
        updateSubjectDeleteCache(somo);
        Swal.fire({
          icon: 'success',
          title: 'Imefanikiwa',
          text: response.message,
          confirmButtonColor: '#4361ee',
          timer: 2000
        }).then(() => {
          loadSubjects();
          loadResults();
          loadReport();
        });
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
      updateSubjectDeleteCache(somo);
      Swal.fire({
        icon: 'success',
        title: 'Imehifadhiwa Nje ya Mtandao',
        text: 'Somo limefutwa na data itasawazishwa baadaye',
        confirmButtonColor: '#4361ee'
      }).then(() => {
        loadSubjects();
        loadResults();
        loadReport();
      });
    });
}

/**
 * Update subject delete cache
 * @param {string} somo - Subject name
 */
function updateSubjectDeleteCache(somo) {
  // Update subject cache
  const subjects = getCachedSubjects();
  setCachedSubjects(subjects.filter(s => s.somo !== somo));
  subjects = subjects.filter(s => s.somo !== somo);

  // Update selected subjects cache
  const selectedCache = getCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, {});
  for (const darasa in selectedCache) {
    selectedCache[darasa] = selectedCache[darasa].filter(s => s !== somo);
  }
  setCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, selectedCache);

  // Update results and report caches
  const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  for (const darasa in resultsCache) {
    for (const termId in resultsCache[darasa]) {
      resultsCache[darasa][termId] = resultsCache[darasa][termId].map(result => {
        if (result.scores) {
          delete result.scores[somo];
        }
        return result;
      });
    }
  }
  setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
}

/**
 * Confirm delete all subjects
 */
function confirmDeleteAllSubjects() {
  const subjectsList = getCachedSubjects();
  
  if (subjectsList.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Hakuna Masomo',
      text: 'Hakuna masomo ya kufuta.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Swal.fire({
    title: '⚠️ THIBITISHA KUFUTA MASOMO YOTE',
    html: `
      <div style="text-align: center; padding: 15px;">
        <div style="font-size: 64px; color: #f44336; margin-bottom: 20px;">⚠️</div>
        <p style="font-size: 16px; font-weight: bold; color: #f44336;">UNAHAKIKA UNATAKA KUFUTA MASOMO YOTE?</p>
        <p style="font-size: 14px; margin-top: 10px;">Jumla ya masomo: <strong>${subjectsList.length}</strong></p>
        <div style="background: #ffebee; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="font-size: 12px; color: #d32f2f; margin: 0;">
            <strong>ONYO:</strong> Kitendo hiki hakiwezi kufutwa! Matokeo yote ya masomo haya yatafutwa pia.
          </p>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'NDIO, FUTA YOTE',
    cancelButtonText: 'GHAIRI',
    confirmButtonColor: '#f44336',
    cancelButtonColor: '#4361ee'
  }).then(result => {
    if (result.isConfirmed) {
      deleteAllSubjects();
    }
  });
}

/**
 * Delete all subjects
 */
function deleteAllSubjects() {
  if (!isOnline()) {
    Swal.fire({
      icon: 'error',
      title: 'Hauko Mtandaoni',
      text: 'Huwezi kufuta masomo ukiwa nje ya mtandao.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  Notiflix.Loading.standard('Inafuta masomo yote...');

  apiRequest({
    action: 'deleteAllSubjects',
    dbId: currentDbId
  })
  .then(data => {
    Notiflix.Loading.remove();
    
    if (data.status === 'success') {
      // Clear all caches
      removeCache(CONFIG.CACHE_KEYS.SUBJECTS);
      removeCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS);
      removeCache(CONFIG.CACHE_KEYS.RESULTS);
      subjects = [];
      
      Swal.fire({
        icon: 'success',
        title: 'Imefanikiwa',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 64px; color: #4CAF50; margin-bottom: 20px;">✅</div>
            <p><strong>Masomo yote yamefutwa kikamilifu!</strong></p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">${data.deletedCount} masomo yamefutwa.</p>
          </div>
        `,
        confirmButtonColor: '#4361ee'
      }).then(() => {
        loadSubjects();
        loadResults();
        loadReport();
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
 * Download subject template
 */
function downloadSubjectTemplate() {
  if (!isOnline()) {
    Notiflix.Notify.warning('Huwezi kupakua kiolezo ukiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }

  const downloadBtn = document.querySelector('#subjectDashboard .btn-success[onclick="downloadSubjectTemplate()"]');
  let originalHTML = '';
  
  if (downloadBtn) {
    originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza...';
    downloadBtn.disabled = true;
  }

  apiRequest({
    action: 'downloadSubjectTemplate',
    dbId: currentDbId
  })
  .then(data => {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    }

    if (data.status !== 'success') {
      Notiflix.Notify.failure(data.message || 'Imeshindikana kutengeneza kiolezo', {
        timeout: 3000,
        position: 'right-top'
      });
      return;
    }

    // Convert base64 to blob
    const binary = atob(data.file);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: data.mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = data.fileName || 'Kiolezo_Usajili_Masomo.xlsx';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);

    Notiflix.Notify.success(`Kiolezo "${data.fileName}" kinapakuliwa`, {
      timeout: 2000,
      position: 'right-top'
    });
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
 * Upload subject template
 */
function uploadSubjectTemplate() {
  const fileInput = document.getElementById('subjectTemplateFile');
  const file = fileInput.files[0];

  if (!file) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Faili',
      text: 'Tafadhali chagua faili ya Excel iliyosajiliwa',
      confirmButtonColor: '#4361ee'
    });
    return;
  }

  if (!isOnline()) {
    Swal.fire({
      icon: 'error',
      title: 'Hauko Mtandaoni',
      text: 'Huwezi kupakia kiolezo ukiwa nje ya mtandao. Tafadhali unganisha kwanza.',
      confirmButtonColor: '#4361ee'
    });
    fileInput.value = '';
    return;
  }

  const validExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!isValidExtension) {
    Swal.fire({
      icon: 'error',
      title: 'Faili Si Sahihi',
      text: 'Tafadhali chagua faili ya Excel (.xlsx au .xls)',
      confirmButtonColor: '#4361ee'
    });
    fileInput.value = '';
    return;
  }

  const progressDiv = document.getElementById('subjectTemplateUploadProgress');
  const progressFill = document.getElementById('subjectTemplateProgressFill');
  const progressStatus = document.getElementById('subjectTemplateUploadStatus');
  
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
      action: 'uploadSubjectTemplate',
      dbId: currentDbId,
      fileName: file.name,
      fileData: base64Data
    })
    .then(data => {
      progressFill.style.width = '100%';
      
      if (data.status === 'success') {
        progressStatus.textContent = 'Imekamilika!';
        if (data.registeredSubjects) {
          data.registeredSubjects.forEach(subject => {
            updateSubjectCache(subject.somo);
          });
        }
        Swal.fire({
          icon: 'success',
          title: 'Usajili Umekamilika',
          html: `<div style="text-align: left;">
                  <p><strong>${data.message}</strong></p>
                  <p>Masomo yaliyosajiliwa: ${data.registeredCount}</p>
                  <p>Yaliokuwepo tayari: ${data.skippedCount}</p>
                </div>`,
          confirmButtonColor: '#4361ee'
        }).then(() => {
          fileInput.value = '';
          progressDiv.style.display = 'none';
          loadSubjects();
        });
      } else {
        progressStatus.textContent = 'Imeshindikana';
        Swal.fire({
          icon: 'error',
          title: 'Usajili Umeshindikana',
          text: data.message || 'Hitilafu katika usajili wa masomo',
          confirmButtonColor: '#4361ee'
        }).then(() => {
          fileInput.value = '';
          progressDiv.style.display = 'none';
        });
      }
    })
    .catch(error => {
      progressFill.style.width = '100%';
      progressStatus.textContent = 'Hitilafu ya mtandao';
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      }).then(() => {
        fileInput.value = '';
        progressDiv.style.display = 'none';
      });
    });
  };
  
  reader.onerror = function() {
    progressDiv.style.display = 'none';
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Imeshindikana kusoma faili',
      confirmButtonColor: '#4361ee'
    });
    fileInput.value = '';
  };
  
  reader.readAsArrayBuffer(file);
}

/**
 * Open subject tab
 * @param {string} tabName - Tab name
 * @param {HTMLElement} element - Clicked element
 */
function openSubjectTab(tabName, element) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  element.classList.add('active');
  document.getElementById(tabName).classList.add('active');
}