import type { ReactNode } from 'react';

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights matching text within a string.
 * Returns React nodes with <mark> tags around matches.
 *
 * @param text - The text to search within
 * @param query - The search query to highlight
 * @returns React nodes with highlighted matches
 */
export function highlightText(text: string, query: string): ReactNode {
  if (!query || !text) {
    return text;
  }

  const escapedQuery = escapeRegex(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) {
    // No match found
    return text;
  }

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <mark
          key={index}
          className="rounded bg-yellow-200 px-0.5 text-inherit"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Checks if a string contains the search query (case-insensitive).
 */
export function containsMatch(text: string | undefined | null, query: string): boolean {
  if (!text || !query) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}
