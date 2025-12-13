import { useEffect, useCallback, RefObject } from 'react';

/** Interface for chat input ref that exposes focus and getValue methods */
export interface ChatInputRefInterface {
  focus: () => void;
  getValue: () => string;
}

export interface KeyboardShortcutsConfig {
  /** Reference to the chat input element for focus management */
  inputRef: RefObject<ChatInputRefInterface | HTMLTextAreaElement | HTMLInputElement | null>;
  /** Callback to stop streaming */
  onStopStreaming?: () => void;
  /** Callback to toggle sidebar */
  onToggleSidebar?: () => void;
  /** Callback to close sidebar */
  onCloseSidebar?: () => void;
  /** Callback to edit the last user message */
  onEditLastMessage?: () => void;
  /** Callback to copy the last AI response */
  onCopyLastResponse?: () => void;
  /** Whether streaming is currently active */
  isStreaming?: boolean;
  /** Whether the sidebar is currently open */
  sidebarOpen?: boolean;
  /** Whether there are messages in the conversation */
  hasMessages?: boolean;
}

/**
 * Hook to manage keyboard shortcuts for the AI chat interface.
 *
 * Supported shortcuts:
 * - Cmd/Ctrl + / : Focus chat input
 * - Cmd/Ctrl + \ : Toggle sidebar
 * - Escape : Stop generating (if streaming) or close sidebar (if open)
 * - ↑ (in empty input) : Edit last message
 * - Cmd/Ctrl + Shift + O : Copy last response
 */
export function useKeyboardShortcuts({
  inputRef,
  onStopStreaming,
  onToggleSidebar,
  onCloseSidebar,
  onEditLastMessage,
  onCopyLastResponse,
  isStreaming = false,
  sidebarOpen = false,
  hasMessages = false,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + / : Focus chat input
      if (modKey && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }

      // Cmd/Ctrl + \ : Toggle sidebar
      if (modKey && e.key === '\\') {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Cmd/Ctrl + Shift + O : Copy last response
      if (modKey && e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        onCopyLastResponse?.();
        return;
      }

      // Escape : Stop streaming or close sidebar
      if (e.key === 'Escape') {
        if (isStreaming && onStopStreaming) {
          e.preventDefault();
          onStopStreaming();
          return;
        }
        if (sidebarOpen && onCloseSidebar) {
          e.preventDefault();
          onCloseSidebar();
          return;
        }
      }

      // ↑ (in empty input) : Edit last message
      if (e.key === 'ArrowUp' && hasMessages && onEditLastMessage) {
        const target = e.target as HTMLElement;
        const isTextInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

        // Check if input is empty - handle both ChatInputRefInterface and raw HTMLElement
        let isEmpty = false;
        if (isTextInput) {
          const ref = inputRef.current;
          if (ref && 'getValue' in ref && typeof ref.getValue === 'function') {
            // ChatInputRefInterface
            isEmpty = ref.getValue() === '';
          } else if (ref && 'value' in ref) {
            // HTMLTextAreaElement or HTMLInputElement
            isEmpty = (ref as HTMLTextAreaElement | HTMLInputElement).value === '';
          }
        }

        if (isTextInput && isEmpty) {
          e.preventDefault();
          onEditLastMessage();
          return;
        }
      }
    },
    [
      inputRef,
      onStopStreaming,
      onToggleSidebar,
      onCloseSidebar,
      onEditLastMessage,
      onCopyLastResponse,
      isStreaming,
      sidebarOpen,
      hasMessages,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
