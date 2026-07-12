// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Get cached data
 * @param {string} key - Cache key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Cached data
 */
function getCache(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {*} value - Data to cache
 */
function setCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}

/**
 * Remove cached data
 * @param {string} key - Cache key
 */
function removeCache(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('Cache remove failed:', e);
  }
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  const keys = Object.values(CONFIG.CACHE_KEYS);
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Cache clear failed:', key);
    }
  });
}

/**
 * Get cached students
 * @param {string} darasa - Class name
 * @returns {Array} Students
 */
function getCachedStudents(darasa) {
  const cache = getCache(CONFIG.CACHE_KEYS.STUDENTS, {});
  return cache[darasa] || [];
}

/**
 * Set cached students
 * @param {string} darasa - Class name
 * @param {Array} students - Students array
 */
function setCachedStudents(darasa, students) {
  const cache = getCache(CONFIG.CACHE_KEYS.STUDENTS, {});
  cache[darasa] = students;
  setCache(CONFIG.CACHE_KEYS.STUDENTS, cache);
}

/**
 * Get cached subjects
 * @returns {Array} Subjects
 */
function getCachedSubjects() {
  return getCache(CONFIG.CACHE_KEYS.SUBJECTS, []);
}

/**
 * Set cached subjects
 * @param {Array} subjects - Subjects array
 */
function setCachedSubjects(subjects) {
  setCache(CONFIG.CACHE_KEYS.SUBJECTS, subjects);
}

/**
 * Get cached results
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @returns {Array} Results
 */
function getCachedResults(darasa, termId) {
  const cache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  return cache[darasa]?.[termId] || [];
}

/**
 * Set cached results
 * @param {string} darasa - Class name
 * @param {string} termId - Term ID
 * @param {Array} results - Results array
 */
function setCachedResults(darasa, termId, results) {
  const cache = getCache(CONFIG.CACHE_KEYS.RESULTS, {});
  if (!cache[darasa]) cache[darasa] = {};
  cache[darasa][termId] = results;
  setCache(CONFIG.CACHE_KEYS.RESULTS, cache);
}

/**
 * Get cached terms
 * @returns {Array} Terms
 */
function getCachedTerms() {
  const cache = getCache(CONFIG.CACHE_KEYS.TERMS, {});
  return cache[currentDbId] || [];
}

/**
 * Set cached terms
 * @param {Array} terms - Terms array
 */
function setCachedTerms(terms) {
  const cache = getCache(CONFIG.CACHE_KEYS.TERMS, {});
  cache[currentDbId] = terms;
  setCache(CONFIG.CACHE_KEYS.TERMS, cache);
}

/**
 * Get cached staff
 * @returns {Array} Staff
 */
function getCachedStaff() {
  return getCache(CONFIG.CACHE_KEYS.STAFF, []);
}

/**
 * Set cached staff
 * @param {Array} staff - Staff array
 */
function setCachedStaff(staff) {
  setCache(CONFIG.CACHE_KEYS.STAFF, staff);
}

/**
 * Get cached grade settings
 * @param {string} darasa - Class name
 * @returns {Object} Grade settings
 */
function getCachedGradeSettings(darasa) {
  const cache = getCache(CONFIG.CACHE_KEYS.GRADE_SETTINGS, {});
  return cache[darasa] || CONFIG.DEFAULT_GRADES;
}

/**
 * Set cached grade settings
 * @param {string} darasa - Class name
 * @param {Object} settings - Grade settings
 */
function setCachedGradeSettings(darasa, settings) {
  const cache = getCache(CONFIG.CACHE_KEYS.GRADE_SETTINGS, {});
  cache[darasa] = settings;
  setCache(CONFIG.CACHE_KEYS.GRADE_SETTINGS, cache);
}

/**
 * Get cached subject grade settings
 * @param {string} darasa - Class name
 * @returns {Object} Subject grade settings
 */
function getCachedSubjectGradeSettings(darasa) {
  const cache = getCache(CONFIG.CACHE_KEYS.SUBJECT_GRADE_SETTINGS, {});
  return cache[darasa] || CONFIG.DEFAULT_SUBJECT_GRADES;
}

/**
 * Set cached subject grade settings
 * @param {string} darasa - Class name
 * @param {Object} settings - Subject grade settings
 */
function setCachedSubjectGradeSettings(darasa, settings) {
  const cache = getCache(CONFIG.CACHE_KEYS.SUBJECT_GRADE_SETTINGS, {});
  cache[darasa] = settings;
  setCache(CONFIG.CACHE_KEYS.SUBJECT_GRADE_SETTINGS, cache);
}

/**
 * Get cached system settings
 * @returns {Object} System settings
 */
function getCachedSystemSettings() {
  return getCache(CONFIG.CACHE_KEYS.SYSTEM_SETTINGS, {});
}

/**
 * Set cached system settings
 * @param {Object} settings - System settings
 */
function setCachedSystemSettings(settings) {
  setCache(CONFIG.CACHE_KEYS.SYSTEM_SETTINGS, settings);
}

/**
 * Get cached exit sheets
 * @returns {Array} Exit sheets
 */
function getCachedExitSheets() {
  return getCache(CONFIG.CACHE_KEYS.EXIT_SHEETS, []);
}

/**
 * Set cached exit sheets
 * @param {Array} exitSheets - Exit sheets array
 */
function setCachedExitSheets(exitSheets) {
  setCache(CONFIG.CACHE_KEYS.EXIT_SHEETS, exitSheets);
}

/**
 * Get cached selected subjects
 * @param {string} darasa - Class name
 * @returns {Array} Selected subjects
 */
function getCachedSelectedSubjects(darasa) {
  const cache = getCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, {});
  return cache[darasa] || [];
}

/**
 * Set cached selected subjects
 * @param {string} darasa - Class name
 * @param {Array} subjects - Selected subjects
 */
function setCachedSelectedSubjects(darasa, subjects) {
  const cache = getCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, {});
  cache[darasa] = subjects;
  setCache(CONFIG.CACHE_KEYS.SELECTED_SUBJECTS, cache);
}

/**
 * Get offline queue
 * @returns {Array} Offline queue
 */
function getOfflineQueue() {
  return getCache(CONFIG.CACHE_KEYS.OFFLINE_QUEUE, []);
}

/**
 * Set offline queue
 * @param {Array} queue - Offline queue
 */
function setOfflineQueue(queue) {
  setCache(CONFIG.CACHE_KEYS.OFFLINE_QUEUE, queue);
}

/**
 * Add action to offline queue
 * @param {Object} action - Action to queue
 */
function addToOfflineQueue(action) {
  const queue = getOfflineQueue();
  queue.push(action);
  setOfflineQueue(queue);
}

/**
 * Get subscription status
 * @returns {Object} Subscription status
 */
function getCachedSubscription() {
  return getCache(CONFIG.CACHE_KEYS.SUBSCRIPTION, null);
}

/**
 * Set subscription status
 * @param {Object} status - Subscription status
 */
function setCachedSubscription(status) {
  setCache(CONFIG.CACHE_KEYS.SUBSCRIPTION, status);
}

/**
 * Get trial end time
 * @returns {Date|null} Trial end time
 */
function getCachedTrialEndTime() {
  const data = getCache(CONFIG.CACHE_KEYS.TRIAL_END, null);
  return data ? new Date(data) : null;
}

/**
 * Set trial end time
 * @param {Date} endTime - Trial end time
 */
function setCachedTrialEndTime(endTime) {
  setCache(CONFIG.CACHE_KEYS.TRIAL_END, endTime.toISOString());
}