// ============================================
// APPLICATION INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
function initApp() {
  console.log('🚀 Initializing application...');
  
  // Check if user is already logged in
  const savedDbId = localStorage.getItem('dbId');
  const savedEmail = localStorage.getItem('currentUserEmail');
  
  if (savedDbId && savedEmail) {
    currentDbId = savedDbId;
    currentSchoolName = localStorage.getItem('schoolName');
    currentUserEmail = savedEmail;
    
    if (localStorage.getItem('isDeveloper') === 'true') {
      isDeveloper = true;
      showDeveloperDashboard();
    } else {
      const savedDashboard = localStorage.getItem('currentDashboard') || 'student';
      showDashboard(savedDashboard);
      
      // Initialize timer system
      setTimeout(() => {
        initTimerSystem();
        initOfflineSystem();
      }, 1000);
    }
  } else {
    // Show login page
    document.getElementById('auth').classList.remove('hidden');
    document.getElementById('sidebar').classList.add('hidden');
    
    // Initialize slideshow
    setTimeout(() => initSlideshow(), 100);
  }
  
  // Setup sidebar overlay for mobile
  setupSidebarOverlay();
  
  // Fix mobile layout
  fixMobileLayout();
  
  // Add event listeners
  setupEventListeners();
  
  // Initialize Notiflix
  Notiflix.Loading.init({
    backgroundColor: 'rgba(0,0,0,0.6)',
    messageColor: '#fff',
    messageFontSize: '16px'
  });
  
  Notiflix.Notify.init({
    width: '300px',
    position: 'right-top',
    distance: '10px',
    timeout: 3000
  });
  
  console.log('✅ Application initialized successfully');
}

/**
 * Setup sidebar overlay for mobile
 */
function setupSidebarOverlay() {
  let overlay = document.querySelector('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
  }
  
  overlay.addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    
    if (sidebar && sidebar.classList.contains('active')) {
      sidebar.classList.remove('active');
      mainContent.classList.remove('shifted');
      overlay.classList.remove('active');
      document.body.classList.remove('sidebar-open');
    }
  });
  
  // Monitor sidebar state
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && sidebar.classList.contains('active')) {
          overlay.classList.add('active');
          document.body.classList.add('sidebar-open');
        } else {
          overlay.classList.remove('active');
          document.body.classList.remove('sidebar-open');
        }
      }
    });
  });
  
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    observer.observe(sidebar, { attributes: true });
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Handle window resize
  window.addEventListener('resize', fixMobileLayout);
  window.addEventListener('orientationchange', function() {
    setTimeout(fixMobileLayout, 300);
  });
  
  // Handle visibility change for background sync
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isOnline()) {
      setTimeout(() => checkSubscriptionStatus(false), 2000);
    }
  });
  
  // Handle online/offline events
  window.addEventListener('online', function() {
    console.log('📶 Back online');
    setTimeout(() => {
      syncOfflineQueue();
      checkSubscriptionStatus(false);
    }, 3000);
  });
  
  window.addEventListener('offline', function() {
    console.log('📴 Offline');
    showOfflineNotice(true);
  });
  
  // Add event listener for term selection change in report dashboard
  const termReportSelect = document.getElementById('termReport');
  if (termReportSelect) {
    termReportSelect.addEventListener('change', function() {
      setTimeout(() => displayStudentSelectionCheckboxes(), 100);
    });
  }
  
  const darasaReportSelect = document.getElementById('darasaReport');
  if (darasaReportSelect) {
    darasaReportSelect.addEventListener('change', function() {
      setTimeout(() => displayStudentSelectionCheckboxes(), 100);
    });
  }
  
  // Grade settings listeners
  addGradeSettingsListeners();
}

/**
 * Fix mobile layout
 */
function fixMobileLayout() {
  const developerActions = document.querySelectorAll('.developer-actions');
  
  developerActions.forEach(actions => {
    if (window.innerWidth <= 768) {
      actions.style.flexDirection = 'column';
      actions.style.gap = '5px';
      actions.querySelectorAll('.btn-action').forEach(button => {
        button.style.width = '100%';
        button.style.margin = '2px 0';
        button.style.padding = '8px 5px';
        button.style.fontSize = '12px';
      });
    } else {
      actions.style.flexDirection = 'row';
      actions.style.gap = '5px';
      actions.querySelectorAll('.btn-action').forEach(button => {
        button.style.width = 'auto';
        button.style.margin = '0 2px';
        button.style.padding = '6px 12px';
        button.style.fontSize = '14px';
      });
    }
  });
}

/**
 * Add grade settings listeners
 */
function addGradeSettingsListeners() {
  const gradeInputs = ['gradeA', 'gradeB', 'gradeC', 'gradeD', 'gradeE'];
  const subjectGradeInputs = ['subjectGradeA', 'subjectGradeB', 'subjectGradeC', 'subjectGradeD', 'subjectGradeE'];
  
  gradeInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', function() {
        refreshReportWithNewSettings();
      });
    }
  });
  
  subjectGradeInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('change', function() {
        refreshReportWithNewSettings();
      });
    }
  });
  
  const systemSelect = document.getElementById('subjectGradeSystem');
  if (systemSelect) {
    systemSelect.addEventListener('change', function() {
      refreshReportWithNewSettings();
    });
  }
}

/**
 * Initialize slideshow
 */
function initSlideshow() {
  let currentSlideIndex = 0;
  let slideInterval;
  
  function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length) return;
    
    if (index >= slides.length) currentSlideIndex = 0;
    if (index < 0) currentSlideIndex = slides.length - 1;
    
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[currentSlideIndex].classList.add('active');
    if (dots[currentSlideIndex]) {
      dots[currentSlideIndex].classList.add('active');
    }
  }
  
  function nextSlide() {
    currentSlideIndex++;
    showSlide(currentSlideIndex);
    resetAutoSlide();
  }
  
  function prevSlide() {
    currentSlideIndex--;
    showSlide(currentSlideIndex);
    resetAutoSlide();
  }
  
  function currentSlide(index) {
    currentSlideIndex = index;
    showSlide(currentSlideIndex);
    resetAutoSlide();
  }
  
  function startAutoSlide() {
    if (slideInterval) clearInterval(slideInterval);
    slideInterval = setInterval(() => {
      currentSlideIndex++;
      showSlide(currentSlideIndex);
    }, 6000);
  }
  
  function resetAutoSlide() {
    if (slideInterval) {
      clearInterval(slideInterval);
      startAutoSlide();
    }
  }
  
  // Expose functions globally for inline onclick
  window.nextSlide = nextSlide;
  window.prevSlide = prevSlide;
  window.currentSlide = currentSlide;
  
  const slides = document.querySelectorAll('.slide');
  if (slides.length > 0) {
    currentSlideIndex = 0;
    showSlide(0);
    startAutoSlide();
  }
}

/**
 * Initialize staff cache on load
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize caches
  if (!localStorage.getItem(CONFIG.CACHE_KEYS.STAFF)) {
    localStorage.setItem(CONFIG.CACHE_KEYS.STAFF, JSON.stringify([]));
  }
  if (!localStorage.getItem(CONFIG.CACHE_KEYS.SYSTEM_SETTINGS)) {
    localStorage.setItem(CONFIG.CACHE_KEYS.SYSTEM_SETTINGS, JSON.stringify({}));
  }
  if (!localStorage.getItem(CONFIG.CACHE_KEYS.SUBSCRIPTION)) {
    localStorage.setItem(CONFIG.CACHE_KEYS.SUBSCRIPTION, JSON.stringify(null));
  }
  if (!localStorage.getItem(CONFIG.CACHE_KEYS.OFFLINE_QUEUE)) {
    localStorage.setItem(CONFIG.CACHE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
  }
  
  // Initialize app
  initApp();
  
  // Setup logout for all
  setupLogoutForAll();
});

/**
 * Setup logout for all
 */
function setupLogoutForAll() {
  // Sidebar logout
  const logoutBtn = document.querySelector('.logout-link');
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }
  
  // Developer dashboard logout
  const devLogoutBtn = document.querySelector('#developerDashboard .btn-danger');
  if (devLogoutBtn) {
    devLogoutBtn.onclick = logout;
  }
}

// ============================================
// SLIDESHOW FUNCTIONS (Global for inline onclick)
// ============================================

// These are defined inside initSlideshow and exposed to window
// But we also need them globally for the inline onclick in HTML

/**
 * Navigate to next slide
 */
function nextSlide() {
  // Will be overridden by initSlideshow
}

/**
 * Navigate to previous slide
 */
function prevSlide() {
  // Will be overridden by initSlideshow
}

/**
 * Go to specific slide
 * @param {number} index - Slide index
 */
function currentSlide(index) {
  // Will be overridden by initSlideshow
}

// ============================================
// PASSWORD STRENGTH FUNCTIONS (Global)
// ============================================

// These are already defined in auth.js and staff.js
// They are exposed globally for inline onclick

// ============================================
// TOGGLE PASSWORD FUNCTIONS (Global)
// ============================================

// These are already defined in auth.js
// They are exposed globally for inline onclick

// ============================================
// UTILITY FUNCTIONS (Global)
// ============================================

// These are already defined in utils.js
// They are exposed globally for inline onclick

// ============================================
// INITIALIZE APP
// ============================================

// App initialization is handled by DOMContentLoaded event above