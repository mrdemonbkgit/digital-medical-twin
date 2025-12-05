import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { highlightText, containsMatch } from './highlight';

describe('highlight', () => {
  describe('highlightText', () => {
    it('returns original text when query is empty', () => {
      const result = highlightText('Hello world', '');
      expect(result).toBe('Hello world');
    });

    it('returns original text when text is empty', () => {
      const result = highlightText('', 'query');
      expect(result).toBe('');
    });

    it('returns original text when no match found', () => {
      const result = highlightText('Hello world', 'xyz');
      expect(result).toBe('Hello world');
    });

    it('highlights matching text', () => {
      const result = highlightText('Hello world', 'world');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('world');
      expect(mark.tagName).toBe('MARK');
    });

    it('highlights case-insensitively', () => {
      const result = highlightText('Hello WORLD', 'world');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('WORLD');
      expect(mark.tagName).toBe('MARK');
    });

    it('highlights multiple occurrences', () => {
      const result = highlightText('test test test', 'test');
      render(<div data-testid="result">{result}</div>);

      const marks = screen.getAllByText('test');
      expect(marks.length).toBe(3);
      marks.forEach((mark) => {
        expect(mark.tagName).toBe('MARK');
      });
    });

    it('preserves non-matching text', () => {
      const result = highlightText('Hello world today', 'world');
      render(<div data-testid="result">{result}</div>);

      expect(screen.getByText(/Hello/)).toBeInTheDocument();
      expect(screen.getByText(/today/)).toBeInTheDocument();
    });

    it('applies correct CSS classes to mark', () => {
      const result = highlightText('Hello world', 'world');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('world');
      expect(mark).toHaveClass('rounded');
      expect(mark).toHaveClass('bg-yellow-200');
      expect(mark).toHaveClass('px-0.5');
    });

    it('escapes regex special characters in query', () => {
      const result = highlightText('Price: $100.00', '$100');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('$100');
      expect(mark.tagName).toBe('MARK');
    });

    it('handles query with dots', () => {
      const result = highlightText('file.txt is here', 'file.txt');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('file.txt');
      expect(mark.tagName).toBe('MARK');
    });

    it('handles query with parentheses', () => {
      const result = highlightText('function()', 'function()');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('function()');
      expect(mark.tagName).toBe('MARK');
    });

    it('handles query with brackets', () => {
      const result = highlightText('array[0]', '[0]');
      render(<div data-testid="result">{result}</div>);

      const mark = screen.getByText('[0]');
      expect(mark.tagName).toBe('MARK');
    });
  });

  describe('containsMatch', () => {
    it('returns false when text is undefined', () => {
      expect(containsMatch(undefined, 'query')).toBe(false);
    });

    it('returns false when text is null', () => {
      expect(containsMatch(null, 'query')).toBe(false);
    });

    it('returns false when text is empty', () => {
      expect(containsMatch('', 'query')).toBe(false);
    });

    it('returns false when query is empty', () => {
      expect(containsMatch('Hello world', '')).toBe(false);
    });

    it('returns false when no match', () => {
      expect(containsMatch('Hello world', 'xyz')).toBe(false);
    });

    it('returns true when match found', () => {
      expect(containsMatch('Hello world', 'world')).toBe(true);
    });

    it('matches case-insensitively', () => {
      expect(containsMatch('Hello World', 'world')).toBe(true);
      expect(containsMatch('Hello World', 'WORLD')).toBe(true);
      expect(containsMatch('HELLO WORLD', 'hello')).toBe(true);
    });

    it('matches partial strings', () => {
      expect(containsMatch('Hello world', 'wor')).toBe(true);
      expect(containsMatch('Hello world', 'ello')).toBe(true);
    });
  });
});
