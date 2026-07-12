// ============================================
// UTILITIES
// ============================================

/**
 * Check if the browser is online
 * @returns {boolean} True if online
 */
function isOnline() {
  return navigator.onLine;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Decode HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Safe encode a name for URL
 * @param {string} name - Name to encode
 * @returns {string} Encoded name
 */
function safeEncodeName(name) {
  if (!name) return '';
  try {
    let encoded = encodeURIComponent(name);
    encoded = encoded.replace(/'/g, "%27");
    return encoded;
  } catch (error) {
    return name.replace(/'/g, '%27');
  }
}

/**
 * Safe decode a name from URL
 * @param {string} encodedName - Encoded name
 * @returns {string} Decoded name
 */
function safeDecodeName(encodedName) {
  if (!encodedName) return '';
  try {
    let decoded = encodedName;
    decoded = decoded.replace(/\+/g, ' ');
    decoded = decodeURIComponent(decoded);
    decoded = decoded.replace(/%27/g, "'");
    decoded = decoded.replace(/'/g, "'");
    decoded = decoded.replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
    return decoded;
  } catch (error) {
    return encodedName;
  }
}

/**
 * Convert ArrayBuffer to Base64
 * @param {ArrayBuffer} buffer - ArrayBuffer
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {string} locale - Locale (default: 'sw-TZ')
 * @returns {string} Formatted date
 */
function formatDate(date, locale) {
  locale = locale || 'sw-TZ';
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return '-';
  }
}

/**
 * Format a date for input (datetime-local)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDateForInput(date) {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    return '';
  }
}

/**
 * Get month name in Swahili
 * @param {number} monthIndex - Month index (1-12)
 * @returns {string} Month name
 */
function getMonthName(monthIndex) {
  const months = {
    '01': 'Januari', '02': 'Februari', '03': 'Machi',
    '04': 'Aprili', '05': 'Mei', '06': 'Juni',
    '07': 'Julai', '08': 'Agosti', '09': 'Septemba',
    '10': 'Oktoba', '11': 'Novemba', '12': 'Desemba'
  };
  return months[monthIndex] || 'Hakuna';
}

/**
 * Generate a unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix) {
  prefix = prefix || 'ID';
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(fn, limit) {
  let inThrottle = false;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge objects deeply
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = deepClone(target);
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

/**
 * Check if a value is a valid number
 * @param {*} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} { valid: boolean, value: number|null }
 */
function validateNumber(value, min, max) {
  min = min || 0;
  max = max || 100;
  
  if (value === null || value === undefined || value === '') {
    return { valid: true, value: null };
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return { valid: false, value: null, message: 'Thamani si namba' };
  }
  
  if (num < min || num > max) {
    return { valid: false, value: null, message: `Thamani lazima iwe kati ya ${min} na ${max}` };
  }
  
  return { valid: true, value: num };
}

/**
 * Check password strength
 * @param {string} password - Password to check
 * @returns {Object} { valid: boolean, message: string, strength: string }
 */
function checkPasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (password.length < minLength) {
    return { valid: false, message: 'Nenosiri lazima liwe na angalau herufi 8', strength: 'weak' };
  }
  if (!hasUpperCase) {
    return { valid: false, message: 'Nenosiri lazima liwe na angalau herufi kubwa moja (A-Z)', strength: 'weak' };
  }
  if (!hasLowerCase) {
    return { valid: false, message: 'Nenosiri lazima liwe na angalau herufi ndogo moja (a-z)', strength: 'weak' };
  }
  if (!hasNumbers) {
    return { valid: false, message: 'Nenosiri lazima liwe na angalau namba moja (0-9)', strength: 'weak' };
  }
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (hasUpperCase) score++;
  if (hasLowerCase) score++;
  if (hasNumbers) score++;
  if (hasSpecial) score++;
  
  let strength = 'weak';
  if (score >= 6) strength = 'very-strong';
  else if (score >= 5) strength = 'strong';
  else if (score >= 4) strength = 'good';
  else if (score >= 3) strength = 'fair';
  
  return { valid: true, message: 'Nenosiri lina nguvu: ' + strength, strength: strength };
}

/**
 * Validate staff password (minimal)
 * @param {string} password - Password to check
 * @returns {Object} { valid: boolean, message: string }
 */
function validateStaffPassword(password) {
  if (password.length < 6) {
    return { valid: false, message: 'Nenosiri lazima liwe na angalau herufi 6' };
  }
  if (!/[a-zA-Z]/.test(password) && !/[0-9]/.test(password)) {
    return { valid: false, message: 'Nenosiri lazima liwe na herufi au namba' };
  }
  return { valid: true, message: 'Nenosiri lina nguvu' };
}

/**
 * Sort students alphabetically (boys first, then girls)
 * @param {Array} students - Array of student objects
 * @returns {Array} Sorted students
 */
function sortStudentsAlphabetically(students) {
  if (!students || students.length === 0) return [];
  
  const boys = students.filter(student => student.jinsi === 'M');
  const girls = students.filter(student => student.jinsi === 'F');
  
  boys.sort((a, b) => {
    const nameA = (a.jina || a.name || '').toLowerCase();
    const nameB = (b.jina || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'sw', { sensitivity: 'base' });
  });
  
  girls.sort((a, b) => {
    const nameA = (a.jina || a.name || '').toLowerCase();
    const nameB = (b.jina || b.name || '').toLowerCase();
    return nameA.localeCompare(nameB, 'sw', { sensitivity: 'base' });
  });
  
  return [...boys, ...girls];
}

/**
 * Get student gender from cache
 * @param {string} studentName - Student name
 * @param {string} darasa - Class name
 * @returns {string} Gender (M/F)
 */
function getStudentGender(studentName, darasa) {
  const studentCache = JSON.parse(localStorage.getItem(CONFIG.CACHE_KEYS.STUDENTS) || '{}');
  const student = studentCache[darasa]?.find(s => s.jina === studentName);
  return student?.jinsi === 'F' ? 'F' : 'M';
}

/**
 * Format exit sheet name for display
 * @param {string} sheetName - Exit sheet name
 * @returns {string} Formatted name
 */
function formatExitSheetName(sheetName) {
  const parts = sheetName.split('_');
  if (parts.length >= 4) {
    const year = parts[2] || 'Unknown';
    const month = parts[3] || 'Unknown';
    return `Darasa la Saba (${year} ${month})`;
  }
  return sheetName;
}

/**
 * Get grade color
 * @param {string} grade - Grade letter
 * @returns {string} Color code
 */
function getGradeColor(grade) {
  switch(grade) {
    case 'A': return '#1b5e20';
    case 'B': return '#4caf50';
    case 'C': return '#ffeb3b';
    case 'D': return '#ff9800';
    case 'E': return '#f44336';
    default: return '#000000';
  }
}

/**
 * Truncate a string
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Check if a string is empty
 * @param {string} str - String to check
 * @returns {boolean} True if empty
 */
function isEmptyString(str) {
  return !str || str.trim() === '';
}

/**
 * Sanitize a string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (!str) return '';
  return String(str).trim().replace(/\s+/g, ' ');
}

/**
 * Convert to boolean safely
 * @param {*} value - Value to convert
 * @returns {boolean} Boolean value
 */
function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}