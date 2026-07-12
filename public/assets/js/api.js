// ============================================
// API CLIENT
// =========// ============================================
// API CLIENT - VERSION IMARA
// ============================================

/**
 * Send an API request
 * @param {Object} data - Request data
 * @param {boolean} useOffline - Whether to queue if offline
 * @returns {Promise} Response promise
 */
function apiRequest(data, useOffline = true) {
  console.log('📤 API Request:', data);
  console.log('📤 SCRIPT_URL:', CONFIG.SCRIPT_URL);

  return new Promise((resolve, reject) => {
    // If offline and useOffline is true, queue the request
    if (!isOnline() && useOffline) {
      console.log('📴 Offline - queueing request');
      addToOfflineQueue(data);
      resolve({ status: 'queued', message: 'Request queued for offline sync' });
      return;
    }
    
    // If offline and useOffline is false, reject
    if (!isOnline() && !useOffline) {
      console.log('📴 Offline - rejecting request');
      reject(new Error('Offline and useOffline is false'));
      return;
    }
    
    // Send request
    console.log('🌐 Sending request to:', CONFIG.SCRIPT_URL);
    
    fetch(CONFIG.SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      mode: 'cors' // Important!
    })
    .then(response => {
      console.log('📨 Response status:', response.status);
      console.log('📨 Response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('📨 Response data:', data);
      resolve(data);
    })
    .catch(error => {
      console.error('❌ Fetch error:', error);
      
      // If request fails and useOffline is true, queue it
      if (useOffline) {
        console.log('📴 Queueing request for offline sync');
        addToOfflineQueue(data);
        resolve({ status: 'queued', message: 'Request queued for offline sync' });
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Login user - TEST FUNCTION
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Login response
 */
function loginUser(email, password) {
  console.log('🔐 Login attempt for:', email);
  
  return apiRequest({
    action: 'login',
    email: email,
    password: password
  }, false);
}

/**
 * Register user
 * @param {Object} data - Registration data
 * @returns {Promise} Registration response
 */
function registerUser(data) {
  console.log('📝 Register attempt for:', data.email);
  
  return apiRequest({
    action: 'register',
    email: data.email,
    password: data.password,
    schoolName: data.schoolName,
    subscriptionType: data.subscriptionType || 'Trial',
    trialEndDate: data.trialEndDate || null,
    subscriptionEndDate: data.subscriptionEndDate || null
  }, false);
}

/**
 * Recover password
 * @param {string} email - User email
 * @returns {Promise} Recovery response
 */
function recoverPassword(email) {
  console.log('🔑 Password recovery for:', email);
  
  return apiRequest({
    action: 'recoverPassword',
    email: email
  }, false);
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} Login response
 */
function loginUser(email, password) {
  return apiRequest({
    action: 'login',
    email: email,
    password: password
  }, false);
}

/**
 * Register user
 * @param {Object} data - Registration data
 * @returns {Promise} Registration response
 */
function registerUser(data) {
  return apiRequest({
    action: 'register',
    email: data.email,
    password: data.password,
    schoolName: data.schoolName,
    subscriptionType: data.subscriptionType || 'Trial',
    trialEndDate: data.trialEndDate || null,
    subscriptionEndDate: data.subscriptionEndDate || null
  }, false);
}

/**
 * Recover password
 * @param {string} email - User email
 * @returns {Promise} Recovery response
 */
function recoverPassword(email) {
  return apiRequest({
    action: 'recoverPassword',
    email: email
  }, false);
}

/**
 * Get all users (developer only)
 * @param {string} developerKey - Developer key
 * @returns {Promise} Users response
 */
function getAllUsers(developerKey) {
  return apiRequest({
    action: 'getAllUsers',
    developerKey: developerKey
  }, false);
}

/**
 * Get user data (developer only)
 * @param {string} email - User email
 * @param {string} developerKey - Developer key
 * @returns {Promise} User data response
 */
function getUserData(email, developerKey) {
  return apiRequest({
    action: 'getUserData',
    developerKey: developerKey,
    userEmail: email
  }, false);
}

/**
 * Edit user account (developer only)
 * @param {Object} data - Edit data
 * @returns {Promise} Edit response
 */
function editUserAccount(data) {
  return apiRequest({
    action: 'editUserAccount',
    developerKey: CONFIG.DEVELOPER_KEY,
    oldEmail: data.oldEmail,
    newEmail: data.newEmail,
    newPassword: data.newPassword,
    newSchoolName: data.newSchoolName,
    subscriptionType: data.subscriptionType,
    trialEndDate: data.trialEndDate,
    subscriptionEndDate: data.subscriptionEndDate
  }, false);
}

/**
 * Close user account (developer only)
 * @param {string} email - User email
 * @returns {Promise} Close response
 */
function closeUserAccount(email) {
  return apiRequest({
    action: 'closeUserAccount',
    developerKey: CONFIG.DEVELOPER_KEY,
    userEmail: email
  }, false);
}

/**
 * Reactivate user account (developer only)
 * @param {string} email - User email
 * @returns {Promise} Reactivate response
 */
function reactivateUserAccount(email) {
  return apiRequest({
    action: 'reactivateUserAccount',
    developerKey: CONFIG.DEVELOPER_KEY,
    userEmail: email
  }, false);
}

/**
 * Delete user account (developer only)
 * @param {string} email - User email
 * @returns {Promise} Delete response
 */
function deleteUserAccount(email) {
  return apiRequest({
    action: 'deleteUserAccount',
    developerKey: CONFIG.DEVELOPER_KEY,
    userEmail: email
  }, false);
}

/**
 * Update user subscription (developer only)
 * @param {Object} data - Subscription data
 * @returns {Promise} Update response
 */
function updateUserSubscription(data) {
  return apiRequest({
    action: 'updateUserSubscription',
    developerKey: CONFIG.DEVELOPER_KEY,
    userEmail: data.email,
    subscriptionType: data.subscriptionType,
    value: data.value,
    customDate: data.customDate
  }, false);
}

/**
 * Get user subscription status
 * @param {string} email - User email
 * @returns {Promise} Status response
 */
function getUserSubscriptionStatus(email) {
  return apiRequest({
    action: 'getUserSubscriptionStatus',
    email: email
  }, true);
}

/**
 * Verify subscription
 * @param {string} dbId - School database ID
 * @param {string} userType - User type (owner/staff)
 * @returns {Promise} Verification response
 */
function verifySubscription(dbId, userType) {
  return apiRequest({
    action: 'verifySubscription',
    dbId: dbId,
    userType: userType || 'owner'
  }, true);
}

/**
 * Get payment information
 * @returns {Promise} Payment info response
 */
function getPaymentInformation() {
  return apiRequest({
    action: 'getPaymentInfo'
  }, false);
}

/**
 * Check email exists everywhere
 * @param {string} email - Email to check
 * @returns {Promise} Check response
 */
function checkEmailExistsEverywhere(email) {
  return apiRequest({
    action: 'checkEmailExistsEverywhere',
    email: email
  }, false);
}
