export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  // Profile routes
  PROFILE: '/profile',
  PROFILE_SETUP: '/profile/setup',
  // Phase 2 routes
  TIMELINE: '/timeline',
  EVENT_NEW: '/event/new',
  EVENT_NEW_TYPE: '/event/new/:type',
  EVENT_DETAIL: '/event/:id',
  // Phase 4+ routes
  AI_CHAT: '/ai',
  LAB_UPLOADS: '/lab-uploads',
  BIOMARKERS: '/biomarkers',
} as const;
