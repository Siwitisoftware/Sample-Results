// ============================================
// REPORTS MANAGEMENT
// ============================================

/**
 * Load report for a class and term
 */
function loadReport() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  const tableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
  const headersRow = document.getElementById('reportTableHeaders');
  
  if (!headersRow || !tableBody) return;
  
  headersRow.innerHTML = '<th>Jina la Mwanafunzi</th><th>Jinsi</th>';
  tableBody.innerHTML = '';
  
  const termInfo = document.getElementById('reportTermInfo');
  if (termId && termId !== '') {
    const terms = getCachedTerms();
    const term = terms.find(t => t.id === termId);
    if (term) {
      document.getElementById('reportTermName').textContent = term.name;
      if (termInfo) termInfo.classList.remove('hidden');
    }
  } else {
    if (termInfo) termInfo.classList.add('hidden');
    tableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; padding: 50px; color: #666;">
          <i class="fas fa-calendar-alt" style="font-size: 48px; margin-bottom: 15px; color: #ddd;"></i>
          <p style="font-size: 16px;">Chagua Muhula Kwanza</p>
        </td>
      </tr>
    `;
    return;
  }
  
  // Load grade settings from cache
  const gradeSettings = getCachedGradeSettings(darasa);
  document.getElementById('gradeA').value = gradeSettings.A || 80;
  document.getElementById('gradeB').value = gradeSettings.B || 65;
  document.getElementById('gradeC').value = gradeSettings.C || 50;
  document.getElementById('gradeD').value = gradeSettings.D || 35;
  document.getElementById('gradeE').value = gradeSettings.E || 0;
  
  // Load subject grade settings
  loadSubjectGradeSettings();
  
  // Display student selection checkboxes
  setTimeout(() => displayStudentSelectionCheckboxes(), 500);
  
  // Load report data
  loadReportFromTermSheet(darasa, termId);
  
  // Sync from server if online
  if (isOnline() && currentDbId) {
    // Sync grade settings
    apiRequest({
      action: 'getGradeSettings',
      dbId: currentDbId,
      darasa: darasa
    })
    .then(data => {
      if (data.status === 'success') {
        const grades = data.grades;
        document.getElementById('gradeA').value = grades.A || 80;
        document.getElementById('gradeB').value = grades.B || 65;
        document.getElementById('gradeC').value = grades.C || 50;
        document.getElementById('gradeD').value = grades.D || 35;
        document.getElementById('gradeE').value = grades.E || 0;
        setCachedGradeSettings(darasa, grades);
      }
    })
    .catch(error => {
      console.log('Background sync failed for grade settings:', error);
    });
    
    // Sync subject grade settings
    apiRequest({
      action: 'getSubjectGradeSettings',
      dbId: currentDbId,
      darasa: darasa
    })
    .then(data => {
      if (data.status === 'success') {
        const settings = data.settings;
        document.getElementById('subjectGradeSystem').value = settings.system || 'out_of_50';
        document.getElementById('subjectGradeA').value = settings.a_min || (settings.system === 'out_of_50' ? 41 : 80);
        document.getElementById('subjectGradeB').value = settings.b_min || (settings.system === 'out_of_50' ? 31 : 65);
        document.getElementById('subjectGradeC').value = settings.c_min || (settings.system === 'out_of_50' ? 21 : 50);
        document.getElementById('subjectGradeD').value = settings.d_min || (settings.system === 'out_of_50' ? 11 : 35);
        document.getElementById('subjectGradeE').value = settings.e_min || 0;
        setCachedSubjectGradeSettings(darasa, settings);
        toggleSubjectGradeRanges();
      }
    })
    .catch(error => {
      console.log('Background sync failed for subject grade settings:', error);
    });
  }
  
  // Re-apply protection after table is populated
  setTimeout(() => disableCopyOnReportTable(), 100);
}

/**
 * Load report from term sheet
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 */
function loadReportFromTermSheet(darasa, termId) {
  // Get current grade settings
  const gradeA = parseFloat(document.getElementById('gradeA').value) || 80;
  const gradeB = parseFloat(document.getElementById('gradeB').value) || 65;
  const gradeC = parseFloat(document.getElementById('gradeC').value) || 50;
  const gradeD = parseFloat(document.getElementById('gradeD').value) || 35;
  const gradeE = parseFloat(document.getElementById('gradeE').value) || 0;
  
  const gradeSettings = { A: gradeA, B: gradeB, C: gradeC, D: gradeD, E: gradeE };
  
  // Get current subject grade settings
  const subjectGradeSystem = document.getElementById('subjectGradeSystem').value;
  const subjectGradeA = parseFloat(document.getElementById('subjectGradeA').value) || (subjectGradeSystem === 'out_of_50' ? 41 : 80);
  const subjectGradeB = parseFloat(document.getElementById('subjectGradeB').value) || (subjectGradeSystem === 'out_of_50' ? 31 : 65);
  const subjectGradeC = parseFloat(document.getElementById('subjectGradeC').value) || (subjectGradeSystem === 'out_of_50' ? 21 : 50);
  const subjectGradeD = parseFloat(document.getElementById('subjectGradeD').value) || (subjectGradeSystem === 'out_of_50' ? 11 : 35);
  const subjectGradeE = parseFloat(document.getElementById('subjectGradeE').value) || 0;
  
  const subjectGradeSettings = {
    system: subjectGradeSystem,
    a_min: subjectGradeA,
    b_min: subjectGradeB,
    c_min: subjectGradeC,
    d_min: subjectGradeD,
    e_min: subjectGradeE
  };
  
  // Try to load from cache
  const results = getCachedResults(darasa, termId);
  const subjects = getCachedSubjects().map(s => s.somo);
  
  if (results.length > 0 && subjects.length > 0) {
    displayReportWithSubjects(results, subjects, gradeSettings, subjectGradeSettings);
  }
  
  if (!isOnline() || !currentDbId) return;
  
  // Sync from server
  apiRequest({
    action: 'getTermSheetData',
    dbId: currentDbId,
    darasa: darasa,
    termId: termId,
    gradeSettings: gradeSettings,
    subjectGradeSettings: subjectGradeSettings
  })
  .then(data => {
    if (data.status === 'success') {
      setCachedResults(darasa, termId, data.results);
      displayReportWithSubjects(data.results, data.subjects, gradeSettings, subjectGradeSettings);
    }
  })
  .catch(error => {
    console.log('Background sync failed for report:', error);
  });
}

/**
 * Display report with subjects
 * @param {Array} results - Results array
 * @param {Array} subjects - Subjects array
 * @param {Object} gradeSettings - Grade settings
 * @param {Object} subjectGradeSettings - Subject grade settings
 */
function displayReportWithSubjects(results, subjects, gradeSettings, subjectGradeSettings) {
  const tableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
  const headersRow = document.getElementById('reportTableHeaders');
  
  if (!headersRow || !tableBody) return;
  
  // Clear existing headers (keep first two)
  while (headersRow.cells.length > 2) {
    headersRow.deleteCell(2);
  }
  
  // Filter subjects with scores
  const validSubjects = subjects.filter(subject => {
    return results.some(result => {
      const score = result.scores[subject];
      return score !== undefined && score !== null && score !== '';
    });
  });
  
  // Add subject headers
  validSubjects.forEach(subject => {
    const th = document.createElement('th');
    th.textContent = subject;
    th.style.padding = '8px';
    th.style.fontSize = '0.75rem';
    headersRow.appendChild(th);
  });
  
  // Add summary headers
  const summaryHeaders = ['Jumla', 'Wastani', 'Nafasi', 'Daraja'];
  summaryHeaders.forEach(header => {
    const th = document.createElement('th');
    th.textContent = header;
    th.style.padding = '8px';
    th.style.fontSize = '0.75rem';
    headersRow.appendChild(th);
  });
  
  // Process results
  const processedResults = results.map(result => {
    let total = 0;
    let count = 0;
    
    validSubjects.forEach(subject => {
      const score = result.scores[subject];
      if (score !== undefined && score !== null && score !== '') {
        total += parseFloat(score);
        count++;
      }
    });
    
    const average = count > 0 ? total / count : 0;
    let grade = '-';
    
    if (count > 0) {
      if (total >= gradeSettings.A) grade = 'A';
      else if (total >= gradeSettings.B) grade = 'B';
      else if (total >= gradeSettings.C) grade = 'C';
      else if (total >= gradeSettings.D) grade = 'D';
      else grade = 'E';
    }
    
    return {
      ...result,
      total: total,
      average: average,
      grade: grade,
      hasScores: count > 0
    };
  });
  
  // Sort by total
  processedResults.sort((a, b) => {
    if (a.hasScores && !b.hasScores) return -1;
    if (!a.hasScores && b.hasScores) return 1;
    if (a.hasScores && b.hasScores) {
      if (a.total !== b.total) return b.total - a.total;
      return a.jina.localeCompare(b.jina);
    }
    return a.jina.localeCompare(b.jina);
  });
  
  // Assign positions
  let position = 1;
  let lastTotal = null;
  processedResults.forEach((result, index) => {
    if (result.hasScores) {
      if (index === 0) {
        result.position = position;
        lastTotal = result.total;
      } else {
        if (result.total === lastTotal) {
          result.position = position;
        } else {
          position = index + 1;
          result.position = position;
          lastTotal = result.total;
        }
      }
    } else {
      result.position = '-';
    }
  });
  
  // Display results
  tableBody.innerHTML = '';
  
  processedResults.forEach(result => {
    const row = tableBody.insertRow();
    
    // Name cell
    const nameCell = row.insertCell(0);
    nameCell.textContent = result.jina;
    nameCell.style.fontWeight = '500';
    nameCell.style.padding = '10px 8px';
    
    // Gender cell
    const genderCell = row.insertCell(1);
    genderCell.textContent = result.jinsi === 'M' ? 'M' : 'F';
    genderCell.style.textAlign = 'center';
    genderCell.style.padding = '10px 8px';
    
    // Subject score cells with colored grades
    validSubjects.forEach(subject => {
      const cell = row.insertCell(-1);
      const score = result.scores[subject];
      let displayScore = '-';
      let subjectGrade = '-';
      let gradeClass = '';
      
      if (score !== undefined && score !== null && score !== '') {
        const numScore = parseFloat(score);
        displayScore = numScore;
        
        // Calculate subject grade
        if (subjectGradeSettings.system === 'out_of_50') {
          if (numScore >= subjectGradeSettings.a_min) subjectGrade = 'A';
          else if (numScore >= subjectGradeSettings.b_min) subjectGrade = 'B';
          else if (numScore >= subjectGradeSettings.c_min) subjectGrade = 'C';
          else if (numScore >= subjectGradeSettings.d_min) subjectGrade = 'D';
          else subjectGrade = 'E';
        } else {
          if (numScore >= subjectGradeSettings.a_min) subjectGrade = 'A';
          else if (numScore >= subjectGradeSettings.b_min) subjectGrade = 'B';
          else if (numScore >= subjectGradeSettings.c_min) subjectGrade = 'C';
          else if (numScore >= subjectGradeSettings.d_min) subjectGrade = 'D';
          else subjectGrade = 'E';
        }
        
        if (subjectGrade === 'A') gradeClass = 'grade-A';
        else if (subjectGrade === 'B') gradeClass = 'grade-B';
        else if (subjectGrade === 'C') gradeClass = 'grade-C';
        else if (subjectGrade === 'D') gradeClass = 'grade-D';
        else if (subjectGrade === 'E') gradeClass = 'grade-E';
      }
      
      cell.innerHTML = `
        <div class="subject-grade">
          <div class="subject-score" style="font-weight: bold;">${displayScore}</div>
          <small class="${gradeClass}" style="font-size: 10px; display: block;">${subjectGrade}</small>
        </div>
      `;
      cell.style.textAlign = 'center';
      cell.style.padding = '8px 4px';
    });
    
    // Summary cells
    const totalCell = row.insertCell(-1);
    totalCell.textContent = result.hasScores ? Math.round(result.total) : '-';
    totalCell.style.textAlign = 'center';
    totalCell.style.fontWeight = 'bold';
    
    const avgCell = row.insertCell(-1);
    avgCell.textContent = result.hasScores ? result.average.toFixed(2) : '-';
    avgCell.style.textAlign = 'center';
    
    const posCell = row.insertCell(-1);
    posCell.textContent = result.position;
    posCell.style.textAlign = 'center';
    posCell.style.fontWeight = 'bold';
    
    const gradeCell = row.insertCell(-1);
    gradeCell.textContent = result.grade;
    gradeCell.style.textAlign = 'center';
    gradeCell.style.fontWeight = 'bold';
    
    // Apply main grade colors
    if (result.grade === 'A') gradeCell.style.color = '#1b5e20';
    else if (result.grade === 'B') gradeCell.style.color = '#4caf50';
    else if (result.grade === 'C') gradeCell.style.color = '#ffeb3b';
    else if (result.grade === 'D') gradeCell.style.color = '#ff9800';
    else if (result.grade === 'E') gradeCell.style.color = '#f44336';
  });
  
  // Disable copy on report table
  disableCopyOnReportTable();
}

/**
 * Disable copy on report table
 */
function disableCopyOnReportTable() {
  const reportTable = document.getElementById('reportTable');
  if (!reportTable) return;
  
  reportTable.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
  });
  
  reportTable.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
  });
  
  reportTable.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  reportTable.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });
  
  reportTable.addEventListener('selectstart', function(e) {
    e.preventDefault();
    return false;
  });
}

/**
 * Show Excel options
 */
function showExcelOptions() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  
  if (!termId) {
    Notiflix.Notify.warning('Tafadhali chagua muhula kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  Swal.fire({
    title: 'Chagua Aina ya Matokeo',
    html: `
      <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
        <button id="standardExcelBtn" class="btn btn-primary" style="width: 100%;">
          <i class="fas fa-file-excel"></i> Kawaida (bila madaraja ya masomo)
        </button>
        <button id="gradedExcelBtn" class="btn btn-success" style="width: 100%;">
          <i class="fas fa-star"></i> Yenye Madaraja ya Masomo
        </button>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Ghairi',
    cancelButtonColor: '#f72585',
    width: '450px',
    didOpen: () => {
      document.getElementById('standardExcelBtn').addEventListener('click', () => {
        Swal.close();
        generateExcelReport('standard');
      });
      document.getElementById('gradedExcelBtn').addEventListener('click', () => {
        Swal.close();
        generateExcelReport('graded');
      });
    }
  });
}

/**
 * Generate Excel report
 * @param {string} type - Report type (standard/graded)
 */
function generateExcelReport(type) {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  const gradeA = document.getElementById('gradeA').value;
  const gradeB = document.getElementById('gradeB').value;
  const gradeC = document.getElementById('gradeC').value;
  const gradeD = document.getElementById('gradeD').value;
  const gradeE = document.getElementById('gradeE').value;
  
  if (!termId) {
    Notiflix.Notify.warning('Tafadhali chagua muhula kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const excelBtn = document.querySelector('#reportDashboard .btn-primary[onclick="showExcelOptions()"]');
  let originalHTML = '';
  
  if (excelBtn) {
    originalHTML = excelBtn.innerHTML;
    excelBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza...';
    excelBtn.disabled = true;
  }
  
  const gradeSettings = {
    A: parseFloat(gradeA) || 80,
    B: parseFloat(gradeB) || 65,
    C: parseFloat(gradeC) || 50,
    D: parseFloat(gradeD) || 35,
    E: parseFloat(gradeE) || 0
  };
  
  const subjectGradeSystem = document.getElementById('subjectGradeSystem').value;
  const subjectGradeA = document.getElementById('subjectGradeA').value;
  const subjectGradeB = document.getElementById('subjectGradeB').value;
  const subjectGradeC = document.getElementById('subjectGradeC').value;
  const subjectGradeD = document.getElementById('subjectGradeD').value;
  const subjectGradeE = document.getElementById('subjectGradeE').value;
  
  const subjectGradeSettings = {
    system: subjectGradeSystem,
    a_min: parseFloat(subjectGradeA) || (subjectGradeSystem === 'out_of_50' ? 41 : 80),
    b_min: parseFloat(subjectGradeB) || (subjectGradeSystem === 'out_of_50' ? 31 : 65),
    c_min: parseFloat(subjectGradeC) || (subjectGradeSystem === 'out_of_50' ? 21 : 50),
    d_min: parseFloat(subjectGradeD) || (subjectGradeSystem === 'out_of_50' ? 11 : 35),
    e_min: parseFloat(subjectGradeE) || 0
  };
  
  const data = {
    action: 'generateResults',
    dbId: currentDbId,
    darasa: darasa,
    gradeSettings: gradeSettings,
    subjectGradeSettings: subjectGradeSettings,
    termId: termId,
    reportType: type
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    if (excelBtn) {
      excelBtn.innerHTML = originalHTML;
      excelBtn.disabled = false;
    }
    Notiflix.Notify.success('Ombi limehifadhiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  apiRequest(data)
    .then(data => {
      if (excelBtn) {
        excelBtn.innerHTML = originalHTML;
        excelBtn.disabled = false;
      }
      
      if (data.status === 'success') {
        const link = document.createElement('a');
        link.href = data.spreadsheetUrl;
        link.download = data.fileName || `${darasa}_Matokeo.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Notiflix.Notify.success(`✅ Matokeo yamepakuliwa! ${data.fileName}`, {
          timeout: 3000,
          position: 'right-top'
        });
        loadReport();
      } else {
        Notiflix.Notify.failure(data.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      if (excelBtn) {
        excelBtn.innerHTML = originalHTML;
        excelBtn.disabled = false;
      }
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
    });
}

/**
 * Generate PDF results action
 */
function generatePDFResultsAction() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  
  if (!termId) {
    Notiflix.Notify.warning('Tafadhali chagua muhula kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const pdfBtn = document.querySelector('#reportDashboard .btn-primary[onclick="generatePDFResultsAction()"]');
  let originalHTML = '';
  
  if (pdfBtn) {
    originalHTML = pdfBtn.innerHTML;
    pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza PDF...';
    pdfBtn.disabled = true;
  }
  
  const gradeA = document.getElementById('gradeA').value;
  const gradeB = document.getElementById('gradeB').value;
  const gradeC = document.getElementById('gradeC').value;
  const gradeD = document.getElementById('gradeD').value;
  const gradeE = document.getElementById('gradeE').value;
  
  const gradeSettings = {
    A: parseFloat(gradeA) || 80,
    B: parseFloat(gradeB) || 65,
    C: parseFloat(gradeC) || 50,
    D: parseFloat(gradeD) || 35,
    E: parseFloat(gradeE) || 0
  };
  
  const subjectGradeSystem = document.getElementById('subjectGradeSystem').value;
  const subjectGradeA = document.getElementById('subjectGradeA').value;
  const subjectGradeB = document.getElementById('subjectGradeB').value;
  const subjectGradeC = document.getElementById('subjectGradeC').value;
  const subjectGradeD = document.getElementById('subjectGradeD').value;
  const subjectGradeE = document.getElementById('subjectGradeE').value;
  
  const subjectGradeSettings = {
    system: subjectGradeSystem,
    a_min: parseFloat(subjectGradeA) || (subjectGradeSystem === 'out_of_50' ? 41 : 80),
    b_min: parseFloat(subjectGradeB) || (subjectGradeSystem === 'out_of_50' ? 31 : 65),
    c_min: parseFloat(subjectGradeC) || (subjectGradeSystem === 'out_of_50' ? 21 : 50),
    d_min: parseFloat(subjectGradeD) || (subjectGradeSystem === 'out_of_50' ? 11 : 35),
    e_min: parseFloat(subjectGradeE) || 0
  };
  
  const data = {
    action: 'generatePDFResults',
    dbId: currentDbId,
    darasa: darasa,
    gradeSettings: gradeSettings,
    subjectGradeSettings: subjectGradeSettings,
    termId: termId
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    if (pdfBtn) {
      pdfBtn.innerHTML = originalHTML;
      pdfBtn.disabled = false;
    }
    Notiflix.Notify.success('Ombi limehifadhiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  apiRequest(data)
    .then(data => {
      if (pdfBtn) {
        pdfBtn.innerHTML = originalHTML;
        pdfBtn.disabled = false;
      }
      
      if (data.status === 'success') {
        const link = document.createElement('a');
        link.href = data.pdfDownloadUrl;
        link.download = data.pdfFileName || `${darasa}_Matokeo.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Notiflix.Notify.success(`✅ PDF imepakuliwa! ${data.pdfFileName}`, {
          timeout: 3000,
          position: 'right-top'
        });
      } else {
        Notiflix.Notify.failure(data.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      if (pdfBtn) {
        pdfBtn.innerHTML = originalHTML;
        pdfBtn.disabled = false;
      }
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
    });
}

/**
 * Toggle subject grade ranges
 */
function toggleSubjectGradeRanges() {
  const system = document.getElementById('subjectGradeSystem').value;
  const rangesDiv = document.getElementById('subjectGradeRanges');
  
  if (!rangesDiv) return;
  
  if (system === 'out_of_50') {
    rangesDiv.style.display = 'flex';
    const labels = rangesDiv.querySelectorAll('label');
    if (labels[0]) labels[0].textContent = 'A (41-50)';
    if (labels[1]) labels[1].textContent = 'B (31-40)';
    if (labels[2]) labels[2].textContent = 'C (21-30)';
    if (labels[3]) labels[3].textContent = 'D (11-20)';
    if (labels[4]) labels[4].textContent = 'E (0-10)';
    
    document.getElementById('subjectGradeA').max = 50;
    document.getElementById('subjectGradeB').max = 50;
    document.getElementById('subjectGradeC').max = 50;
    document.getElementById('subjectGradeD').max = 50;
    document.getElementById('subjectGradeE').max = 50;
    
    if (!document.getElementById('subjectGradeA').value) {
      document.getElementById('subjectGradeA').value = 41;
      document.getElementById('subjectGradeB').value = 31;
      document.getElementById('subjectGradeC').value = 21;
      document.getElementById('subjectGradeD').value = 11;
      document.getElementById('subjectGradeE').value = 0;
    }
  } else {
    rangesDiv.style.display = 'flex';
    const labels = rangesDiv.querySelectorAll('label');
    if (labels[0]) labels[0].textContent = 'A (80-100)';
    if (labels[1]) labels[1].textContent = 'B (65-79)';
    if (labels[2]) labels[2].textContent = 'C (50-64)';
    if (labels[3]) labels[3].textContent = 'D (35-49)';
    if (labels[4]) labels[4].textContent = 'E (0-34)';
    
    document.getElementById('subjectGradeA').max = 100;
    document.getElementById('subjectGradeB').max = 100;
    document.getElementById('subjectGradeC').max = 100;
    document.getElementById('subjectGradeD').max = 100;
    document.getElementById('subjectGradeE').max = 100;
    
    if (!document.getElementById('subjectGradeA').value) {
      document.getElementById('subjectGradeA').value = 80;
      document.getElementById('subjectGradeB').value = 65;
      document.getElementById('subjectGradeC').value = 50;
      document.getElementById('subjectGradeD').value = 35;
      document.getElementById('subjectGradeE').value = 0;
    }
  }
  
  refreshReportWithNewSettings();
}

/**
 * Refresh report with new settings
 */
function refreshReportWithNewSettings() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  
  if (!darasa || !termId) return;
  
  const gradeA = parseFloat(document.getElementById('gradeA').value) || 80;
  const gradeB = parseFloat(document.getElementById('gradeB').value) || 65;
  const gradeC = parseFloat(document.getElementById('gradeC').value) || 50;
  const gradeD = parseFloat(document.getElementById('gradeD').value) || 35;
  const gradeE = parseFloat(document.getElementById('gradeE').value) || 0;
  
  const gradeSettings = { A: gradeA, B: gradeB, C: gradeC, D: gradeD, E: gradeE };
  
  const subjectGradeSystem = document.getElementById('subjectGradeSystem').value;
  const subjectGradeA = parseFloat(document.getElementById('subjectGradeA').value) || (subjectGradeSystem === 'out_of_50' ? 41 : 80);
  const subjectGradeB = parseFloat(document.getElementById('subjectGradeB').value) || (subjectGradeSystem === 'out_of_50' ? 31 : 65);
  const subjectGradeC = parseFloat(document.getElementById('subjectGradeC').value) || (subjectGradeSystem === 'out_of_50' ? 21 : 50);
  const subjectGradeD = parseFloat(document.getElementById('subjectGradeD').value) || (subjectGradeSystem === 'out_of_50' ? 11 : 35);
  const subjectGradeE = parseFloat(document.getElementById('subjectGradeE').value) || 0;
  
  const subjectGradeSettings = {
    system: subjectGradeSystem,
    a_min: subjectGradeA,
    b_min: subjectGradeB,
    c_min: subjectGradeC,
    d_min: subjectGradeD,
    e_min: subjectGradeE
  };
  
  const results = getCachedResults(darasa, termId);
  const subjects = getCachedSubjects().map(s => s.somo);
  
  if (results.length > 0 && subjects.length > 0) {
    displayReportWithSubjects(results, subjects, gradeSettings, subjectGradeSettings);
  }
}

/**
 * Save grade settings
 */
function saveGradeSettings() {
  const darasa = document.getElementById('darasaReport').value;
  const gradeA = document.getElementById('gradeA').value;
  const gradeB = document.getElementById('gradeB').value;
  const gradeC = document.getElementById('gradeC').value;
  const gradeD = document.getElementById('gradeD').value;
  const gradeE = document.getElementById('gradeE').value;
  
  if (!darasa) {
    Notiflix.Notify.warning('Tafadhali chagua darasa kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  if (!gradeA || !gradeB || !gradeC || !gradeD || !gradeE) {
    Notiflix.Notify.warning('Tafadhali jaza mipangilio ya madaraja yote', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const gradeSettings = {
    A: parseFloat(gradeA),
    B: parseFloat(gradeB),
    C: parseFloat(gradeC),
    D: parseFloat(gradeD),
    E: parseFloat(gradeE)
  };
  
  const saveBtn = document.querySelector('#reportDashboard .btn-primary[onclick="saveGradeSettings()"]');
  let originalHTML = '';
  
  if (saveBtn) {
    originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
    saveBtn.disabled = true;
  }
  
  const data = {
    action: 'saveGradeSettings',
    dbId: currentDbId,
    darasa: darasa,
    gradeSettings: gradeSettings
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    setCachedGradeSettings(darasa, gradeSettings);
    if (saveBtn) {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }
    Notiflix.Notify.success('Mipangilio imehifadhiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    refreshReportWithNewSettings();
    return;
  }
  
  apiRequest(data)
    .then(data => {
      if (saveBtn) {
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
      }
      
      if (data.status === 'success') {
        setCachedGradeSettings(darasa, gradeSettings);
        Notiflix.Notify.success('Mipangilio ya madaraja imehifadhiwa', {
          timeout: 2000,
          position: 'right-top'
        });
        refreshReportWithNewSettings();
      } else {
        Notiflix.Notify.failure(data.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      if (saveBtn) {
        saveBtn.innerHTML = originalHTML;
        saveBtn.disabled = false;
      }
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
    });
}

/**
 * Save subject grade settings
 */
function saveSubjectGradeSettings() {
  const darasa = document.getElementById('darasaReport').value;
  const system = document.getElementById('subjectGradeSystem').value;
  
  if (!darasa) {
    Notiflix.Notify.warning('Tafadhali chagua darasa kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const settings = {
    system: system,
    a_min: parseInt(document.getElementById('subjectGradeA').value) || (system === 'out_of_50' ? 41 : 80),
    b_min: parseInt(document.getElementById('subjectGradeB').value) || (system === 'out_of_50' ? 31 : 65),
    c_min: parseInt(document.getElementById('subjectGradeC').value) || (system === 'out_of_50' ? 21 : 50),
    d_min: parseInt(document.getElementById('subjectGradeD').value) || (system === 'out_of_50' ? 11 : 35),
    e_min: parseInt(document.getElementById('subjectGradeE').value) || 0
  };
  
  const saveBtn = document.querySelector('#reportDashboard .btn-primary[onclick="saveSubjectGradeSettings()"]');
  let originalHTML = '';
  
  if (saveBtn) {
    originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inahifadhi...';
    saveBtn.disabled = true;
  }
  
  if (!isOnline()) {
    if (saveBtn) {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }
    Notiflix.Notify.warning('Kuhifadhi mipangilio kunahitaji mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  apiRequest({
    action: 'saveSubjectGradeSettings',
    dbId: currentDbId,
    darasa: darasa,
    settings: settings
  })
  .then(data => {
    if (saveBtn) {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }
    
    if (data.status === 'success') {
      setCachedSubjectGradeSettings(darasa, settings);
      Notiflix.Notify.success('Mipangilio ya daraja za masomo imehifadhiwa', {
        timeout: 2000,
        position: 'right-top'
      });
      refreshReportWithNewSettings();
    } else {
      Notiflix.Notify.failure(data.message, {
        timeout: 3000,
        position: 'right-top'
      });
    }
  })
  .catch(error => {
    if (saveBtn) {
      saveBtn.innerHTML = originalHTML;
      saveBtn.disabled = false;
    }
    Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
      timeout: 3000,
      position: 'right-top'
    });
  });
}

/**
 * Load subject grade settings
 */
function loadSubjectGradeSettings() {
  const darasa = document.getElementById('darasaReport').value;
  
  if (!currentDbId || !darasa) return;
  
  const cachedSettings = getCachedSubjectGradeSettings(darasa);
  
  if (cachedSettings) {
    document.getElementById('subjectGradeSystem').value = cachedSettings.system || 'out_of_50';
    document.getElementById('subjectGradeA').value = cachedSettings.a_min || (cachedSettings.system === 'out_of_50' ? 41 : 80);
    document.getElementById('subjectGradeB').value = cachedSettings.b_min || (cachedSettings.system === 'out_of_50' ? 31 : 65);
    document.getElementById('subjectGradeC').value = cachedSettings.c_min || (cachedSettings.system === 'out_of_50' ? 21 : 50);
    document.getElementById('subjectGradeD').value = cachedSettings.d_min || (cachedSettings.system === 'out_of_50' ? 11 : 35);
    document.getElementById('subjectGradeE').value = cachedSettings.e_min || 0;
    toggleSubjectGradeRanges();
  }
}

/**
 * Display student selection checkboxes
 */
function displayStudentSelectionCheckboxes() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  const container = document.getElementById('studentSelectionContainer');
  
  if (!darasa) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #f72585;">
        <p>Tafadhali chagua darasa kwanza</p>
      </div>
    `;
    return;
  }
  
  if (!termId) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #f72585;">
        <p>Tafadhali chagua muhula kwanza</p>
      </div>
    `;
    return;
  }
  
  const students = getCachedStudents(darasa);
  
  if (students.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #666;">
        <p>Hakuna wanafunzi katika darasa hili</p>
      </div>
    `;
    return;
  }
  
  let html = `
    <div style="margin-bottom: 15px; font-size: 14px; color: #4361ee;">
      <strong>Wanafunzi ${students.length} waliochaguliwa: <span id="selectedCount">0</span></strong>
    </div>
    <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px;">
  `;
  
  students.forEach((student, index) => {
    html += `
      <div class="student-checkbox-item" style="display: flex; align-items: center; padding: 8px; background: #f8f9fa; border-radius: 6px;">
        <input type="checkbox" id="student_${index}" value="${escapeHtml(student.jina)}" 
               class="student-checkbox" onchange="updateSelectedCount()"
               style="margin-right: 10px; transform: scale(1.2);">
        <label for="student_${index}" style="flex: 1; cursor: pointer;">
          <strong>${escapeHtml(student.jina)}</strong>
          <span style="font-size: 12px; color: #666; margin-left: 10px;">
            ${student.jinsi === 'M' ? '👦' : '👧'}
          </span>
        </label>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
    <div style="margin-top: 15px; font-size: 12px; color: #666;">
      <p>✓ Chagua angalau mwanafunzi mmoja kwa kuweka alama kwenye kisanduku</p>
      <p>✓ Kila mwanafunzi atakuwa na ukurasa wake tofauti kwenye PDF file</p>
    </div>
  `;
  
  container.innerHTML = html;
  updateSelectedCount();
}

/**
 * Update selected count
 */
function updateSelectedCount() {
  const checkboxes = document.querySelectorAll('.student-checkbox');
  let selectedCount = 0;
  
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) selectedCount++;
  });
  
  const countElement = document.getElementById('selectedCount');
  if (countElement) {
    countElement.textContent = selectedCount;
    countElement.style.color = selectedCount > 0 ? '#4caf50' : '#f72585';
  }
}

/**
 * Select all students
 */
function selectAllStudents() {
  document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = true);
  updateSelectedCount();
}

/**
 * Deselect all students
 */
function deselectAllStudents() {
  document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = false);
  updateSelectedCount();
}

/**
 * Get selected students
 * @returns {Array} Selected student names
 */
function getSelectedStudents() {
  const checkboxes = document.querySelectorAll('.student-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Generate selected students report
 */
function generateSelectedStudentsReport() {
  const darasa = document.getElementById('darasaReport').value;
  const termId = document.getElementById('termReport').value;
  const selectedStudents = getSelectedStudents();
  
  if (!termId) {
    Notiflix.Notify.warning('Tafadhali chagua muhula kwanza', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  if (selectedStudents.length === 0) {
    Notiflix.Notify.warning('Tafadhali chagua angalau mwanafunzi mmoja', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  const reportBtn = document.querySelector('#reportDashboard .btn-primary[onclick="generateSelectedStudentsReport()"]');
  let originalHTML = '';
  
  if (reportBtn) {
    originalHTML = reportBtn.innerHTML;
    reportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inatengeneza Ripoti...';
    reportBtn.disabled = true;
  }
  
  const classTeacherName = document.getElementById('classTeacherName')?.value || '';
  const headTeacherName = document.getElementById('headTeacherName')?.value || '';
  const principalMessage = document.getElementById('principalMessage')?.value || '';
  const termStartDate = document.getElementById('termStartDate')?.value || '';
  const termEndDate = document.getElementById('termEndDate')?.value || '';
  
  const reportSettings = {
    classTeacherName: classTeacherName,
    headTeacherName: headTeacherName,
    principalMessage: principalMessage,
    termStartDate: termStartDate,
    termEndDate: termEndDate
  };
  
  const gradeA = document.getElementById('gradeA').value;
  const gradeB = document.getElementById('gradeB').value;
  const gradeC = document.getElementById('gradeC').value;
  const gradeD = document.getElementById('gradeD').value;
  const gradeE = document.getElementById('gradeE').value;
  
  const gradeSettings = {
    A: parseFloat(gradeA) || 80,
    B: parseFloat(gradeB) || 65,
    C: parseFloat(gradeC) || 50,
    D: parseFloat(gradeD) || 35,
    E: parseFloat(gradeE) || 0
  };
  
  const subjectGradeSystem = document.getElementById('subjectGradeSystem').value;
  const subjectGradeA = document.getElementById('subjectGradeA').value;
  const subjectGradeB = document.getElementById('subjectGradeB').value;
  const subjectGradeC = document.getElementById('subjectGradeC').value;
  const subjectGradeD = document.getElementById('subjectGradeD').value;
  const subjectGradeE = document.getElementById('subjectGradeE').value;
  
  const subjectGradeSettings = {
    system: subjectGradeSystem,
    a_min: parseFloat(subjectGradeA) || (subjectGradeSystem === 'out_of_50' ? 41 : 80),
    b_min: parseFloat(subjectGradeB) || (subjectGradeSystem === 'out_of_50' ? 31 : 65),
    c_min: parseFloat(subjectGradeC) || (subjectGradeSystem === 'out_of_50' ? 21 : 50),
    d_min: parseFloat(subjectGradeD) || (subjectGradeSystem === 'out_of_50' ? 11 : 35),
    e_min: parseFloat(subjectGradeE) || 0
  };
  
  const data = {
    action: 'generateStudentReportPDF',
    dbId: currentDbId,
    darasa: darasa,
    studentNames: selectedStudents,
    gradeSettings: gradeSettings,
    subjectGradeSettings: subjectGradeSettings,
    termId: termId,
    reportSettings: reportSettings
  };
  
  if (!isOnline()) {
    addToOfflineQueue(data);
    if (reportBtn) {
      reportBtn.innerHTML = originalHTML;
      reportBtn.disabled = false;
    }
    Notiflix.Notify.success('Ombi limehifadhiwa nje ya mtandao', {
      timeout: 2000,
      position: 'right-top'
    });
    return;
  }
  
  apiRequest(data)
    .then(response => {
      if (reportBtn) {
        reportBtn.innerHTML = originalHTML;
        reportBtn.disabled = false;
      }
      
      if (response.status === 'success') {
        const link = document.createElement('a');
        link.href = response.fileUrl;
        link.download = response.fileName || `${darasa}_Ripoti.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Notiflix.Notify.success(`✅ Ripoti ${response.studentCount} zimepakuliwa!`, {
          timeout: 3000,
          position: 'right-top'
        });
      } else {
        Notiflix.Notify.failure(response.message, {
          timeout: 3000,
          position: 'right-top'
        });
      }
    })
    .catch(error => {
      if (reportBtn) {
        reportBtn.innerHTML = originalHTML;
        reportBtn.disabled = false;
      }
      Notiflix.Notify.failure('Hitilafu ya mtandao. Tafadhali jaribu tena.', {
        timeout: 3000,
        position: 'right-top'
      });
    });
}

/**
 * Show report settings
 */
function showReportSettings() {
  const darasa = document.getElementById('darasaReport').value;
  
  if (!darasa) {
    Swal.fire({
      icon: 'warning',
      title: 'Chagua Darasa',
      text: 'Tafadhali chagua darasa kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  document.getElementById('settingsDarasaName').textContent = darasa;
  document.getElementById('reportSettingsOverlay').classList.remove('hidden');
  document.getElementById('reportSettingsModal').classList.remove('hidden');
  loadReportSettings(darasa);
}

/**
 * Hide report settings
 */
function hideReportSettingsModal() {
  document.getElementById('reportSettingsOverlay').classList.add('hidden');
  document.getElementById('reportSettingsModal').classList.add('hidden');
}

/**
 * Load report settings
 * @param {string} darasa - Class name
 */
function loadReportSettings(darasa) {
  if (!isOnline()) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtandao',
      text: 'Kupakia mipangilio kunahitaji mtandao',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Notiflix.Loading.standard('Inapakia mipangilio ya ripoti...');
  
  apiRequest({
    action: 'getReportSettings',
    dbId: currentDbId,
    darasa: darasa
  })
  .then(data => {
    Notiflix.Loading.remove();
    
    if (data.status === 'success') {
      document.getElementById('classTeacherName').value = data.settings.classTeacherName || '';
      document.getElementById('headTeacherName').value = data.settings.headTeacherName || '';
      document.getElementById('principalMessage').value = data.settings.principalMessage || '';
      document.getElementById('termStartDate').value = data.settings.termStartDate || '';
      document.getElementById('termEndDate').value = data.settings.termEndDate || '';
    }
  })
  .catch(error => {
    Notiflix.Loading.remove();
    console.error('Error loading report settings:', error);
  });
}

/**
 * Save report settings
 */
function saveReportSettingsForClass() {
  const darasa = document.getElementById('darasaReport').value;
  const classTeacherName = document.getElementById('classTeacherName').value;
  const headTeacherName = document.getElementById('headTeacherName').value;
  const principalMessage = document.getElementById('principalMessage').value;
  const termStartDate = document.getElementById('termStartDate').value;
  const termEndDate = document.getElementById('termEndDate').value;
  
  if (!darasa) {
    Swal.fire({
      icon: 'warning',
      title: 'Darasa Halijachaguliwa',
      text: 'Tafadhali chagua darasa kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (!isOnline()) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtandao',
      text: 'Kuhifadhi mipangilio kunahitaji mtandao',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Notiflix.Loading.standard('Inahifadhi mipangilio ya ripoti...');
  
  apiRequest({
    action: 'saveReportSettings',
    dbId: currentDbId,
    darasa: darasa,
    classTeacherName: classTeacherName,
    headTeacherName: headTeacherName,
    principalMessage: principalMessage,
    termStartDate: termStartDate,
    termEndDate: termEndDate
  })
  .then(data => {
    Notiflix.Loading.remove();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Imefanikiwa',
        text: data.message,
        confirmButtonColor: '#4361ee',
        timer: 2000
      }).then(() => {
        hideReportSettingsModal();
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