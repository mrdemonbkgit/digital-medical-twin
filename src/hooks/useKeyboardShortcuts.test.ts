import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockInputRef = { current: null as HTMLInputElement | null };
  const mockCallbacks = {
    onStopStreaming: vi.fn(),
    onToggleSidebar: vi.fn(),
    onCloseSidebar: vi.fn(),
    onEditLastMessage: vi.fn(),
    onCopyLastResponse: vi.fn(),
  };
  const originalPlatform = navigator.platform;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a mock input element
    mockInputRef.current = document.createElement('input');
    mockInputRef.current.focus = vi.fn();
    document.body.appendChild(mockInputRef.current);
  });

  afterEach(() => {
    if (mockInputRef.current) {
      document.body.removeChild(mockInputRef.current);
      mockInputRef.current = null;
    }
    // Restore original platform
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      configurable: true,
    });
  });

  function dispatchKeydown(key: string, options: Partial<KeyboardEvent> = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      ...options,
    });
    document.dispatchEvent(event);
  }

  describe('Cmd/Ctrl + / : Focus input', () => {
    it('focuses input on Cmd + / (Mac)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('/', { metaKey: true });

      expect(mockInputRef.current?.focus).toHaveBeenCalled();
    });

    it('focuses input on Ctrl + / (Windows/Linux)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('/', { ctrlKey: true });

      expect(mockInputRef.current?.focus).toHaveBeenCalled();
    });
  });

  describe('Cmd/Ctrl + \\ : Toggle sidebar', () => {
    it('toggles sidebar on Cmd + \\ (Mac)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('\\', { metaKey: true });

      expect(mockCallbacks.onToggleSidebar).toHaveBeenCalled();
    });

    it('toggles sidebar on Ctrl + \\ (Windows/Linux)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('\\', { ctrlKey: true });

      expect(mockCallbacks.onToggleSidebar).toHaveBeenCalled();
    });
  });

  describe('Cmd/Ctrl + Shift + O : Copy last response', () => {
    it('copies last response on Cmd + Shift + O (Mac)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('o', { metaKey: true, shiftKey: true });

      expect(mockCallbacks.onCopyLastResponse).toHaveBeenCalled();
    });

    it('copies last response on Ctrl + Shift + O (Windows/Linux)', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      dispatchKeydown('O', { ctrlKey: true, shiftKey: true });

      expect(mockCallbacks.onCopyLastResponse).toHaveBeenCalled();
    });
  });

  describe('Escape', () => {
    it('stops streaming when streaming is active', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          isStreaming: true,
        })
      );

      dispatchKeydown('Escape');

      expect(mockCallbacks.onStopStreaming).toHaveBeenCalled();
      expect(mockCallbacks.onCloseSidebar).not.toHaveBeenCalled();
    });

    it('closes sidebar when open and not streaming', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          isStreaming: false,
          sidebarOpen: true,
        })
      );

      dispatchKeydown('Escape');

      expect(mockCallbacks.onStopStreaming).not.toHaveBeenCalled();
      expect(mockCallbacks.onCloseSidebar).toHaveBeenCalled();
    });

    it('prioritizes stop streaming over close sidebar', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          isStreaming: true,
          sidebarOpen: true,
        })
      );

      dispatchKeydown('Escape');

      expect(mockCallbacks.onStopStreaming).toHaveBeenCalled();
      expect(mockCallbacks.onCloseSidebar).not.toHaveBeenCalled();
    });

    it('does nothing when not streaming and sidebar closed', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          isStreaming: false,
          sidebarOpen: false,
        })
      );

      dispatchKeydown('Escape');

      expect(mockCallbacks.onStopStreaming).not.toHaveBeenCalled();
      expect(mockCallbacks.onCloseSidebar).not.toHaveBeenCalled();
    });
  });

  describe('ArrowUp : Edit last message', () => {
    it('edits last message when input is empty and focused', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          hasMessages: true,
        })
      );

      // Simulate keydown event with target being the input
      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: mockInputRef.current });
      document.dispatchEvent(event);

      expect(mockCallbacks.onEditLastMessage).toHaveBeenCalled();
    });

    it('does not edit when input has value', () => {
      if (mockInputRef.current) {
        mockInputRef.current.value = 'some text';
      }

      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          hasMessages: true,
        })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: mockInputRef.current });
      document.dispatchEvent(event);

      expect(mockCallbacks.onEditLastMessage).not.toHaveBeenCalled();
    });

    it('does not edit when there are no messages', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          hasMessages: false,
        })
      );

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
      });
      Object.defineProperty(event, 'target', { value: mockInputRef.current });
      document.dispatchEvent(event);

      expect(mockCallbacks.onEditLastMessage).not.toHaveBeenCalled();
    });

    it('does not edit when focus is not on input', () => {
      renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
          hasMessages: true,
        })
      );

      // Dispatch from document (not the input)
      dispatchKeydown('ArrowUp');

      expect(mockCallbacks.onEditLastMessage).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() =>
        useKeyboardShortcuts({
          inputRef: mockInputRef,
          ...mockCallbacks,
        })
      );

      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
