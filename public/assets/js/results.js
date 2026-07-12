// ============================================
// RESULTS MANAGEMENT
// ============================================

let autoSaveTimer = null;
let pendingSavesMap = new Map();
let saveQueue = [];
let isProcessingQueue = false;

// ============================================
// TERM MANAGEMENT
// ============================================

/**
 * Load terms for dropdowns
 */
function loadTerms() {
  const termSelect = document.getElementById('termSelect');
  const reportTermSelect = document.getElementById('termReport');
  const bulkTermSelect = document.getElementById('bulkTermSelect');
  
  if (!termSelect || !reportTermSelect) return;
  
  termSelect.innerHTML = '<option value="">Chagua Muhula</option>';
  reportTermSelect.innerHTML = '<option value="">Chagua Muhula</option>';
  if (bulkTermSelect) bulkTermSelect.innerHTML = '<option value="">Chagua Muhula</option>';
  
  // Load from cache
  const cachedTerms = getCachedTerms();
  if (cachedTerms.length > 0) {
    cachedTerms.forEach(term => {
      if (term && term.id && term.name) {
        termSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
        reportTermSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
        if (bulkTermSelect) bulkTermSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
      }
    });
  }
  
  if (!isOnline() || !currentDbId) return;
  
  apiRequest({
    action: 'listTerms',
    dbId: currentDbId
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedTerms(data.terms);
      
      // Only reload if terms changed
      const currentTerms = getCachedTerms();
      if (JSON.stringify(currentTerms) !== JSON.stringify(data.terms)) {
        termSelect.innerHTML = '<option value="">Chagua Muhula</option>';
        reportTermSelect.innerHTML = '<option value="">Chagua Muhula</option>';
        if (bulkTermSelect) bulkTermSelect.innerHTML = '<option value="">Chagua Muhula</option>';
        
        data.terms.forEach(term => {
          if (term && term.id && term.name) {
            termSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
            reportTermSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
            if (bulkTermSelect) bulkTermSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
          }
        });
      }
      
      if (data.terms.length === 0) {
        document.getElementById('currentTermInfo')?.classList?.add('hidden');
      }
    }
  })
  .catch(error => {
    console.log('Background sync failed for terms:', error);
  });
}

/**
 * Create new term
 */
function createNewTerm() {
  const termName = document.getElementById('newTermName').value.trim();
  
  if (!termName) {
    Swal.fire({
      icon: 'warning',
      title: 'Jina la Muhula Linakosekana',
      text: 'Tafadhali andika jina la muhula',
      confirmButtonColor: '#4361ee',
      timer: 1500
    });
    return;
  }
  
  const createBtn = document.querySelector('#manualEntry .system-settings-card .btn-primary');
  let originalHTML = '';
  
  if (createBtn) {
    originalHTML = createBtn.innerHTML;
    createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza...';
    createBtn.disabled = true;
  }
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const monthName = getMonthName(currentMonth);
  
  const data = {
    action: 'createTerm',
    dbId: currentDbId,
    termName: termName,
    termYear: currentYear,
    termMonth: currentMonth,
    monthName: monthName
  };
  
  if (!isOnline()) {
    if (createBtn) {
      createBtn.innerHTML = originalHTML;
      createBtn.disabled = false;
    }
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtandao',
      text: 'Kutengeneza muhula kunahitaji mtandao',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  apiRequest(data)
    .then(data => {
      if (createBtn) {
        createBtn.innerHTML = originalHTML;
        createBtn.disabled = false;
      }
      
      if (data.status === 'success') {
        document.getElementById('newTermName').value = '';
        loadTerms();
        Swal.fire({
          icon: 'success',
          title: 'Muhula umetengenezwa',
          showConfirmButton: false,
          timer: 1500
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
      if (createBtn) {
        createBtn.innerHTML = originalHTML;
        createBtn.disabled = false;
      }
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      });
    });
}

/**
 * Load term data
 */
function loadTermData() {
  const termId = document.getElementById('termSelect').value;
  
  if (!termId) {
    document.getElementById('currentTermInfo')?.classList?.add('hidden');
    return;
  }
  
  const terms = getCachedTerms();
  const term = terms.find(t => t.id === termId);
  if (term) {
    document.getElementById('selectedTermName').textContent = term.name;
    document.getElementById('currentTermInfo').classList.remove('hidden');
  }
  
  // Also update report dashboard term
  const reportTermSelect = document.getElementById('termReport');
  if (reportTermSelect && reportTermSelect.value !== termId) {
    reportTermSelect.value = termId;
    loadReport();
  }
  
  loadResults();
}

/**
 * Edit current term
 */
function editCurrentTerm() {
  const termId = document.getElementById('termSelect').value;
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Muhula Uliochaguliwa',
      text: 'Tafadhali chagua muhula kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const terms = getCachedTerms();
  const term = terms.find(t => t.id === termId);
  
  if (!term) {
    Swal.fire({
      icon: 'error',
      title: 'Muhula Haupatikani',
      text: 'Muhula uliochaguliwa haupatikani',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: 'Hariri Muhula',
    html: `
      <div style="text-align: left;">
        <div class="input-group" style="margin-bottom: 15px;">
          <label for="editTermName">Jina la Muhula</label>
          <input type="text" id="editTermName" value="${escapeHtml(term.name)}" class="swal2-input" style="width: 100%; padding: 10px;">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Hifadhi',
    cancelButtonText: 'Ghairi',
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    preConfirm: () => {
      const name = document.getElementById('editTermName').value.trim();
      if (!name) {
        Swal.showValidationMessage('Jina la muhula linahitajika');
        return false;
      }
      return { name };
    }
  }).then(result => {
    if (result.isConfirmed) {
      const { name } = result.value;
      
      const editBtn = document.querySelector('.system-settings-card .btn-warning');
      if (editBtn) {
        const originalText = editBtn.innerHTML;
        editBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahariri...';
        editBtn.disabled = true;
        
        if (!isOnline()) {
          Swal.fire({
            icon: 'warning',
            title: 'Hakuna Mtandao',
            text: 'Kuhariri muhula kunahitaji mtandao',
            confirmButtonColor: '#4361ee'
          }).then(() => {
            editBtn.innerHTML = originalText;
            editBtn.disabled = false;
          });
          return;
        }
        
        apiRequest({
          action: 'editTerm',
          dbId: currentDbId,
          termId: termId,
          termName: name,
          termYear: term.year
        })
        .then(data => {
          editBtn.innerHTML = originalText;
          editBtn.disabled = false;
          
          if (data.status === 'success') {
            const terms = getCachedTerms();
            const index = terms.findIndex(t => t.id === termId);
            if (index !== -1) {
              terms[index].name = name;
              setCachedTerms(terms);
            }
            Swal.fire({
              icon: 'success',
              title: 'Imefanikiwa',
              text: 'Muhula umehaririwa',
              confirmButtonColor: '#4361ee',
              timer: 2000
            }).then(() => {
              loadTerms();
              loadTermData();
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
          editBtn.innerHTML = originalText;
          editBtn.disabled = false;
          Swal.fire({
            icon: 'error',
            title: 'Hitilafu ya Mtandao',
            text: 'Imeshindikana kuwasiliana na server',
            confirmButtonColor: '#4361ee'
          });
        });
      }
    }
  });
}

/**
 * Delete current term
 */
function deleteCurrentTerm() {
  const termId = document.getElementById('termSelect').value;
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Muhula Uliochaguliwa',
      text: 'Tafadhali chagua muhula kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const terms = getCachedTerms();
  const term = terms.find(t => t.id === termId);
  
  Swal.fire({
    title: 'Thibitisha Kufuta Muhula',
    html: `
      <div style="text-align: left;">
        <p style="color: #f44336; font-weight: bold;">🔴 WARNING: HATUA HII HAWEZI KUREJESHWA!</p>
        <p>Una uhakika unataka kufuta muhula <strong>"${term?.name || termId}"</strong>?</p>
        <div style="margin: 15px 0; padding: 10px; background: #ffebee; border-radius: 5px;">
          <p><strong>VITENGO VYOTE VITAFUTWA:</strong></p>
          <p>• Alama zote za wanafunzi katika muhula huu</p>
          <p>• Sheets zote za muhula huu katika kila darasa</p>
          <p>• Orodha ya muhula huu</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Ili kuthibitisha, andika: <strong>${term?.name || termId}</strong>
        </p>
        <input type="text" id="confirmTermName" class="swal2-input" placeholder="Andika jina la muhula">
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#f44336',
    cancelButtonColor: '#4361ee',
    confirmButtonText: 'Ndio, Futa Kabisa',
    cancelButtonText: 'Ghairi',
    preConfirm: () => {
      const confirmName = document.getElementById('confirmTermName').value;
      if (confirmName !== (term?.name || termId)) {
        Swal.showValidationMessage('Jina halilingani na jina la muhula');
        return false;
      }
      return true;
    }
  }).then(result => {
    if (result.isConfirmed) {
      const deleteBtn = document.querySelector('.system-settings-card .btn-danger');
      if (deleteBtn) {
        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inafuta...';
        deleteBtn.disabled = true;
        
        if (!isOnline()) {
          Swal.fire({
            icon: 'warning',
            title: 'Hakuna Mtandao',
            text: 'Kufuta muhula kunahitaji mtandao',
            confirmButtonColor: '#4361ee'
          }).then(() => {
            deleteBtn.innerHTML = originalText;
            deleteBtn.disabled = false;
          });
          return;
        }
        
        apiRequest({
          action: 'deleteTerm',
          dbId: currentDbId,
          termId: termId
        })
        .then(data => {
          deleteBtn.innerHTML = originalText;
          deleteBtn.disabled = false;
          
          if (data.status === 'success') {
            const terms = getCachedTerms();
            setCachedTerms(terms.filter(t => t.id !== termId));
            
            const darasa = document.getElementById('darasaResults').value;
            const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
            if (resultsCache[darasa] && resultsCache[darasa][termId]) {
              delete resultsCache[darasa][termId];
              setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
            }
            
            Swal.fire({
              icon: 'success',
              title: 'Imefutwa',
              text: 'Muhula umefutwa kikamilifu',
              confirmButtonColor: '#4361ee'
            }).then(() => {
              document.getElementById('termSelect').value = '';
              document.getElementById('currentTermInfo').classList.add('hidden');
              loadTerms();
              loadResults();
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
          deleteBtn.innerHTML = originalText;
          deleteBtn.disabled = false;
          Swal.fire({
            icon: 'error',
            title: 'Hitilafu ya Mtandao',
            text: 'Imeshindikana kuwasiliana na server',
            confirmButtonColor: '#4361ee'
          });
        });
      }
    }
  });
}

// ============================================
// RESULTS ENTRY
// ============================================

/**
 * Load results for a class and term
 */
function loadResults() {
  const darasa = document.getElementById('darasaResults').value;
  const termId = document.getElementById('termSelect').value;
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  const headerRow = document.getElementById('resultsTableHeaders');
  
  if (!headerRow || !tbody) return;
  
  // Clear header but keep first two columns
  while (headerRow.cells.length > 2) {
    headerRow.deleteCell(2);
  }
  
  if (!termId) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 50px; color: #666;">
          <i class="fas fa-calendar-alt" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i>
          <p style="font-size: 16px; margin-bottom: 10px;">Chagua Muhula Kwanza</p>
          <p style="font-size: 14px; color: #888;">Tafadhali chagua muhula kwenye sehemu ya juu kabla ya kuingiza alama</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // Get selected subject
  const selectedSubjects = getCachedSelectedSubjects(darasa);
  const selectedSubject = selectedSubjects.length > 0 ? selectedSubjects[0] : null;
  
  // Add subject header if selected
  if (selectedSubject) {
    const th = document.createElement('th');
    th.textContent = selectedSubject;
    th.style.padding = '12px 8px';
    th.style.fontSize = '0.8125rem';
    th.style.fontWeight = '600';
    headerRow.appendChild(th);
  }
  
  // Load from cache
  const results = getCachedResults(darasa, termId);
  const students = getCachedStudents(darasa);
  
  if (results.length > 0) {
    displayStudentResults(results, selectedSubject, termId, darasa);
    showCacheIndicator(true);
  } else if (students.length > 0) {
    const emptyResults = students.map(student => ({
      jina: student.jina,
      jinsi: student.jinsi,
      scores: {}
    }));
    displayStudentResults(emptyResults, selectedSubject, termId, darasa);
    showCacheIndicator(true);
  } else {
    displayNoStudentsMessage(selectedSubject ? 1 : 0);
  }
  
  if (!isOnline() || !currentDbId) return;
  
  // Sync from server
  apiRequest({
    action: 'listTermResults',
    dbId: currentDbId,
    darasa: darasa,
    termId: termId
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedResults(darasa, termId, data.results);
      
      // Update student cache
      if (data.results.length > 0) {
        const students = data.results.map(r => ({ jina: r.jina, jinsi: r.jinsi }));
        setCachedStudents(darasa, students);
      }
      
      // Check if data changed and update display
      const currentResults = getCurrentDisplayedResults();
      if (JSON.stringify(currentResults) !== JSON.stringify(data.results)) {
        displayStudentResults(data.results, selectedSubject, termId, darasa);
        hideCacheIndicator();
      }
    }
  })
  .catch(error => {
    console.log('Background sync failed for results:', error);
  });
}

/**
 * Display student results in table
 * @param {Array} results - Results array
 * @param {string} selectedSubject - Selected subject
 * @param {string} termId - Term ID
 * @param {string} darasa - Class name
 */
function displayStudentResults(results, selectedSubject, termId, darasa) {
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  if (!results || results.length === 0) {
    displayNoStudentsMessage(selectedSubject ? 1 : 0);
    return;
  }
  
  // Sort students: Boys first, then Girls
  const sortedResults = sortStudentsAlphabetically(results);
  
  sortedResults.forEach(result => {
    if (!result || !result.jina) return;
    
    const row = tbody.insertRow();
    
    // Name cell
    const nameCell = row.insertCell(0);
    nameCell.textContent = result.jina;
    nameCell.style.fontWeight = '500';
    nameCell.style.padding = '12px 8px';
    
    // Gender cell
    const genderCell = row.insertCell(1);
    genderCell.textContent = result.jinsi === 'M' ? 'M' : 'F';
    genderCell.style.padding = '12px 8px';
    genderCell.style.textAlign = 'center';
    
    // Subject score cell with auto-save
    if (selectedSubject) {
      const cell = row.insertCell(-1);
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.max = '100';
      input.className = 'score-input';
      input.setAttribute('data-subject', selectedSubject);
      input.setAttribute('data-student', result.jina);
      input.setAttribute('data-term', termId);
      
      const scoreValue = (result.scores && result.scores[selectedSubject] !== undefined) 
        ? result.scores[selectedSubject] 
        : '';
      
      if (scoreValue === 0 || scoreValue === '0') {
        input.value = 0;
      } else if (scoreValue && scoreValue !== '') {
        input.value = scoreValue;
      } else {
        input.value = '';
      }
      
      input.style.width = '100px';
      input.style.padding = '8px';
      input.style.textAlign = 'center';
      input.style.border = '2px solid var(--border)';
      input.style.borderRadius = '8px';
      input.style.fontSize = '14px';
      
      input.onchange = function() {
        updateScore(result.jina, selectedSubject, this.value, termId);
      };
      
      input.onblur = function() {
        updateScore(result.jina, selectedSubject, this.value, termId);
      };
      
      cell.appendChild(input);
    }
  });
}

/**
 * Display no students message
 * @param {number} colspan - Number of columns
 */
function displayNoStudentsMessage(colspan) {
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return;
  
  const displayColspan = colspan + 2;
  
  tbody.innerHTML = `
    <tr>
      <td colspan="${displayColspan}" style="text-align: center; padding: 50px; color: #666;">
        <i class="fas fa-user-slash" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i>
        <p style="font-size: 16px; margin-bottom: 10px;">Hakuna Wanafunzi Katika Muhula Huu</p>
        <p style="font-size: 14px; color: #888;">Hakuna data ya wanafunzi katika muhula huu. Alama zitawekwa kwa wanafunzi wanaoongezwa baadaye.</p>
      </td>
    </tr>
  `;
}

/**
 * Show cache indicator
 * @param {boolean} show - Show or hide
 */
function showCacheIndicator(show) {
  let indicator = document.querySelector('.cache-indicator');
  
  if (show) {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'cache-indicator';
      const tableContainer = document.querySelector('.table-container');
      if (tableContainer) {
        tableContainer.appendChild(indicator);
      }
    }
    indicator.innerHTML = '📱 Inatumia data ya cache (offline mode)';
    indicator.style.display = 'block';
  } else if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Hide cache indicator
 */
function hideCacheIndicator() {
  const indicator = document.querySelector('.cache-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

/**
 * Get current displayed results
 * @returns {Array} Current results
 */
function getCurrentDisplayedResults() {
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return [];
  
  const results = [];
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    if (row.cells[0] && !row.cells[0].innerHTML.includes('Hakuna Wanafunzi')) {
      const student = {
        jina: row.cells[0].textContent,
        jinsi: row.cells[1].textContent === 'M' ? 'M' : 'F',
        scores: {}
      };
      results.push(student);
    }
  }
  return results;
}

/**
 * Update score
 * @param {string} studentName - Student name
 * @param {string} subject - Subject name
 * @param {string} value - Score value
 * @param {string} termId - Term ID
 */
function updateScore(studentName, subject, value, termId) {
  const darasa = document.getElementById('darasaResults').value;
  updateLocalCacheImmediately(studentName, subject, value, termId, darasa);
  updateScoreWithAutoSave(studentName, subject, value, termId);
}

/**
 * Update local cache immediately
 * @param {string} studentName - Student name
 * @param {string} subject - Subject name
 * @param {string} value - Score value
 * @param {string} termId - Term ID
 * @param {string} darasa - Class name
 */
function updateLocalCacheImmediately(studentName, subject, value, termId, darasa) {
  let results = getCachedResults(darasa, termId);
  
  let result = results.find(r => r.jina === studentName);
  if (!result) {
    const gender = getStudentGender(studentName, darasa);
    result = { jina: studentName, jinsi: gender, scores: {} };
    results.push(result);
  }
  
  if (value === null || value === undefined || value === '') {
    delete result.scores[subject];
  } else {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
      result.scores[subject] = numericValue;
    }
  }
  
  setCachedResults(darasa, termId, results);
}

/**
 * Update score with auto-save
 * @param {string} studentName - Student name
 * @param {string} subject - Subject name
 * @param {string} value - Score value
 * @param {string} termId - Term ID
 */
function updateScoreWithAutoSave(studentName, subject, value, termId) {
  const darasa = document.getElementById('darasaResults').value;
  
  // Update cache immediately
  updateLocalCacheImmediately(studentName, subject, value, termId, darasa);
  
  // Store for batch processing
  const inputKey = `${studentName}_${subject}`;
  
  let storedValue;
  if (value === '' || value === null || value === undefined) {
    storedValue = null;
  } else {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      storedValue = numValue;
    } else {
      storedValue = null;
    }
  }
  
  pendingSavesMap.set(inputKey, {
    studentName,
    subject,
    value: storedValue,
    termId,
    darasa,
    timestamp: Date.now()
  });
  
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    flushPendingSaves();
  }, CONFIG.AUTO_SAVE_DELAY);
}

/**
 * Flush pending saves
 */
function flushPendingSaves() {
  if (pendingSavesMap.size === 0) return;
  
  const studentMap = new Map();
  
  for (const save of pendingSavesMap.values()) {
    const { studentName, subject, value, termId, darasa } = save;
    
    if (!studentMap.has(studentName)) {
      studentMap.set(studentName, {
        jina: studentName,
        scores: {},
        darasa: darasa,
        termId: termId
      });
    }
    
    const student = studentMap.get(studentName);
    student.scores[subject] = value;
  }
  
  pendingSavesMap.clear();
  
  for (const student of studentMap.values()) {
    queueSaveAction(student.darasa, student.termId, [student]);
  }
  
  processSaveQueue();
}

/**
 * Queue save action
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {Array} results - Results array
 */
function queueSaveAction(darasa, termId, results) {
  const existingIndex = saveQueue.findIndex(item => 
    item.darasa === darasa && item.termId === termId
  );
  
  if (existingIndex !== -1) {
    const existing = saveQueue[existingIndex];
    const mergedResults = mergeResultsFast(existing.results, results);
    saveQueue[existingIndex].results = mergedResults;
    saveQueue[existingIndex].timestamp = Date.now();
  } else {
    saveQueue.push({
      darasa,
      termId,
      results,
      timestamp: Date.now()
    });
  }
}

/**
 * Merge results fast
 * @param {Array} existingResults - Existing results
 * @param {Array} newResults - New results
 * @returns {Array} Merged results
 */
function mergeResultsFast(existingResults, newResults) {
  const resultMap = new Map();
  
  for (const result of existingResults) {
    resultMap.set(result.jina, { ...result, scores: { ...result.scores } });
  }
  
  for (const newResult of newResults) {
    if (resultMap.has(newResult.jina)) {
      const existing = resultMap.get(newResult.jina);
      for (const [subject, value] of Object.entries(newResult.scores)) {
        if (value === null) {
          delete existing.scores[subject];
        } else {
          existing.scores[subject] = value;
        }
      }
    } else {
      resultMap.set(newResult.jina, { ...newResult, scores: { ...newResult.scores } });
    }
  }
  
  return Array.from(resultMap.values());
}

/**
 * Process save queue
 */
function processSaveQueue() {
  if (isProcessingQueue || saveQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  const latestSaves = new Map();
  
  for (const save of saveQueue) {
    const key = `${save.darasa}_${save.termId}`;
    if (!latestSaves.has(key) || latestSaves.get(key).timestamp < save.timestamp) {
      latestSaves.set(key, save);
    }
  }
  
  saveQueue = [];
  
  const savePromises = [];
  
  for (const save of latestSaves.values()) {
    const { darasa, termId, results } = save;
    const action = {
      action: 'saveTermResults',
      dbId: currentDbId,
      darasa: darasa,
      termId: termId,
      results: results,
      autoSave: true
    };
    
    if (isOnline()) {
      savePromises.push(
        apiRequest(action)
          .then(data => {
            if (data.status === 'success') {
              showQuickNotification(true);
            }
          })
          .catch(error => {
            console.log('Auto-save failed, queueing:', error);
            queueOfflineSave(action, darasa, termId, results);
            showQuickNotification(true);
          })
      );
    } else {
      queueOfflineSave(action, darasa, termId, results);
      showQuickNotification(true);
    }
  }
  
  Promise.allSettled(savePromises).finally(() => {
    isProcessingQueue = false;
    if (saveQueue.length > 0) {
      setTimeout(() => processSaveQueue(), 10);
    }
  });
}

/**
 * Queue offline save
 * @param {Object} action - Action object
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {Array} results - Results array
 */
function queueOfflineSave(action, darasa, termId, results) {
  // Update local cache
  updateLocalCacheAfterAutoSave(darasa, termId, results);
  
  // Queue for later sync
  const queue = getOfflineQueue();
  
  const existingIndex = queue.findIndex(item => 
    item.action === 'saveTermResults' && 
    item.darasa === darasa && 
    item.termId === termId
  );
  
  if (existingIndex !== -1) {
    const mergedResults = mergeResultsFast(queue[existingIndex].results, results);
    queue[existingIndex].results = mergedResults;
  } else {
    queue.push(action);
  }
  
  if (queue.length > 100) {
    setOfflineQueue(queue.slice(-100));
  } else {
    setOfflineQueue(queue);
  }
}

/**
 * Update local cache after auto-save
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {Array} results - Results array
 */
function updateLocalCacheAfterAutoSave(darasa, termId, results) {
  let cachedResults = getCachedResults(darasa, termId);
  
  const resultMap = new Map();
  for (const r of cachedResults) {
    resultMap.set(r.jina, r);
  }
  
  for (const newResult of results) {
    let existing = resultMap.get(newResult.jina);
    
    if (existing) {
      for (const [subject, value] of Object.entries(newResult.scores)) {
        if (value === null) {
          delete existing.scores[subject];
        } else {
          existing.scores[subject] = value;
        }
      }
    } else {
      const gender = getStudentGender(newResult.jina, darasa);
      const newEntry = {
        jina: newResult.jina,
        jinsi: gender,
        scores: {}
      };
      
      for (const [subject, value] of Object.entries(newResult.scores)) {
        if (value !== null) {
          newEntry.scores[subject] = value;
        }
      }
      
      resultMap.set(newResult.jina, newEntry);
    }
  }
  
  cachedResults = Array.from(resultMap.values());
  setCachedResults(darasa, termId, cachedResults);
}

/**
 * Show quick notification
 * @param {boolean} isOffline - Whether offline
 */
function showQuickNotification(isOffline = false) {
  let notification = document.querySelector('.auto-save-notification');
  
  if (notification) {
    notification.remove();
    notification = null;
  }
  
  const icon = isOffline ? 'fa-database' : 'fa-check-circle';
  const text = isOffline ? 'Imehifadhiwa' : 'Imehifadhiwa';
  
  notification = document.createElement('div');
  notification.className = 'auto-save-notification';
  notification.innerHTML = `
    <div class="auto-save-content">
      <i class="fas ${icon}"></i>
      <span>${text}</span>
    </div>
  `;
  
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4caf50;
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    animation: slideInRight 0.2s ease;
    cursor: pointer;
    transition: opacity 0.2s ease;
    letter-spacing: 0.3px;
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.remove();
        }
      }, 150);
    }
  }, 1000);
  
  notification.onclick = () => {
    if (notification) {
      notification.remove();
    }
  };
}

/**
 * Save results manually
 */
function saveResults() {
  const darasa = document.getElementById('darasaResults').value;
  const termId = document.getElementById('termSelect').value;
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Muhula Hajachaguliwa',
      text: 'Tafadhali chagua muhula kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const inputs = document.querySelectorAll('.score-input');
  const results = [];
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  
  if (tbody.rows.length === 0 || tbody.rows[0].cells[0].innerHTML.includes('Hakuna Wanafunzi')) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Wanafunzi',
      text: 'Hakuna wanafunzi katika muhula huu. Hakuna alama za kuhifadhi.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const studentMap = {};
  
  inputs.forEach(input => {
    const student = input.dataset.student;
    const subject = input.dataset.subject;
    const score = input.value;
    
    if (!studentMap[student]) {
      studentMap[student] = { jina: student, scores: {} };
    }
    
    if (score === '' || score === null || score === undefined) {
      studentMap[student].scores[subject] = null;
    } else {
      const parsedScore = parseFloat(score);
      if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
        studentMap[student].scores[subject] = parsedScore;
      }
    }
  });
  
  for (let i = 0; i < tbody.rows.length; i++) {
    const studentName = tbody.rows[i].cells[0].textContent;
    if (!studentMap[studentName]) {
      studentMap[studentName] = { jina: studentName, scores: {} };
    }
  }
  
  for (const student in studentMap) {
    results.push(studentMap[student]);
  }
  
  if (results.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Data',
      text: 'Hakuna data ya kuhifadhi',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const saveBtn = document.querySelector('#manualEntry .btn-primary[onclick="saveResults()"]');
  let originalHTML = '';
  
  if (saveBtn) {
    originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
    saveBtn.disabled = true;
  }
  
  const action = {
    action: 'saveTermResults',
    dbId: currentDbId,
    darasa: darasa,
    termId: termId,
    results: results
  };
  
  if (isOnline()) {
    apiRequest(action)
      .then(data => {
        if (saveBtn) {
          saveBtn.innerHTML = originalHTML;
          saveBtn.disabled = false;
        }
        
        if (data.status === 'success') {
          updateLocalCacheAfterAutoSave(darasa, termId, results);
          Swal.fire({
            icon: 'success',
            title: 'Imefanikiwa',
            text: data.message,
            confirmButtonColor: '#4361ee',
            timer: 1500
          }).then(() => loadResults());
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
        if (saveBtn) {
          saveBtn.innerHTML = originalHTML;
          saveBtn.disabled = false;
        }
        addToOfflineQueue(action);
        updateLocalCacheAfterAutoSave(darasa, termId, results);
        Swal.fire({
          icon: 'success',
          title: 'Imehifadhiwa Nje ya Mtandao',
          text: 'Alama zimehifadhiwa na zitasawazishwa ukiwa mtandaoni',
          confirmButtonColor: '#4361ee',
          timer: 1500
        }).then(() => loadResults());
      });
  } else {
    addToOfflineQueue(action);
    updateLocalCacheAfterAutoSave(darasa, termId, results);
    
    if (saveBtn) {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }
    
    Swal.fire({
      icon: 'success',
      title: 'Imehifadhiwa Nje ya Mtandao',
      text: 'Alama zimehifadhiwa na zitasawazishwa ukiwa mtandaoni',
      confirmButtonColor: '#4361ee',
      timer: 1500
    }).then(() => loadResults());
  }
}

/**
 * Handle subject change
 * @param {HTMLElement} selectElement - Select element
 */
function handleSubjectChange(selectElement) {
  const selectedSubject = selectElement.value;
  
  if (!selectedSubject || selectedSubject === '') {
    return;
  }
  
  changeSelectedSubject(selectedSubject);
  selectElement.value = '';
}

/**
 * Change selected subject
 * @param {string} newSubject - New subject name
 */
function changeSelectedSubject(newSubject) {
  const darasa = document.getElementById('darasaResults').value;
  const termId = document.getElementById('termSelect').value;
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Muhula Kwanza',
      text: 'Tafadhali chagua muhula kwanza kabla ya kuchagua somo',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody || tbody.rows.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Wanafunzi',
      text: 'Hakuna wanafunzi katika muhula huu. Huwezi kuongeza somo.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (tbody.rows[0].cells[0].innerHTML.includes('Hakuna Wanafunzi')) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Wanafunzi',
      text: 'Hakuna wanafunzi katika muhula huu. Huwezi kuongeza somo.',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  let selectedSubjects = getCachedSelectedSubjects(darasa);
  const currentSubject = selectedSubjects.length > 0 ? selectedSubjects[0] : null;
  
  if (currentSubject === newSubject) {
    Notiflix.Notify.info(`Somo "${newSubject}" tayari limechaguliwa`, {
      timeout: 1500,
      position: 'right-top'
    });
    return;
  }
  
  // Save current scores before changing subject
  saveCurrentScoresToCache(darasa, termId);
  
  // Remove current subject column if exists
  if (currentSubject) {
    removeSubjectColumnFromTable(currentSubject);
  }
  
  // Update selected subjects
  setCachedSelectedSubjects(darasa, [newSubject]);
  
  // Add new subject column
  addSubjectColumnToTable(newSubject, termId, darasa);
  
  Notiflix.Notify.success(`Somo limebadilishwa kuwa "${newSubject}"`, {
    timeout: 2000,
    position: 'right-top'
  });
}

/**
 * Save current scores to cache
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 */
function saveCurrentScoresToCache(darasa, termId) {
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return;
  
  let results = getCachedResults(darasa, termId);
  const selectedSubjects = getCachedSelectedSubjects(darasa);
  const currentSubject = selectedSubjects.length > 0 ? selectedSubjects[0] : null;
  
  if (!currentSubject) return;
  
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    const studentName = row.cells[0].textContent;
    const gender = row.cells[1].textContent === 'M' ? 'M' : 'F';
    
    const scoreCell = row.cells[row.cells.length - 1];
    const input = scoreCell.querySelector('.score-input');
    
    if (input) {
      const value = input.value;
      let scoreToSave = null;
      
      if (value !== '' && value !== null && value !== undefined) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
          scoreToSave = numValue;
        }
      }
      
      let result = results.find(r => r.jina === studentName);
      if (!result) {
        result = { jina: studentName, jinsi: gender, scores: {} };
        results.push(result);
      }
      
      if (scoreToSave === null) {
        delete result.scores[currentSubject];
      } else {
        result.scores[currentSubject] = scoreToSave;
      }
    }
  }
  
  setCachedResults(darasa, termId, results);
}

/**
 * Add subject column to table
 * @param {string} subject - Subject name
 * @param {string} termId - Term ID
 * @param {string} darasa - Class name
 */
function addSubjectColumnToTable(subject, termId, darasa) {
  const headerRow = document.getElementById('resultsTableHeaders');
  if (!headerRow) return;
  
  // Remove existing subject columns
  while (headerRow.cells.length > 2) {
    headerRow.deleteCell(2);
  }
  
  // Add new header
  const th = document.createElement('th');
  th.textContent = subject;
  th.style.minWidth = '120px';
  th.style.backgroundColor = '#4361ee';
  th.style.color = 'white';
  th.style.padding = '12px';
  th.style.fontWeight = '600';
  headerRow.appendChild(th);
  
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return;
  
  const results = getCachedResults(darasa, termId);
  const students = getCachedStudents(darasa);
  
  // Get students from existing rows or cache
  let studentList = [];
  if (tbody.rows.length > 0 && !tbody.rows[0].cells[0].innerHTML.includes('Hakuna Wanafunzi')) {
    for (let i = 0; i < tbody.rows.length; i++) {
      const row = tbody.rows[i];
      studentList.push({
        jina: row.cells[0].textContent,
        jinsi: row.cells[1].textContent === 'M' ? 'M' : 'F'
      });
    }
  } else {
    studentList = students;
  }
  
  tbody.innerHTML = '';
  const sortedStudents = sortStudentsAlphabetically(studentList);
  
  sortedStudents.forEach(student => {
    const studentName = student.jina;
    
    const studentResult = results.find(r => r.jina === studentName);
    let existingScore = '';
    
    if (studentResult && studentResult.scores && studentResult.scores[subject] !== undefined) {
      const score = studentResult.scores[subject];
      if (score === 0 || score === '0') {
        existingScore = 0;
      } else if (score && score !== '') {
        existingScore = score;
      }
    }
    
    const row = tbody.insertRow();
    
    const nameCell = row.insertCell(0);
    nameCell.textContent = studentName;
    nameCell.style.fontWeight = '500';
    nameCell.style.padding = '12px 8px';
    
    const genderCell = row.insertCell(1);
    genderCell.textContent = student.jinsi === 'M' ? 'M' : 'F';
    genderCell.style.padding = '12px 8px';
    genderCell.style.textAlign = 'center';
    
    const cell = row.insertCell(-1);
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '100';
    input.className = 'score-input';
    input.setAttribute('data-subject', subject);
    input.setAttribute('data-student', studentName);
    input.setAttribute('data-term', termId);
    input.value = existingScore;
    input.style.width = '100px';
    input.style.padding = '8px';
    input.style.textAlign = 'center';
    input.style.border = '2px solid var(--border)';
    input.style.borderRadius = '8px';
    input.style.fontSize = '14px';
    
    input.onchange = function() {
      updateScore(studentName, subject, this.value, termId);
    };
    
    cell.appendChild(input);
  });
}

/**
 * Remove subject column from table
 * @param {string} subject - Subject name
 */
function removeSubjectColumnFromTable(subject) {
  const darasa = document.getElementById('darasaResults').value;
  const termId = document.getElementById('termSelect').value;
  
  saveCurrentScoresToCache(darasa, termId);
  
  const headerRow = document.getElementById('resultsTableHeaders');
  if (!headerRow) return;
  
  for (let i = 0; i < headerRow.cells.length; i++) {
    if (headerRow.cells[i].textContent === subject) {
      headerRow.deleteCell(i);
      break;
    }
  }
  
  const tbody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
  if (!tbody) return;
  
  for (let i = 0; i < tbody.rows.length; i++) {
    const row = tbody.rows[i];
    while (row.cells.length > 2) {
      row.deleteCell(2);
    }
  }
}

/**
 * Confirm delete all scores
 */
function confirmDeleteAllScores() {
  const darasa = document.getElementById('darasaResults').value;
  const termId = document.getElementById('termSelect').value;
  const selectedSubjects = getCachedSelectedSubjects(darasa);
  const selectedSubject = selectedSubjects.length > 0 ? selectedSubjects[0] : null;
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Muhula Hajachaguliwa',
      text: 'Tafadhali chagua muhula kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (!selectedSubject) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Somo Lililochaguliwa',
      text: 'Tafadhali chagua somo kwanza kabla ya kufuta alama',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const userEmail = localStorage.getItem('currentUserEmail') || '';
  
  if (!userEmail) {
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu',
      text: 'Barua pepe ya akaunti haipatikani',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  const results = getCachedResults(darasa, termId);
  const studentsWithScores = results.filter(result => 
    result.scores && result.scores[selectedSubject] && result.scores[selectedSubject] !== ''
  );
  
  if (studentsWithScores.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Hakuna Alama',
      text: `Hakuna alama zilizowekwa kwa somo "${selectedSubject}" katika muhula huu`,
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: '⚠️ THIBITISHA KUFUTA ALAMA ZOTE',
    html: `
      <div style="text-align: left;">
        <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #c62828; font-weight: bold; margin-bottom: 10px;">
            <i class="fas fa-exclamation-triangle"></i> ONYO: HATUA HII HAWEZI KUTENDEULIWA!
          </p>
          <p style="font-size: 14px; color: #d32f2f;">
            Utafuta alama zote za somo: <strong>"${selectedSubject}"</strong>
          </p>
          <p style="font-size: 14px; color: #d32f2f; margin-top: 5px;">
            Wanafunzi wenye alama: <strong>${studentsWithScores.length}</strong>
          </p>
          <p style="font-size: 14px; color: #d32f2f; margin-top: 5px;">
            Darasa: <strong>${darasa}</strong> | Muhula: <strong>${termId}</strong>
          </p>
        </div>
        <p style="margin-bottom: 15px;">
          Ili kuthibitisha, weka barua pepe yako: <strong>${userEmail}</strong>
        </p>
        <input type="email" id="confirmEmail" class="swal2-input" 
               placeholder="Weka barua pepe yako" 
               style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd;">
        <p style="font-size: 12px; color: #666; margin-top: 10px;">
          Andika barua pepe kamili kama ilivyo hapo juu ili kuthibitisha
        </p>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d32f2f',
    cancelButtonColor: '#4361ee',
    confirmButtonText: '<i class="fas fa-trash-alt"></i> Ndio, Futa Alama Zote',
    cancelButtonText: '<i class="fas fa-times"></i> Ghairi',
    preConfirm: () => {
      const enteredEmail = document.getElementById('confirmEmail').value;
      if (enteredEmail !== userEmail) {
        Swal.showValidationMessage(`Barua pepe hailingani. Tafadhali andika: ${userEmail}`);
        return false;
      }
      return true;
    }
  }).then(result => {
    if (result.isConfirmed) {
      deleteAllScoresForSubject(darasa, termId, selectedSubject);
    }
  });
}

/**
 * Delete all scores for a subject
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {string} subject - Subject name
 */
function deleteAllScoresForSubject(darasa, termId, subject) {
  const action = {
    action: 'deleteAllSubjectScores',
    dbId: currentDbId,
    darasa: darasa,
    termId: termId,
    subject: subject
  };
  
  if (isOnline()) {
    Notiflix.Loading.standard('Inafuta alama zote...');
    
    apiRequest(action)
      .then(data => {
        Notiflix.Loading.remove();
        
        if (data.status === 'success') {
          updateCacheAfterDeleteAllScores(darasa, termId, subject);
          Swal.fire({
            icon: 'success',
            title: 'Imefanikiwa!',
            html: `
              <div style="text-align: center;">
                <div style="font-size: 48px; color: #4CAF50; margin-bottom: 15px;">✅</div>
                <p><strong>Alama zote za somo "${subject}" zimefutwa!</strong></p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">${data.message || `Alama ${data.deletedCount} zimefutwa kikamilifu`}</p>
              </div>
            `,
            confirmButtonColor: '#4361ee'
          }).then(() => loadResults());
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
        addToOfflineQueue(action);
        updateCacheAfterDeleteAllScores(darasa, termId, subject);
        Swal.fire({
          icon: 'success',
          title: 'Imehifadhiwa Nje ya Mtandao',
          text: 'Alama zimefutwa na zitasawazishwa ukiwa mtandaoni',
          confirmButtonColor: '#4361ee'
        }).then(() => loadResults());
      });
  } else {
    addToOfflineQueue(action);
    updateCacheAfterDeleteAllScores(darasa, termId, subject);
    Swal.fire({
      icon: 'success',
      title: 'Imehifadhiwa Nje ya Mtandao',
      text: 'Alama zimefutwa na zitasawazishwa ukiwa mtandaoni',
      confirmButtonColor: '#4361ee'
    }).then(() => loadResults());
  }
}

/**
 * Update cache after deleting all scores
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {string} subject - Subject name
 */
function updateCacheAfterDeleteAllScores(darasa, termId, subject) {
  const results = getCachedResults(darasa, termId);
  const updatedResults = results.map(result => {
    if (result.scores && result.scores[subject] !== undefined) {
      delete result.scores[subject];
    }
    return result;
  });
  setCachedResults(darasa, termId, updatedResults);
}

// ============================================
// BULK ENTRY
// ============================================

/**
 * Load bulk terms
 */
function loadBulkTerms() {
  const termSelect = document.getElementById('bulkTermSelect');
  if (!termSelect) return;
  
  termSelect.innerHTML = '<option value="">Chagua Muhula</option>';
  
  const terms = getCachedTerms();
  if (terms.length > 0) {
    terms.forEach(term => {
      if (term && term.id && term.name) {
        termSelect.innerHTML += `<option value="${term.id}">${term.name}</option>`;
      }
    });
  }
}

/**
 * Load bulk subjects
 */
function loadBulkSubjects() {
  const termId = document.getElementById('bulkTermSelect')?.value;
  const darasa = document.getElementById('bulkDarasaSelect')?.value;
  
  if (!termId || !darasa) {
    document.getElementById('bulkSubjectsSection')?.classList.add('hidden');
    return;
  }
  
  document.getElementById('bulkSubjectsSection').classList.remove('hidden');
  
  const subjects = getCachedSubjects();
  const checkboxesContainer = document.getElementById('bulkSubjectsCheckboxes');
  
  if (!checkboxesContainer) return;
  
  if (subjects.length > 0) {
    checkboxesContainer.innerHTML = '';
    subjects.forEach(subjectObj => {
      const subject = subjectObj.somo;
      if (!subject) return;
      
      const div = document.createElement('div');
      div.className = 'subject-checkbox-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'bulk_subject_' + subject.replace(/\s/g, '_');
      checkbox.value = subject;
      checkbox.checked = true;
      
      const label = document.createElement('label');
      label.htmlFor = 'bulk_subject_' + subject.replace(/\s/g, '_');
      label.textContent = subject;
      
      div.appendChild(checkbox);
      div.appendChild(label);
      checkboxesContainer.appendChild(div);
    });
  } else {
    checkboxesContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #f44336;">
        <p>⚠️ Hakuna masomo yaliyosajiliwa.</p>
        <p style="font-size: 12px;">Nenda kwenye dashboard ya masomo kusajili masomo kwanza.</p>
      </div>
    `;
  }
}

/**
 * Select all subjects
 */
function selectAllSubjects() {
  document.querySelectorAll('#bulkSubjectsCheckboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
  });
}

/**
 * Deselect all subjects
 */
function deselectAllSubjects() {
  document.querySelectorAll('#bulkSubjectsCheckboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

/**
 * Download marks template
 */
function downloadMarksTemplate() {
  const termId = document.getElementById('bulkTermSelect')?.value;
  const darasa = document.getElementById('bulkDarasaSelect')?.value;
  
  if (!termId) {
    Notiflix.Notify.warning('Tafadhali chagua muhula kwanza', {
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
    return;
  }
  
  const selectedSubjects = [];
  document.querySelectorAll('#bulkSubjectsCheckboxes input[type="checkbox"]:checked').forEach(cb => {
    selectedSubjects.push(cb.value);
  });
  
  if (selectedSubjects.length === 0) {
    Notiflix.Notify.warning('Tafadhali angalau chagua somo moja', {
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
  
  const downloadBtn = document.querySelector('#bulkEntry .btn-success[onclick="downloadMarksTemplate()"]');
  let originalHTML = '';
  
  if (downloadBtn) {
    originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza...';
    downloadBtn.disabled = true;
  }
  
  apiRequest({
    action: 'downloadMarksTemplate',
    dbId: currentDbId,
    darasa: darasa,
    termId: termId,
    subjects: selectedSubjects
  })
  .then(data => {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
    }
    
    if (data.status === 'success') {
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName || 'Alama_Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Notiflix.Notify.success(`Kiolezo "${data.fileName}" kinapakuliwa`, {
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
 * Upload marks template
 */
function uploadMarksTemplate() {
  const fileInput = document.getElementById('marksTemplateFile');
  const file = fileInput.files[0];
  const termId = document.getElementById('bulkTermSelect')?.value;
  const darasa = document.getElementById('bulkDarasaSelect')?.value;
  
  if (!file) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Faili',
      text: 'Tafadhali chagua faili ya Excel iliyosajiliwa',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (!termId) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Muhula',
      text: 'Tafadhali chagua muhula kwanza',
      confirmButtonColor: '#4361ee'
    });
    fileInput.value = '';
    return;
  }
  
  if (!darasa) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Darasa',
      text: 'Tafadhali chagua darasa kwanza',
      confirmButtonColor: '#4361ee'
    });
    fileInput.value = '';
    return;
  }
  
  if (!isOnline()) {
    Swal.fire({
      icon: 'error',
      title: 'Hauko Mtandaoni',
      text: 'Huwezi kupakia kiolezo ukiwa nje ya mtandao.',
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
  
  const progressDiv = document.getElementById('marksTemplateUploadProgress');
  const progressFill = document.getElementById('marksTemplateProgressFill');
  const progressStatus = document.getElementById('marksTemplateUploadStatus');
  
  if (progressDiv) progressDiv.style.display = 'block';
  if (progressFill) progressFill.style.width = '10%';
  if (progressStatus) progressStatus.textContent = 'Inasoma faili...';
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const arrayBuffer = e.target.result;
    const base64Data = arrayBufferToBase64(arrayBuffer);
    
    if (progressFill) progressFill.style.width = '30%';
    if (progressStatus) progressStatus.textContent = 'Inatuma faili kwa server...';
    
    apiRequest({
      action: 'uploadMarksTemplate',
      dbId: currentDbId,
      darasa: darasa,
      termId: termId,
      fileName: file.name,
      fileData: base64Data
    })
    .then(data => {
      if (progressFill) progressFill.style.width = '100%';
      
      if (data.status === 'success') {
        if (progressStatus) progressStatus.textContent = 'Imekamilika!';
        if (data.results) {
          setCachedResults(darasa, termId, data.results);
        }
        Swal.fire({
          icon: 'success',
          title: 'Alama Zimeingizwa',
          html: `<div style="text-align: left;">
                  <p><strong>${data.message}</strong></p>
                  <p>Alama zimeingizwa kikamilifu kwa darasa la ${darasa}</p>
                </div>`,
          confirmButtonColor: '#4361ee'
        }).then(() => {
          fileInput.value = '';
          if (progressDiv) progressDiv.style.display = 'none';
          if (document.getElementById('manualEntry')?.classList.contains('active')) {
            loadResults();
          }
        });
      } else {
        if (progressStatus) progressStatus.textContent = 'Imeshindikana';
        Swal.fire({
          icon: 'error',
          title: 'Kuingiza Alama Kumeshindikana',
          text: data.message || 'Hitilafu katika kuingiza alama',
          confirmButtonColor: '#4361ee'
        }).then(() => {
          fileInput.value = '';
          if (progressDiv) progressDiv.style.display = 'none';
        });
      }
    })
    .catch(error => {
      if (progressFill) progressFill.style.width = '100%';
      if (progressStatus) progressStatus.textContent = 'Hitilafu ya mtandao';
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      }).then(() => {
        fileInput.value = '';
        if (progressDiv) progressDiv.style.display = 'none';
      });
    });
  };
  
  reader.onerror = function() {
    if (progressDiv) progressDiv.style.display = 'none';
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
 * Open results tab
 * @param {string} tabName - Tab name
 * @param {HTMLElement} element - Clicked element
 */
function openResultsTab(tabName, element) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  
  element.classList.add('active');
  document.getElementById(tabName).classList.add('active');
  
  if (tabName === 'bulkEntry') {
    loadBulkTerms();
  }
}