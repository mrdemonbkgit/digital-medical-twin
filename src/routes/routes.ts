export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  // Phase 2+ routes
  TIMELINE: '/timeline',
  EVENT_NEW: '/event/new',
  EVENT_DETAIL: '/event/:id',
  // Phase 4+ routes
  AI_CHAT: '/ai',
} as const;
