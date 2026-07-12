// features/coach/coachStates.js
//
// State machine constants for Ustadh AI coach workflow
// Based on the detailed workflow document

export const COACH_STATES = {
  // HOME
  HOME: 'home',
  
  // SEQUENCE
  SEQUENCE_HOME: 'sequence_home',
  SEQUENCE_SURAH_MODE: 'sequence_surah_mode',
  SEQUENCE_SURAH_INPUT: 'sequence_surah_input',
  SEQUENCE_PAGE_MODE: 'sequence_page_mode',
  SEQUENCE_PAGE_INPUT: 'sequence_page_input',
  SEQUENCE_JUZ_PAGE_MODE: 'sequence_juz_page_mode',
  SEQUENCE_JUZ_PAGE_INPUT: 'sequence_juz_page_input',
  SEQUENCE_JUZ_SURAH_INPUT: 'sequence_juz_surah_input',
  
  // MUTASHABIHAT
  MUTASHABIHAT_HOME: 'mutashabihat_home',
  MUTASHABIHAT_SEARCH_SURAH: 'mutashabihat_search_surah',
  MUTASHABIHAT_SEARCH_AYAH: 'mutashabihat_search_ayah',
  MUTASHABIHAT_RESULTS: 'mutashabihat_results',
  MUTASHABIHAT_PAIR_A_SURAH: 'pair_a_surah',
  MUTASHABIHAT_PAIR_A_AYAH: 'pair_a_ayah',
  MUTASHABIHAT_PAIR_B_SURAH: 'pair_b_surah',
  MUTASHABIHAT_PAIR_B_AYAH: 'pair_b_ayah',
  MUTASHABIHAT_PAIR_TIP_RESULT: 'pair_tip_result',
  MUTASHABIHAT_ALL_PAIRS_SURAH: 'all_pairs_surah',
  MUTASHABIHAT_ALL_PAIRS_AYAH: 'all_pairs_ayah',
  
  // BEST METHOD (Sensory Profile)
  STYLE_ASSESSMENT_CHECK: 'style_assessment_check',
  STYLE_PROFILE_INPUT: 'style_profile_input',
  
  // TIME MANAGEMENT
  TIME_MANAGEMENT_START: 'time_management_start',
};

// TODO: Sequence mode selection - unused placeholder for future feature
// DEPRECATED: Not currently used in the application
export const SEQUENCE_MODES = {
  STARTING: 'starting',
  ENDING: 'ending',
};

// TODO: Time management preferences - unused placeholder for future feature
// DEPRECATED: Not currently used in the application
export const TIME_PREFERENCES = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

export const ACCEPTED_PROFILES = [
  'Exploratory Learner',
  'Repetitive Learner',
  'Sensitive Structured Learner',
  'Balanced Learner',
];
