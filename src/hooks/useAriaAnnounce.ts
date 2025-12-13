import { useState, useCallback } from 'react';

/**
 * Hook to manage ARIA live region announcements for screen readers.
 * Returns an announcement message and a function to set new announcements.
 */
export function useAriaAnnounce() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string) => {
    // Clear first to ensure the same message is announced again
    setAnnouncement('');
    // Set after a brief delay to ensure screen reader picks it up
    setTimeout(() => setAnnouncement(message), 50);
  }, []);

  return { announcement, announce };
}
