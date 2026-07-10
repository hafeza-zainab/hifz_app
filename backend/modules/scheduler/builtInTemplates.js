/**
 * modules/scheduler/builtInTemplates.js
 *
 * Built-in template hierarchy for Schedule Templates feature.
 * Every resolved template = UNIVERSAL_DEFAULTS + [mainBlock if present].
 */

const UNIVERSAL_DEFAULTS = [
  { name: 'Fajr', startTime: '05:00', endTime: '05:30' },
  { name: 'Breakfast', startTime: '07:00', endTime: '07:30' },
  { name: 'Lunch', startTime: '12:30', endTime: '13:00' },
  { name: 'Zuhr & Asr', startTime: '13:00', endTime: '14:00' },
  { name: 'Maghrib & Isha', startTime: '19:00', endTime: '20:00' },
  { name: 'Dinner', startTime: '20:00', endTime: '20:30' },
  { name: 'Sleep', startTime: '22:00', endTime: '06:00' }  // overnight
];

const SCHOOL_BOARD_TIMINGS = {
  'CBSE': [['08:30','12:30'],['08:00','14:00'],['08:00','14:30'],['08:00','15:00']],
  'CISCE / ICSE': [['08:30','12:30'],['08:00','14:00'],['08:00','14:45'],['08:00','15:00']],
  'Cambridge International (CAIE)': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'Pearson Edexcel': [['08:00','12:30'],['07:45','14:15'],['07:45','15:00'],['07:45','15:30']],
  'International Baccalaureate (IB)': [['08:30','12:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'American Curriculum': [['08:30','12:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'British National Curriculum (UK)': [['08:30','12:30'],['08:30','15:15'],['08:30','15:30'],['08:30','15:30']],
  'French Curriculum': [['08:30','12:00'],['08:30','15:00'],['08:30','15:30'],['08:30','16:00']],
  'German Curriculum': [['07:30','12:00'],['07:45','13:30'],['07:45','14:00'],['07:45','14:30']],
  'Australian Curriculum': [['08:30','12:30'],['08:45','15:00'],['08:45','15:15'],['08:45','15:30']],
  'New Zealand Curriculum': [['08:30','12:30'],['08:45','15:00'],['08:45','15:15'],['08:45','15:30']],
  'Singapore Curriculum (MOE)': [['07:30','11:30'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Malaysian Curriculum (KSSR)': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'UAE Ministry Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Saudi National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Pakistan National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Bangladesh National Curriculum': [['07:30','12:00'],['07:30','13:30'],['07:30','14:00'],['07:30','14:30']],
  'Sri Lankan Curriculum': [['08:00','12:30'],['08:00','13:30'],['08:00','14:00'],['08:00','14:30']],
  'Kenyan Curriculum (CBC)': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'Tanzanian Curriculum': [['08:00','12:30'],['07:30','14:15'],['07:30','15:00'],['07:30','15:30']],
  'South African CAPS': [['07:30','12:00'],['07:30','13:45'],['07:30','14:30'],['07:30','15:00']],
  'Nigerian Curriculum': [['08:00','12:30'],['08:00','14:00'],['08:00','14:30'],['08:00','15:00']],
  'Chinese National Curriculum': [['08:00','11:30'],['08:00','15:00'],['08:00','15:30'],['08:00','16:00']],
  'Japanese Curriculum': [['07:30','11:30'],['08:00','14:30'],['08:30','15:00'],['08:30','15:30']],
  'South Korean Curriculum': [['07:30','11:30'],['08:00','14:30'],['08:00','15:00'],['08:00','15:30']],
  'Finnish National Curriculum': [['08:30','12:30'],['08:30','13:45'],['08:30','14:15'],['08:30','14:45']],
  'Swedish Curriculum': [['08:00','12:00'],['08:00','13:30'],['08:00','14:00'],['08:00','14:30']],
  'Norwegian Curriculum': [['08:15','12:15'],['08:15','13:45'],['08:15','14:15'],['08:15','14:45']],
  'Danish Folkeskole': [['08:00','12:00'],['08:00','13:45'],['08:00','14:15'],['08:00','14:45']],
  'Dutch Curriculum': [['08:30','12:30'],['08:30','14:00'],['08:30','14:30'],['08:30','15:00']],
  'Italian Curriculum': [['08:30','12:30'],['08:30','13:30'],['08:30','14:00'],['08:30','14:30']],
  'Spanish Curriculum': [['09:00','12:30'],['09:00','14:00'],['09:00','14:30'],['09:00','15:00']]
};

const GRADE_BANDS = ['Pre-Primary', 'Primary', 'Middle', 'Secondary'];

const BUILT_IN_TEMPLATES = {
  jamea: { comingSoon: true, label: 'Jamea (Coming Soon)' },
  school: {
    label: 'School',
    subcategories: {
      msb: { label: 'MSB', requiresBoardSelection: true },
      regular: { label: 'Regular School', requiresBoardSelection: true },
      college: { label: 'College', mainBlock: { name: 'Lectures', startTime: '09:00', endTime: '15:00' } }
    }
  },
  working: {
    label: 'Working',
    subcategories: {
      internship: { label: 'Internship', mainBlock: { name: 'Internship', startTime: '09:00', endTime: '17:00' } },
      job: {
        label: 'Job',
        subcategories: {
          day: { label: 'Day Shift', mainBlock: { name: 'Work', startTime: '09:00', endTime: '17:00' } },
          evening: { label: 'Evening Shift', mainBlock: { name: 'Work', startTime: '15:00', endTime: '23:00' } },
          night: { label: 'Night Shift', mainBlock: { name: 'Work', startTime: '22:00', endTime: '06:00' } }
        }
      },
      business: { label: 'Business', mainBlock: { name: 'Business', startTime: '09:00', endTime: '20:00' } }
    }
  },
  custom: { label: 'Start from Scratch', mainBlock: null }
};

/**
 * Resolve a template path to its full event list.
 * 
 * @param {Array} path - Array of keys to traverse (e.g., ['working', 'job', 'day'])
 * @returns {Array} - Full event list (UNIVERSAL_DEFAULTS + mainBlock if present)
 */
function resolveTemplatePath(path) {
  let current = BUILT_IN_TEMPLATES;
  let mainBlock = null;

  for (const key of path) {
    if (!current[key]) {
      return null; // Invalid path
    }
    
    if (current[key].mainBlock !== undefined) {
      mainBlock = current[key].mainBlock;
    }
    
    if (current[key].subcategories) {
      current = current[key].subcategories;
    } else {
      // Leaf node
      break;
    }
  }

  // Combine universal defaults with main block
  const events = [...UNIVERSAL_DEFAULTS];
  if (mainBlock) {
    events.push(mainBlock);
  }

  return events;
}

/**
 * Check if a node is a leaf (resolvable template).
 * 
 * @param {Array} path - Array of keys to traverse
 * @returns {boolean}
 */
function isLeafNode(path) {
  let current = BUILT_IN_TEMPLATES;
  
  for (const key of path) {
    if (!current[key]) return false;
    if (current[key].comingSoon) return false;
    if (current[key].subcategories) {
      current = current[key].subcategories;
    } else {
      return true; // Leaf node
    }
  }
  
  return false;
}

module.exports = {
  UNIVERSAL_DEFAULTS,
  SCHOOL_BOARD_TIMINGS,
  GRADE_BANDS,
  BUILT_IN_TEMPLATES,
  resolveTemplatePath,
  isLeafNode,
};
