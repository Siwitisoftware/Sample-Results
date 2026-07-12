// ============================================
// AUTHENTICATION
// ============================================

let currentDbId = null;
let currentSchoolName = '';
let currentUserEmail = '';
let isDeveloper = false;
/**
 * Login user - VERSION IMARA KWA UCHUNGUZI
 */
function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  
  console.log('🔐 Login button clicked');
  console.log('📧 Email:', email);
  console.log('🔑 Password length:', password ? password.length : 0);
  
  if (!email || !password) {
    Swal.fire({
      icon: 'warning',
      title: 'Taarifa Zinakosekana',
      text: 'Tafadhali weka barua pepe na nenosiri',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  // First, test if API is reachable
  console.log('🧪 Testing API connection first...');
  
  Notiflix.Loading.standard('Inajaribu kuwasiliana na server...');
  
  testApiConnection()
    .then(testData => {
      console.log('✅ API test result:', testData);
      
      if (testData.status === 'success') {
        console.log('✅ API is reachable! Proceeding with login...');
        Notiflix.Loading.standard('Inaingiza...');
        return loginUser(email, password);
      } else {
        console.error('❌ API test failed:', testData);
        Notiflix.Loading.remove();
        throw new Error('API is not responding correctly. Response: ' + JSON.stringify(testData));
      }
    })
    .then(data => {
      Notiflix.Loading.remove();
      console.log('📨 Login response:', data);
      
      if (data.status === 'success') {
        handleSuccessfulLogin(data, email);
      } else if (data.status === 'trial_expired') {
        handleTrialExpired(data, email);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Kuingia Kumeshindikana',
          text: data.message || 'Hitilafu isiyojulikana',
          confirmButtonColor: '#4361ee'
        });
      }
    })
    .catch(error => {
      Notiflix.Loading.remove();
      console.error('❌ Login error:', error);
      
      // Show detailed error
      Swal.fire({
        icon: 'error',
        title: 'Hitilafu ya Mtandao',
        html: `
          <div style="text-align: left;">
            <p><strong>Imeshindikana kuwasiliana na server.</strong></p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              <strong>Error:</strong> ${error.message || 'Unknown error'}
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 5px;">
              <strong>SCRIPT_URL:</strong> ${CONFIG.SCRIPT_URL}
            </p>
            <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
              <p style="font-size: 12px; color: #666;">
                <strong>Maelekezo:</strong><br>
                1. Hakikisha SCRIPT_URL ni sahihi kwenye config.js<br>
                2. Hakikisha Apps Script ime-deploy kama Web App<br>
                3. Hakikisha "Who has access" ni "Anyone"<br>
                4. Angalia console kwa maelezo zaidi
              </p>
            </div>
          </div>
        `,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Sawa',
        width: '550px'
      });
    });
}


/**
 * Handle successful login
 * @param {Object} data - Login response
 * @param {string} email - User email
 */
function handleSuccessfulLogin(data, email) {
  if (data.userType === 'developer') {
    isDeveloper = true;
    localStorage.setItem('isDeveloper', 'true');
    showDeveloperDashboard();
    return;
  }
  
  currentDbId = data.dbId;
  currentSchoolName = data.schoolName;
  currentUserEmail = email;
  
  localStorage.setItem('dbId', data.dbId);
  localStorage.setItem('schoolName', data.schoolName);
  localStorage.setItem('userType', data.userType || 'owner');
  localStorage.setItem('currentUserEmail', email);
  
  if (data.userType === 'staff') {
    localStorage.setItem('staffName', data.staffName || 'Staff');
  }
  
  // Update sidebar school name
  const schoolNameDisplay = document.getElementById('schoolNameDisplay');
  if (schoolNameDisplay) {
    schoolNameDisplay.textContent = data.schoolName;
  }
  
  Notiflix.Notify.success('Kuingia kumefanikiwa', {
    timeout: 2000,
    position: 'right-top'
  });
  
  // Go to dashboard
  const savedDashboard = localStorage.getItem('currentDashboard') || 'student';
  showDashboard(savedDashboard);
  
  // Initialize timer system
  setTimeout(() => {
    initTimerSystem();
  }, 1000);
  
  // Check subscription status
  if (data.subscriptionInfo) {
    const subscriptionStatus = {
      status: 'active',
      isPremium: data.subscriptionInfo.isPremium || false,
      timeRemaining: 0,
      subscriptionType: data.subscriptionInfo.type || 'Trial'
    };
    
    if (data.subscriptionInfo.trialEndDate) {
      const trialEndTime = new Date(data.subscriptionInfo.trialEndDate);
      setCachedTrialEndTime(trialEndTime);
    }
    
    setCachedSubscription(subscriptionStatus);
    updateTimerDisplay();
  }
  
  // Check staff access
  if (data.userType === 'staff') {
    setTimeout(() => checkStaffReportAccess(), 2000);
  }
}

/**
 * Handle trial expired
 * @param {Object} data - Trial expired response
 * @param {string} email - User email
 */
function handleTrialExpired(data, email) {
  currentDbId = data.dbId;
  currentSchoolName = data.schoolName;
  currentUserEmail = email;
  
  localStorage.setItem('dbId', data.dbId);
  localStorage.setItem('schoolName', data.schoolName);
  localStorage.setItem('userType', data.userType || 'owner');
  localStorage.setItem('currentUserEmail', email);
  
  if (data.userType === 'staff') {
    localStorage.setItem('staffName', data.staffName || 'Staff');
  }
  
  const schoolNameDisplay = document.getElementById('schoolNameDisplay');
  if (schoolNameDisplay) {
    schoolNameDisplay.textContent = data.schoolName;
  }
  
  Swal.fire({
    icon: 'warning',
    title: 'Muda Wa Matumizi Umeisha',
    html: `
      <div style="text-align: center;">
        <p>${data.message}</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p><strong>💰 Ada ya Mwezi:</strong> ${data.paymentInfo?.monthly || 'TZS 2,500'}</p>
          <p><strong>💰 Ada ya Mwaka:</strong> ${data.paymentInfo?.yearly || 'TZS 30,000'}</p>
        </div>
        <p><strong>Malipo Kupitia:</strong></p>
        <p>📱 M-Pesa: <strong>${data.paymentInfo?.mpesa || '+255750183275'}</strong></p>
        <p>📱 Mix By Yas: <strong>${data.paymentInfo?.mix || '+255652343371'}</strong></p>
      </div>
    `,
    confirmButtonText: 'Endelea kwenye Dashibodi',
    confirmButtonColor: '#4361ee',
    showCancelButton: true,
    cancelButtonText: 'Ghairi',
    cancelButtonColor: '#f72585'
  }).then(result => {
    if (result.isConfirmed) {
      const savedDashboard = localStorage.getItem('currentDashboard') || 'student';
      showDashboard(savedDashboard);
      
      const subscriptionStatus = {
        status: 'expired',
        isPremium: false,
        timeRemaining: 0
      };
      
      setCachedSubscription(subscriptionStatus);
      updateTimerDisplay();
      showPaymentOverlay();
      
      setTimeout(() => disableReportButtonsImmediately(), 200);
    }
  });
}

/**
 * Register user
 */
function register() {
  const termsAccepted = document.getElementById('acceptTerms').checked;
  
  if (!termsAccepted) {
    Swal.fire({
      icon: 'warning',
      title: 'Kubali Masharti',
      text: 'Tafadhali kubali Masharti na Kanuni za matumizi ili kuendelea',
      confirmButtonColor: '#4361ee',
      timer: 2000
    });
    return;
  }
  
  const schoolName = document.getElementById('schoolName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  // Validation
  if (!schoolName) {
    Swal.fire({ icon: 'warning', title: 'Jina la Shule Linakosekana', text: 'Tafadhali weka jina la shule yako', confirmButtonColor: '#4361ee', timer: 2000 });
    return;
  }
  
  if (!email) {
    Swal.fire({ icon: 'warning', title: 'Barua Pepe Inakosekana', text: 'Tafadhali weka barua pepe yako', confirmButtonColor: '#4361ee', timer: 2000 });
    return;
  }
  
  if (!email.includes('@') || !email.includes('.')) {
    Swal.fire({ icon: 'warning', title: 'Barua Pepe Si Sahihi', text: 'Tafadhali weka barua pepe sahihi', confirmButtonColor: '#4361ee', timer: 2000 });
    return;
  }
  
  const passwordCheck = checkPasswordStrength(password);
  if (!passwordCheck.valid) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Dhaifu', text: passwordCheck.message, confirmButtonColor: '#4361ee', timer: 2000 });
    return;
  }
  
  if (password !== confirmPassword) {
    Swal.fire({ icon: 'warning', title: 'Nenosiri Halifanani', text: 'Nenosiri na uthibitisho wake hazifanani', confirmButtonColor: '#4361ee', timer: 2000 });
    return;
  }
  
  // Show loading on button
  const registerBtn = document.getElementById('registerBtn');
  registerBtn.classList.add('loading');
  registerBtn.disabled = true;
  
  registerUser({ email, password, schoolName })
    .then(data => {
      registerBtn.classList.remove('loading');
      
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: '✅ Akaunti Imefunguliwa!',
          html: `
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">🎉</div>
              <p style="font-size: 16px; margin-bottom: 15px;">${data.message}</p>
              <div style="background: #f0f9ff; padding: 12px; border-radius: 10px; margin: 15px 0;">
                <p style="font-size: 14px; margin: 5px 0;"><i class="fas fa-clock"></i> <strong>Muda wa Majaribio:</strong> Dakika 30</p>
                <p style="font-size: 14px; margin: 5px 0;"><i class="fas fa-shield-alt"></i> <strong>Usalama:</strong> Imara</p>
              </div>
            </div>
          `,
          confirmButtonColor: '#4361ee',
          confirmButtonText: 'Ingia Sasa'
        }).then(() => {
          // Clear form
          document.getElementById('schoolName').value = '';
          document.getElementById('regEmail').value = '';
          document.getElementById('regPassword').value = '';
          document.getElementById('confirmPassword').value = '';
          document.getElementById('acceptTerms').checked = false;
          document.getElementById('registerBtn').disabled = true;
          showLogin();
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '❌ Usajili Umeshindikana',
          text: data.message,
          confirmButtonColor: '#4361ee'
        });
      }
    })
    .catch(error => {
      registerBtn.classList.remove('loading');
      Swal.fire({
        icon: 'error',
        title: '❌ Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      });
    });
}

/**
 * Recover password
 */
function recoverPassword() {
  const email = document.getElementById('recoveryEmail').value.trim();
  
  if (!email) {
    Swal.fire({
      icon: 'warning',
      title: 'Barua Pepe Inakosekana',
      text: 'Tafadhali weka barua pepe yako',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Notiflix.Loading.standard('Inatafuta akaunti yako...');
  
  recoverPassword(email)
    .then(data => {
      Notiflix.Loading.remove();
      
      if (data.status === 'success') {
        Swal.fire({
          icon: 'success',
          title: '✅ Nenosiri Limetumwa!',
          html: `
            <div style="text-align: center;">
              <p>${data.message}</p>
              <p style="font-size: 14px; color: #666; margin-top: 10px;">
                Tafadhali angalia inbox ya barua pepe yako: <strong>${email}</strong>
              </p>
              <p style="font-size: 12px; color: #ff9800; margin-top: 10px;">
                <i class="fas fa-envelope"></i> Kama haujaipokea, angalia folder ya spam/junk
              </p>
            </div>
          `,
          confirmButtonColor: '#4361ee',
          confirmButtonText: 'Sawa'
        }).then(() => {
          showLogin();
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: '❌ Imeshindikana',
          text: data.message,
          confirmButtonColor: '#4361ee'
        });
      }
    })
    .catch(error => {
      Notiflix.Loading.remove();
      Swal.fire({
        icon: 'error',
        title: '❌ Hitilafu ya Mtandao',
        text: 'Imeshindikana kuwasiliana na server',
        confirmButtonColor: '#4361ee'
      });
    });
}

/**
 * Show register page
 */
function showRegister() {
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('forgotPasswordModal').classList.add('hidden');
  document.getElementById('register').classList.remove('hidden');
  
  // Clear form
  document.getElementById('schoolName').value = '';
  document.getElementById('regEmail').value = '';
  document.getElementById('regPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('acceptTerms').checked = false;
  document.getElementById('registerBtn').disabled = true;
  
  // Reset password strength
  const strengthFill = document.getElementById('regPasswordStrengthFill');
  const strengthText = document.getElementById('regPasswordStrengthText');
  if (strengthFill) {
    strengthFill.style.width = '0%';
    strengthFill.className = 'password-strength-fill';
  }
  if (strengthText) {
    strengthText.textContent = '';
    strengthText.className = 'password-strength-text';
  }
}

/**
 * Show login page
 */
function showLogin() {
  document.getElementById('register').classList.add('hidden');
  document.getElementById('forgotPasswordModal').classList.add('hidden');
  document.getElementById('auth').classList.remove('hidden');
  
  // Clear login form
  document.getElementById('email').value = '';
  document.getElementById('password').value = '';
}

/**
 * Show forgot password page
 */
function showForgotPassword() {
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('register').classList.add('hidden');
  document.getElementById('forgotPasswordModal').classList.remove('hidden');
  document.getElementById('recoveryEmail').value = '';
}

/**
 * Logout user
 */
function logout() {
  Swal.fire({
    title: 'Toka',
    text: 'Una uhakika unataka kutoka kwenye mfumo?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#4361ee',
    cancelButtonColor: '#f72585',
    confirmButtonText: 'Ndio, Toka',
    cancelButtonText: 'Hapana',
    reverseButtons: true
  }).then(result => {
    if (result.isConfirmed) {
      // Clear all data
      clearAllCaches();
      localStorage.removeItem('dbId');
      localStorage.removeItem('schoolName');
      localStorage.removeItem('userType');
      localStorage.removeItem('staffName');
      localStorage.removeItem('isDeveloper');
      localStorage.removeItem('currentDashboard');
      localStorage.removeItem('currentUserEmail');
      
      currentDbId = null;
      currentSchoolName = '';
      currentUserEmail = '';
      isDeveloper = false;
      
      // Hide all dashboards
      document.querySelectorAll('.container').forEach(container => {
        container.classList.add('hidden');
      });
      document.getElementById('auth').classList.remove('hidden');
      document.getElementById('sidebar').classList.add('hidden');
      document.getElementById('mainContent').classList.remove('shifted');
      
      // Clear forms
      document.getElementById('email').value = '';
      document.getElementById('password').value = '';
      
      Swal.fire({
        icon: 'success',
        title: 'Umetoka',
        text: 'Umefanikiwa kutoka kwenye mfumo',
        confirmButtonColor: '#4361ee',
        timer: 2000
      });
    }
  });
}

/**
 * Toggle password visibility
 * @param {string} inputId - Input field ID
 * @param {HTMLElement} button - Toggle button
 */
function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);
  const icon = button.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  }
}

/**
 * Check registration password strength
 */
function checkRegistrationPasswordStrength() {
  const password = document.getElementById('regPassword').value;
  const strengthFill = document.getElementById('regPasswordStrengthFill');
  const strengthText = document.getElementById('regPasswordStrengthText');
  
  if (!strengthFill || !strengthText) return;
  
  if (password.length === 0) {
    strengthFill.style.width = '0%';
    strengthFill.className = 'password-strength-fill';
    strengthText.textContent = '';
    strengthText.className = 'password-strength-text';
    return;
  }
  
  const result = checkPasswordStrength(password);
  
  let width = '0%';
  let colorClass = '';
  let message = '';
  
  if (result.strength === 'very-strong') {
    width = '100%';
    colorClass = 'strong';
    message = 'Imara Sana - Nenosiri lina nguvu ya kutosha';
  } else if (result.strength === 'strong') {
    width = '100%';
    colorClass = 'strong';
    message = 'Nzuri - Nenosiri lina nguvu';
  } else if (result.strength === 'good') {
    width = '75%';
    colorClass = 'good';
    message = 'Wastani - Bado unaweza kuongeza nguvu';
  } else if (result.strength === 'fair') {
    width = '50%';
    colorClass = 'fair';
    message = 'Dhaifu - Ongeza herufi kubwa, ndogo au namba';
  } else {
    width = '25%';
    colorClass = 'weak';
    message = 'Dhaifu sana - Ongeza herufi kubwa, ndogo na namba';
  }
  
  strengthFill.style.width = width;
  strengthFill.className = `password-strength-fill ${colorClass}`;
  strengthText.textContent = message;
  strengthText.className = `password-strength-text ${colorClass}`;
}

/**
 * Validate terms and enable register button
 */
function validateTermsAndEnableButton() {
  const termsCheckbox = document.getElementById('acceptTerms');
  const registerBtn = document.getElementById('registerBtn');
  
  if (termsCheckbox && registerBtn) {
    registerBtn.disabled = !termsCheckbox.checked;
  }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  const regPassword = document.getElementById('regPassword');
  if (regPassword) {
    regPassword.addEventListener('input', checkRegistrationPasswordStrength);
  }
  
  const termsCheckbox = document.getElementById('acceptTerms');
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', validateTermsAndEnableButton);
  }
  
  const confirmPassword = document.getElementById('confirmPassword');
  if (confirmPassword) {
    confirmPassword.addEventListener('input', validateTermsAndEnableButton);
  }
});
