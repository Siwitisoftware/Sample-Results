// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // API endpoint - replace with your deployed Apps Script URL
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyMdr36PURMEjqZjnZT5Bn_gbQAMi47Z_BWuFRm7IIEmRZdO7N5x4jd13ObayEQ4_8H/exec',
  
  // Developer credentials
  DEVELOPER_EMAIL: 'daxsystems.tz@gmail.com',
  DEVELOPER_KEY: 'developer123',
  
  // Default grade settings
  DEFAULT_GRADES: {
    A: 80,
    B: 65,
    C: 50,
    D: 35,
    E: 0
  },
  
  // Default subject grade settings (out of 50)
  DEFAULT_SUBJECT_GRADES: {
    system: 'out_of_50',
    a_min: 41,
    b_min: 31,
    c_min: 21,
    d_min: 11,
    e_min: 0
  },
  
  // All classes
  CLASSES: [
    'Awali',
    'Darasa la Kwanza',
    'Darasa la Pili',
    'Darasa la Tatu',
    'Darasa la Nne',
    'Darasa la Tano',
    'Darasa la Sita',
    'Darasa la Saba'
  ],
  
  // Cache keys
  CACHE_KEYS: {
    STUDENTS: 'studentCache',
    SUBJECTS: 'subjectCache',
    RESULTS: 'resultsCache',
    REPORTS: 'reportCache',
    TERMS: 'termCache',
    STAFF: 'staffCache',
    GRADE_SETTINGS: 'gradeSettingsCache',
    SUBJECT_GRADE_SETTINGS: 'subjectGradeCache',
    SYSTEM_SETTINGS: 'systemSettingsCache',
    EXIT_SHEETS: 'exitSheetsCache',
    SELECTED_SUBJECTS: 'selectedSubjects',
    OFFLINE_QUEUE: 'offlineQueue',
    SUBSCRIPTION: 'subscriptionStatus',
    TRIAL_END: 'trialEndTime',
    USER_DATA: 'userData'
  },
  
  // Auto-save settings
  AUTO_SAVE_DELAY: 100,
  
  // Sync settings
  SYNC_INTERVAL: 300000, // 5 minutes
  RETRY_INTERVAL: 300000, // 5 minutes
  
  // Subscription
  TRIAL_DURATION_MINUTES: 30,
  
  // File settings
  FILE_DELETION_DELAY: 86400000, // 24 hours
  
  // Payment info
  PAYMENT: {
    monthly: 'TZS 2,500',
    yearly: 'TZS 30,000',
    mpesa: '+255750183275',
    mix: '+255652343371',
    email: 'daxsystems.tz@gmail.com',
    whatsappLinks: [
      'https://wa.me/255750183275',
      'https://wa.me/255652343371'
    ]
  }
};
