// ============================================
// OFFLINE MANAGEMENT
// ============================================

let syncInterval = null;
let isSyncing = false;

/**
 * Initialize offline system
 */
function initOfflineSystem() {
  // Listen for online/offline events
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Start periodic sync
  startPeriodicSync();
  
  // Initial sync if online
  if (isOnline() && currentDbId) {
    setTimeout(() => syncOfflineQueue(), 5000);
  }
}

/**
 * Handle online event
 */
function handleOnline() {
  console.log('📶 Back online - syncing data');
  showOfflineNotice(false);
  syncOfflineQueue();
  checkSubscriptionStatus(false);
}

/**
 * Handle offline event
 */
function handleOffline() {
  console.log('📴 Offline mode - using cached data');
  showOfflineNotice(true);
}

/**
 * Show/hide offline notice
 * @param {boolean} show - Show or hide
 */
function showOfflineNotice(show) {
  const notices = document.querySelectorAll('.offline-notice');
  notices.forEach(notice => {
    if (show) {
      notice.classList.remove('hidden');
    } else {
      notice.classList.add('hidden');
    }
  });
}

/**
 * Start periodic sync
 */
function startPeriodicSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }
  
  syncInterval = setInterval(() => {
    if (isOnline() && currentDbId) {
      console.log('⏰ Periodic sync running...');
      syncOfflineQueue();
    }
  }, CONFIG.SYNC_INTERVAL);
}

/**
 * Sync offline queue
 */
function syncOfflineQueue() {
  if (!isOnline() || !currentDbId || isSyncing) return;
  
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  
  isSyncing = true;
  console.log(`🔄 Syncing ${queue.length} offline actions...`);
  
  // Show subtle notification
  Notiflix.Notify.info(`Inasawazisha vitendo ${queue.length} vilivyohifadhiwa nje ya mtandao...`, {
    timeout: 3000,
    position: 'right-top'
  });
  
  const promises = queue.map(action => {
    return apiRequest(action)
      .then(data => ({ action, data, success: data?.status === 'success' }))
      .catch(error => ({ action, error: error.message, success: false }));
  });
  
  Promise.all(promises)
    .then(results => {
      const successfulActions = [];
      const failedActions = [];
      
      results.forEach(({ action, data, success, error }) => {
        if (success) {
          successfulActions.push(action);
          updateCacheAfterSync(action, data);
        } else {
          failedActions.push(action);
          console.log('❌ Sync failed:', action.action, error || data?.message);
        }
      });
      
      // Update queue with failed actions only
      setOfflineQueue(failedActions);
      
      // Show appropriate message
      if (successfulActions.length > 0 && failedActions.length === 0) {
        Notiflix.Notify.success(`Vitendo ${successfulActions.length} vimesawazishwa kikamilifu`, {
          timeout: 2000,
          position: 'right-top'
        });
      } else if (successfulActions.length > 0 && failedActions.length > 0) {
        Notiflix.Notify.warning(`Vitendo ${successfulActions.length} vimesawazishwa, ${failedActions.length} vimesalia`, {
          timeout: 3000,
          position: 'right-top'
        });
      } else if (failedActions.length > 0) {
        Notiflix.Notify.warning(`Vitendo ${failedActions.length} havijasawazishwa. Vitasawazishwa baadaye.`, {
          timeout: 3000,
          position: 'right-top'
        });
      }
      
      // Refresh dashboards after sync
      if (successfulActions.length > 0) {
        refreshDashboardsAfterSync();
      }
    })
    .catch(error => {
      console.error('Sync error:', error);
      Notiflix.Notify.warning('Hitilafu katika kusawazisha data. Itajaribu tena baadaye.', {
        timeout: 3000,
        position: 'right-top'
      });
    })
    .finally(() => {
      isSyncing = false;
    });
}

/**
 * Update cache after successful sync
 * @param {Object} action - Synced action
 * @param {Object} data - Response data
 */
function updateCacheAfterSync(action, data) {
  try {
    if (action.action === 'registerStudent') {
      const darasa = action.darasa;
      const students = getCachedStudents(darasa);
      const exists = students.some(s => s.jina === action.jina);
      if (!exists) {
        students.push({ jina: action.jina, jinsi: action.jinsi });
        setCachedStudents(darasa, students);
      }
    } 
    else if (action.action === 'editStudent') {
      const darasa = action.darasa;
      const students = getCachedStudents(darasa);
      const updated = students.map(s => 
        s.jina === action.oldJina ? { jina: action.newJina, jinsi: action.jinsi } : s
      );
      setCachedStudents(darasa, updated);
      
      // Update results cache
      const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
      if (resultsCache[darasa]) {
        for (const termId in resultsCache[darasa]) {
          resultsCache[darasa][termId] = resultsCache[darasa][termId].map(r =>
            r.jina === action.oldJina ? { ...r, jina: action.newJina, jinsi: action.jinsi } : r
          );
        }
        setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
      }
    }
    else if (action.action === 'deleteStudent') {
      const darasa = action.darasa;
      const students = getCachedStudents(darasa);
      setCachedStudents(darasa, students.filter(s => s.jina !== action.jina));
      
      // Update results cache
      const resultsCache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
      if (resultsCache[darasa]) {
        for (const termId in resultsCache[darasa]) {
          resultsCache[darasa][termId] = resultsCache[darasa][termId].filter(r => r.jina !== action.jina);
        }
        setCache(CONFIG.CACHE_KEYS.RESULTS, resultsCache);
      }
    }
    else if (action.action === 'registerSubject') {
      const subjects = getCachedSubjects();
      const exists = subjects.some(s => s.somo === action.somo);
      if (!exists) {
        subjects.push({ somo: action.somo });
        setCachedSubjects(subjects);
        subjects = subjects;
      }
    }
    else if (action.action === 'saveTermResults') {
      const darasa = action.darasa;
      const termId = action.termId;
      const results = getCachedResults(darasa, termId);
      
      action.results.forEach(result => {
        const existing = results.find(r => r.jina === result.jina);
        if (existing) {
          existing.scores = { ...existing.scores, ...result.scores };
        } else {
          results.push(result);
        }
      });
      setCachedResults(darasa, termId, results);
    }
    else if (action.action === 'deleteAllSubjectScores') {
      const darasa = action.darasa;
      const termId = action.termId;
      const subject = action.subject;
      const results = getCachedResults(darasa, termId);
      
      results.forEach(result => {
        if (result.scores) {
          delete result.scores[subject];
        }
      });
      setCachedResults(darasa, termId, results);
    }
  } catch (error) {
    console.error('Error updating cache after sync:', error);
  }
}

/**
 * Refresh dashboards after sync
 */
function refreshDashboardsAfterSync() {
  const currentDashboard = localStorage.getItem('currentDashboard');
  
  if (currentDashboard === 'student') {
    loadStudents();
  } else if (currentDashboard === 'subject') {
    loadSubjects();
  } else if (currentDashboard === 'results') {
    loadResults();
  } else if (currentDashboard === 'report') {
    loadReport();
  } else if (currentDashboard === 'staff') {
    loadStaffMembers();
  }
}

/**
 * Retry failed sync
 */
function retryFailedSync() {
  const queue = getOfflineQueue();
  if (queue.length > 0 && isOnline() && currentDbId) {
    console.log(`🔄 Retrying sync for ${queue.length} failed actions...`);
    syncOfflineQueue();
  }
}

// Set up periodic retrysetInterval(() => {
  retryFailedSync();
}, CONFIG.RETRY_INTERVAL);

// Also retry when coming back online
window.addEventListener('online', function() {
  console.log('📶 Back online, retrying failed sync...');
  setTimeout(() => retryFailedSync(), 3000);
});