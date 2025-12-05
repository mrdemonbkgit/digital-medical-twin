import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  describe('basic functionality', () => {
    it('returns empty string for no inputs', () => {
      expect(cn()).toBe('');
    });

    it('returns single class', () => {
      expect(cn('foo')).toBe('foo');
    });

    it('joins multiple classes', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });
  });

  describe('conditional classes', () => {
    it('handles conditional classes with object syntax', () => {
      expect(cn({ foo: true, bar: false })).toBe('foo');
    });

    it('handles mixed string and object syntax', () => {
      expect(cn('foo', { bar: true, baz: false })).toBe('foo bar');
    });
  });

  describe('tailwind merge', () => {
    it('merges conflicting tailwind classes', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
    });

    it('merges padding classes', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });

    it('merges margin classes', () => {
      expect(cn('m-2', 'm-4')).toBe('m-4');
    });

    it('merges text color classes', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('merges background color classes', () => {
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });

    it('keeps non-conflicting classes', () => {
      expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
    });

    it('handles complex class combinations', () => {
      expect(cn('p-4 text-red-500', 'p-2 bg-blue-500')).toBe('text-red-500 p-2 bg-blue-500');
    });
  });

  describe('array inputs', () => {
    it('handles array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('handles nested arrays', () => {
      expect(cn(['foo', ['bar', 'baz']])).toBe('foo bar baz');
    });
  });

  describe('falsy values', () => {
    it('filters out null', () => {
      expect(cn('foo', null, 'bar')).toBe('foo bar');
    });

    it('filters out undefined', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    it('filters out false', () => {
      expect(cn('foo', false, 'bar')).toBe('foo bar');
    });

    it('filters out empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });
  });
});
