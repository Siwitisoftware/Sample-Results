// ============================================
// SUBSCRIPTION MANAGEMENT
// ============================================

let subscriptionStatus = null;
let trialEndTime = null;
let secondsCountdownInterval = null;

/**
 * Initialize timer system
 */
function initTimerSystem() {
  const userEmail = localStorage.getItem('currentUserEmail');
  if (!userEmail) {
    console.log('initTimerSystem: No user email');
    return;
  }
  
  console.log('⏰ Initializing timer system for:', userEmail);
  
  // Load cached data first
  subscriptionStatus = getCachedSubscription();
  trialEndTime = getCachedTrialEndTime();
  
  // Show timer immediately
  const sidebarTimer = document.getElementById('sidebarTimer');
  if (sidebarTimer && subscriptionStatus) {
    sidebarTimer.classList.remove('hidden');
  }
  
  // Start countdown with cached data
  if (trialEndTime) {
    startSecondsCountdown();
  }
  
  // Check for updates from server
  if (isOnline()) {
    setTimeout(() => checkSubscriptionStatus(false), 2000);
    startBackgroundSync();
  } else {
    console.log('Offline - using cached timer data');
    updateTimerDisplay();
  }
  
  // Check staff access
  const userType = localStorage.getItem('userType');
  if (userType === 'staff') {
    setTimeout(() => checkStaffReportAccess(), 1000);
  }
}

/**
 * Start background sync
 */
function startBackgroundSync() {
  if (window.backgroundSyncInterval) {
    clearInterval(window.backgroundSyncInterval);
  }
  
  window.backgroundSyncInterval = setInterval(() => {
    if (isOnline() && localStorage.getItem('currentUserEmail')) {
      console.log('⏰ Background sync running...');
      checkSubscriptionStatus(false);
    }
  }, CONFIG.SYNC_INTERVAL);
}

/**
 * Check subscription status
 * @param {boolean} showLoading - Show loading indicator
 */
function checkSubscriptionStatus(showLoading = false) {
  const userEmail = localStorage.getItem('currentUserEmail');
  if (!userEmail) {
    console.log('checkSubscriptionStatus: No user email found');
    return;
  }
  
  if (showLoading) {
    Notiflix.Loading.standard('Checking subscription status...');
  }
  
  getUserSubscriptionStatus(userEmail)
    .then(data => {
      if (showLoading) Notiflix.Loading.remove();
      
      if (data.status === 'success') {
        const shouldUpdate = !subscriptionStatus || 
                            subscriptionStatus.status !== data.subscription.status ||
                            subscriptionStatus.timeRemaining !== data.subscription.timeRemaining ||
                            subscriptionStatus.isPremium !== data.subscription.isPremium;
        
        if (shouldUpdate) {
          subscriptionStatus = data.subscription;
          
          if (subscriptionStatus.trialEndDate) {
            trialEndTime = new Date(subscriptionStatus.trialEndDate);
            setCachedTrialEndTime(trialEndTime);
          }
          
          setCachedSubscription(subscriptionStatus);
          
          const sidebarTimer = document.getElementById('sidebarTimer');
          if (sidebarTimer) {
            sidebarTimer.classList.remove('hidden');
          }
          
          updateTimerDisplay();
          
          if (secondsCountdownInterval) {
            clearInterval(secondsCountdownInterval);
          }
          startSecondsCountdown();
          
          // Check if expired
          if (subscriptionStatus.status === 'expired' && !subscriptionStatus.isPremium) {
            console.log('⚠️ Subscription expired - disabling features');
            setTimeout(() => {
              disableReportButtonsImmediately();
              const userType = localStorage.getItem('userType');
              if (userType === 'staff') {
                disableStaffReportAccess();
              }
            }, 100);
          }
        }
      } else {
        console.log('❌ Subscription check failed:', data.message);
      }
    })
    .catch(error => {
      if (showLoading) Notiflix.Loading.remove();
      console.log('🌐 Offline mode - using cached data', error);
      useCachedSubscriptionData();
      
      const sidebarTimer = document.getElementById('sidebarTimer');
      if (sidebarTimer) {
        sidebarTimer.classList.remove('hidden');
      }
    });
}

/**
 * Use cached subscription data
 */
function useCachedSubscriptionData() {
  const savedStatus = getCachedSubscription();
  const savedEndTime = getCachedTrialEndTime();
  
  if (savedStatus) {
    subscriptionStatus = savedStatus;
  }
  
  if (savedEndTime) {
    trialEndTime = savedEndTime;
  }
  
  if (subscriptionStatus && trialEndTime) {
    updateTimerDisplay();
    startSecondsCountdown();
    
    const now = new Date();
    if (now > trialEndTime && !subscriptionStatus.isPremium) {
      subscriptionStatus.status = 'expired';
      subscriptionStatus.timeRemaining = 0;
      updateTimerDisplay();
      disableReportButtonsImmediately();
      showPaymentOverlay();
    }
  }
}

/**
 * Start seconds countdown
 */
function startSecondsCountdown() {
  if (secondsCountdownInterval) {
    clearInterval(secondsCountdownInterval);
  }
  
  if (!trialEndTime) {
    console.log('No trial end time set');
    return;
  }
  
  secondsCountdownInterval = setInterval(() => {
    const now = new Date();
    const timeRemaining = trialEndTime - now;
    
    if (timeRemaining <= 0) {
      clearInterval(secondsCountdownInterval);
      
      subscriptionStatus = {
        status: 'expired',
        isPremium: false,
        timeRemaining: 0
      };
      
      setCachedSubscription(subscriptionStatus);
      updateTimerDisplay();
      
      const userType = localStorage.getItem('userType');
      
      if (userType === 'staff') {
        const currentDashboard = localStorage.getItem('currentDashboard');
        const reportDashboard = document.getElementById('reportDashboard');
        
        if (currentDashboard === 'report' || 
            (reportDashboard && !reportDashboard.classList.contains('hidden'))) {
          Notiflix.Notify.failure('ACCESS TERMINATED: Trial/subscription period has ended', {
            timeout: 5000,
            position: 'right-top'
          });
          
          setTimeout(() => showDashboard('student'), 100);
        }
        
        disableStaffReportMenu();
        
        setTimeout(() => {
          Swal.fire({
            icon: 'error',
            title: 'REPORT ACCESS LOCKED',
            html: `
              <div style="text-align: center;">
                <p style="color: #f44336; font-weight: bold; font-size: 18px;">
                  <i class="fas fa-ban"></i> ACCESS TERMINATED
                </p>
                <p style="font-size: 14px; color: #666; margin-top: 15px;">
                  Trial/subscription period has ended. All report features are now completely disabled.
                </p>
                <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 13px; color: #c62828;">
                    <i class="fas fa-lock"></i> Report Dashboard: <strong>PERMANENTLY LOCKED</strong><br>
                    <i class="fas fa-lock"></i> Generate Reports: <strong>DISABLED</strong><br>
                    <i class="fas fa-lock"></i> PDF Export: <strong>BLOCKED</strong>
                  </p>
                </div>
                <p style="font-size: 12px; color: #999;">
                  Please contact the school owner to renew subscription
                </p>
              </div>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#4361ee',
            allowOutsideClick: false
          });
        }, 500);
      } else {
        setTimeout(() => showPaymentOverlay(), 100);
      }
      
      localStorage.setItem('trialEndTime', now.toISOString());
      return;
    }
    
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    if (subscriptionStatus) {
      subscriptionStatus.timeRemaining = Math.floor(timeRemaining / (1000 * 60));
      subscriptionStatus.status = 'active';
    }
    
    updateSidebarTimerDisplay(daysRemaining, hoursRemaining, minutesRemaining, secondsRemaining);
    
    const currentTime = Date.now();
    const lastSave = localStorage.getItem('lastCountdownSave') || 0;
    if (currentTime - lastSave > 30000) {
      localStorage.setItem('lastCountdownSave', currentTime.toString());
      setCachedSubscription(subscriptionStatus);
    }
    
  }, 1000);
}

/**
 * Update sidebar timer display
 * @param {number} days - Days remaining
 * @param {number} hours - Hours remaining
 * @param {number} minutes - Minutes remaining
 * @param {number} seconds - Seconds remaining
 */
function updateSidebarTimerDisplay(days, hours, minutes, seconds) {
  const sidebarTimer = document.getElementById('sidebarTimer');
  if (!sidebarTimer) return;
  
  const daysEl = document.getElementById('sidebarDays');
  const hoursEl = document.getElementById('sidebarHours');
  const minutesEl = document.getElementById('sidebarMinutes');
  const secondsEl = document.getElementById('sidebarSeconds');
  
  if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
  if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
  if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
  if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');
  
  const statusElement = document.getElementById('sidebarTimerStatus');
  if (statusElement) {
    let statusText = '';
    let statusIcon = '';
    
    if (days > 0) {
      statusText = `${days} ${days === 1 ? 'day' : 'days'} left`;
      statusIcon = '<i class="fas fa-calendar"></i>';
      sidebarTimer.classList.remove('warning');
    } else if (hours > 0) {
      statusText = `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
      statusIcon = '<i class="fas fa-clock"></i>';
      sidebarTimer.classList.remove('warning');
    } else if (minutes > 5) {
      statusText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
      statusIcon = '<i class="fas fa-hourglass-half"></i>';
      sidebarTimer.classList.remove('warning');
    } else if (minutes > 0) {
      statusText = `${minutes} min ${seconds} sec left`;
      statusIcon = '<i class="fas fa-exclamation-triangle"></i>';
      sidebarTimer.classList.add('warning');
    } else {
      statusText = `${seconds} ${seconds === 1 ? 'second' : 'seconds'} left`;
      statusIcon = '<i class="fas fa-exclamation-circle"></i>';
      sidebarTimer.classList.add('warning');
    }
    
    statusElement.innerHTML = `${statusIcon}<span>${statusText}</span>`;
  }
  
  // Visual effects for low time
  if (minutes === 0 && seconds <= 30) {
    if (secondsEl) {
      if (seconds % 2 === 0) {
        secondsEl.style.color = '#f44336';
        secondsEl.style.fontWeight = 'bold';
        secondsEl.style.transform = 'scale(1.1)';
      } else {
        secondsEl.style.color = '#ffffff';
        secondsEl.style.transform = 'scale(1)';
      }
    }
    sidebarTimer.style.animation = 'pulseExpired 0.5s infinite';
  } else if (minutes < 5) {
    sidebarTimer.classList.add('warning');
    sidebarTimer.style.animation = 'pulseWarning 1s infinite';
  } else {
    sidebarTimer.classList.remove('warning');
    sidebarTimer.style.animation = 'none';
    if (secondsEl) {
      secondsEl.style.color = '#ffffff';
      secondsEl.style.fontWeight = 'normal';
      secondsEl.style.transform = 'scale(1)';
    }
  }
}

/**
 * Update timer display (legacy)
 */
function updateTimerDisplay() {
  const sidebarTimer = document.getElementById('sidebarTimer');
  if (!sidebarTimer || !subscriptionStatus) return;
  
  if (subscriptionStatus.isPremium) {
    sidebarTimer.innerHTML = `
      <div class="timer-header">
        <i class="fas fa-crown"></i>
        <span>Premium User</span>
      </div>
      <div class="timer-display">
        <div class="time-segment"><span>∞</span><small>Siku</small></div>
        <div class="time-segment"><span>∞</span><small>Masaa</small></div>
        <div class="time-segment"><span>∞</span><small>Dakika</small></div>
        <div class="time-segment"><span>∞</span><small>Sekunde</small></div>
      </div>
      <div class="timer-status premium">
        <i class="fas fa-check-circle"></i>
        <span>Premium Active</span>
      </div>
    `;
    sidebarTimer.classList.remove('warning', 'expired');
  } else if (subscriptionStatus.status === 'expired') {
    sidebarTimer.innerHTML = `
      <div class="timer-header">
        <i class="fas fa-clock"></i>
        <span>Muda Umeisha</span>
      </div>
      <div class="timer-display">
        <div class="time-segment"><span>00</span><small>Siku</small></div>
        <div class="time-segment"><span>00</span><small>Masaa</small></div>
        <div class="time-segment"><span>00</span><small>Dakika</small></div>
        <div class="time-segment"><span>00</span><small>Sekunde</small></div>
      </div>
      <div class="timer-status expired">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Umefika Mwisho</span>
      </div>
    `;
    sidebarTimer.classList.add('expired');
  } else if (trialEndTime) {
    // Will be updated by the countdown interval
  }
}

/**
 * Disable report buttons immediately
 */
function disableReportButtonsImmediately() {
  const reportDashboard = document.getElementById('reportDashboard');
  if (reportDashboard && !reportDashboard.classList.contains('hidden')) {
    const buttons = reportDashboard.querySelectorAll('button');
    buttons.forEach(button => {
      if (button.disabled) return;
      
      button.style.transition = 'none';
      button.style.opacity = '0.4';
      button.style.cursor = 'not-allowed';
      button.style.pointerEvents = 'none';
      button.disabled = true;
      button.classList.add('disabled-btn');
      button.style.backgroundColor = '#cccccc';
      button.style.borderColor = '#999999';
      button.style.color = '#666666';
      button.style.textDecoration = 'line-through';
      button.title = 'Trial/subscription period has ended. Please subscribe.';
      
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      newButton.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        showPaymentOverlay();
        return false;
      };
    });
    
    const inputs = reportDashboard.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.disabled = true;
      input.style.backgroundColor = '#f5f5f5';
      input.style.cursor = 'not-allowed';
      input.style.opacity = '0.6';
    });
    
    const links = reportDashboard.querySelectorAll('a');
    links.forEach(link => {
      link.style.pointerEvents = 'none';
      link.style.color = '#999999';
      link.style.cursor = 'not-allowed';
    });
    
    showDashboardWarningImmediately();
  }
  
  const userType = localStorage.getItem('userType');
  if (userType === 'staff') {
    disableStaffReportAccess();
  }
}

/**
 * Show dashboard warning immediately
 */
function showDashboardWarningImmediately() {
  const reportDashboard = document.getElementById('reportDashboard');
  if (!reportDashboard) return;
  
  const existingWarning = document.getElementById('trialExpiredWarning');
  if (existingWarning) existingWarning.remove();
  
  const warningHTML = `
    <div id="trialExpiredWarning" style="
      background: linear-gradient(135deg, #f72585, #d11467);
      color: white;
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(247, 37, 133, 0.3);
      border: 2px solid #ff1744;
      animation: pulseWarning 0.5s infinite;
    ">
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap;">
        <div style="font-size: 24px;">⚠️</div>
        <div style="flex: 1; min-width: 200px;">
          <div style="font-size: 16px;">SUBSCRIPTION PERIOD HAS ENDED</div>
          <div style="font-size: 14px; font-weight: normal; opacity: 0.9; margin-top: 5px;">
            Subscribe to continue using Report features
          </div>
        </div>
        <button onclick="showPaymentOverlay()" style="
          background: white;
          color: #f72585;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        ">
          💰 Subscribe Now
        </button>
      </div>
    </div>
  `;
  
  const formContainer = reportDashboard.querySelector('.form-container');
  if (formContainer) {
    formContainer.insertAdjacentHTML('afterbegin', warningHTML);
  } else {
    reportDashboard.insertAdjacentHTML('afterbegin', warningHTML);
  }
  
  if (!document.querySelector('#pulseWarningStyle')) {
    const style = document.createElement('style');
    style.id = 'pulseWarningStyle';
    style.textContent = `
      @keyframes pulseWarning {
        0% { box-shadow: 0 4px 15px rgba(247, 37, 133, 0.3); border-color: #ff1744; }
        50% { box-shadow: 0 4px 25px rgba(247, 37, 133, 0.8); border-color: #ff5252; }
        100% { box-shadow: 0 4px 15px rgba(247, 37, 133, 0.3); border-color: #ff1744; }
      }
      @keyframes pulseExpired {
        0% { box-shadow: 0 4px 15px rgba(247, 37, 133, 0.3); }
        50% { box-shadow: 0 4px 25px rgba(247, 37, 133, 0.8); }
        100% { box-shadow: 0 4px 15px rgba(247, 37, 133, 0.3); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Disable staff report access
 */
function disableStaffReportAccess() {
  if (document.getElementById('reportDashboard') && 
      !document.getElementById('reportDashboard').classList.contains('hidden')) {
    
    const buttons = document.querySelectorAll('#reportDashboard button');
    buttons.forEach(button => {
      button.disabled = true;
      button.style.opacity = '0.4';
      button.style.cursor = 'not-allowed';
      button.style.pointerEvents = 'none';
      button.title = 'Access disabled - Trial expired';
    });
    
    const staffMessage = document.getElementById('staffExpiredMessage');
    if (!staffMessage) {
      const messageHTML = `
        <div id="staffExpiredMessage" style="
          background: #ff9800;
          color: white;
          padding: 10px 15px;
          margin: 10px 0;
          border-radius: 5px;
          text-align: center;
          font-size: 14px;
        ">
          ⚠️ Report access is currently unavailable. Please contact the school owner.
        </div>
      `;
      const reportHeader = document.querySelector('#reportDashboard .dashboard-header');
      if (reportHeader) {
        reportHeader.insertAdjacentHTML('afterend', messageHTML);
      }
    }
  }
}

/**
 * Disable staff report menu
 */
function disableStaffReportMenu() {
  const reportMenu = document.getElementById('reportMenu');
  if (!reportMenu) return;
  
  reportMenu.classList.add('menu-locked');
  reportMenu.style.pointerEvents = 'none';
  reportMenu.style.opacity = '0.3';
  reportMenu.style.cursor = 'not-allowed';
  reportMenu.style.color = '#f44336';
  reportMenu.style.textDecoration = 'line-through';
  reportMenu.style.background = 'rgba(244, 67, 54, 0.1)';
  reportMenu.title = 'PERMANENTLY LOCKED - Trial/subscription period has ended';
  
  const newReportMenu = reportMenu.cloneNode(true);
  reportMenu.parentNode.replaceChild(newReportMenu, reportMenu);
  
  newReportMenu.onclick = function(e) {
    e.preventDefault();
    e.stopPropagation();
    Swal.fire({
      icon: 'error',
      title: 'ACCESS PERMANENTLY LOCKED',
      html: `
        <div style="text-align: center;">
          <p style="color: #d32f2f; font-weight: bold; font-size: 16px;">
            <i class="fas fa-ban"></i> REPORT DASHBOARD LOCKED
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 10px;">
            Trial/subscription period has ended. All report features are completely disabled.
          </p>
          <div style="background: #ffebee; padding: 10px; border-radius: 5px; margin: 15px 0;">
            <p style="font-size: 12px; color: #c62828;">
              This menu item is permanently disabled until subscription is renewed.
            </p>
          </div>
        </div>
      `,
      confirmButtonText: 'OK',
      confirmButtonColor: '#4361ee',
      allowOutsideClick: false
    });
    return false;
  };
  
  const reportMenuLi = document.getElementById('reportMenu').closest('li');
  if (reportMenuLi) {
    reportMenuLi.style.pointerEvents = 'none';
    reportMenuLi.style.opacity = '0.5';
  }
}

/**
 * Check staff report access
 */
function checkStaffReportAccess() {
  const userType = localStorage.getItem('userType');
  if (userType !== 'staff') return;
  
  if (subscriptionStatus && subscriptionStatus.status === 'expired' && !subscriptionStatus.isPremium) {
    disableStaffReportMenu();
    
    const currentDashboard = localStorage.getItem('currentDashboard');
    if (currentDashboard === 'report') {
      showDashboard('student');
      
      setTimeout(() => {
        Swal.fire({
          icon: 'error',
          title: 'ACCESS TERMINATED',
          html: `
            <div style="text-align: center;">
              <p style="color: #d32f2f; font-size: 18px; font-weight: bold;">
                ⚠️ REPORT ACCESS LOCKED
              </p>
              <p style="font-size: 14px; color: #666; margin-top: 10px;">
                Trial/subscription period has ended. All report features are now disabled.
              </p>
              <div style="background: #ffebee; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="font-size: 13px; color: #c62828;">
                  <i class="fas fa-ban"></i> Report Dashboard: <strong>LOCKED</strong><br>
                  <i class="fas fa-ban"></i> Generate Reports: <strong>DISABLED</strong><br>
                  <i class="fas fa-ban"></i> PDF Export: <strong>BLOCKED</strong>
                </p>
              </div>
            </div>
          `,
          confirmButtonText: 'OK',
          confirmButtonColor: '#4361ee',
          allowOutsideClick: false
        });
      }, 100);
    }
  }
}

/**
 * Show payment overlay
 */
function showPaymentOverlay() {
  const overlay = document.getElementById('paymentOverlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Hide payment overlay
 */
function hidePaymentOverlay() {
  const overlay = document.getElementById('paymentOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Handle escape key
 * @param {Event} event - Keydown event
 */
function handleEscapeKey(event) {
  if (event.key === 'Escape') {
    hidePaymentOverlay();
  }
}

/**
 * Show subscription modal
 * @param {string} email - User email
 */
function showSubscriptionModal(email) {
  if (Swal.isVisible()) {
    Swal.close();
  }
  
  const modal = document.getElementById('subscriptionModal');
  const emailDisplay = document.getElementById('subscriptionUserEmail');
  
  if (modal && emailDisplay) {
    emailDisplay.textContent = email;
    modal.style.display = 'block';
    modal.style.zIndex = '99999';
  }
}

/**
 * Hide subscription modal
 */
function hideSubscriptionModal() {
  const modal = document.getElementById('subscriptionModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Grant user time
 * @param {string} timeType - Time type (minutes, hours, days, months, years, unlimited)
 * @param {number} value - Time value
 */
function grantUserTime(timeType, value) {
  const email = document.getElementById('subscriptionUserEmail').textContent;
  
  if (!email || email === 'subscriptionUserEmail') {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtumiaji Aliyechaguliwa',
      text: 'Tafadhali chagua mtumiaji kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: 'Inaongeza muda wa matumizi...',
    text: `Inaongeza ${value} ${timeType === 'minutes' ? 'dakika' : timeType === 'hours' ? 'saa' : timeType === 'days' ? 'siku' : timeType === 'months' ? 'miezi' : 'miaka'} kwa ${email}`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '9999999';
      }
    }
  });
  
  updateUserSubscription({
    email: email,
    subscriptionType: timeType,
    value: value
  })
  .then(data => {
    Swal.close();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Muda Umeongezwa!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
            <p>${data.message}</p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              <strong>Mtumiaji:</strong> ${email}<br>
              <strong>Aina:</strong> ${data.subscriptionType}<br>
              <strong>Mwisho:</strong> ${new Date(data.endDate).toLocaleDateString('sw-TZ')}
            </p>
          </div>
        `,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Sawa'
      }).then(() => {
        hideSubscriptionModal();
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
    console.error('Network error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

/**
 * Grant custom time
 */
function grantCustomTime() {
  const email = document.getElementById('subscriptionUserEmail').textContent;
  const customDateInput = document.getElementById('customDateTime');
  
  if (!email || email === 'subscriptionUserEmail') {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Mtumiaji Aliyechaguliwa',
      text: 'Tafadhali chagua mtumiaji kwanza',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  if (!customDateInput || !customDateInput.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Hakuna Tarehe Iliyochaguliwa',
      text: 'Tafadhali chagua tarehe na muda maalum',
      confirmButtonColor: '#4361ee'
    });
    return;
  }
  
  Swal.fire({
    title: 'Inaweka tarehe maalum...',
    text: `Inaweka tarehe ${new Date(customDateInput.value).toLocaleDateString('sw-TZ')} kwa ${email}`,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
      const swalContainer = document.querySelector('.swal2-container');
      if (swalContainer) {
        swalContainer.style.zIndex = '9999999';
      }
    }
  });
  
  updateUserSubscription({
    email: email,
    subscriptionType: 'custom',
    customDate: customDateInput.value
  })
  .then(data => {
    Swal.close();
    
    if (data.status === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'Tarehe Imewekwa!',
        html: `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 15px;">📅</div>
            <p>${data.message}</p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              <strong>Mtumiaji:</strong> ${email}<br>
              <strong>Mwisho:</strong> ${new Date(data.endDate).toLocaleDateString('sw-TZ')}
            </p>
          </div>
        `,
        confirmButtonColor: '#4361ee',
        confirmButtonText: 'Sawa'
      }).then(() => {
        hideSubscriptionModal();
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
    console.error('Network error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Hitilafu ya Mtandao',
      text: 'Imeshindikana kuwasiliana na server',
      confirmButtonColor: '#4361ee'
    });
  });
}

// Setup payment overlay click outside
document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('paymentOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) {
        hidePaymentOverlay();
      }
    });
  }
});