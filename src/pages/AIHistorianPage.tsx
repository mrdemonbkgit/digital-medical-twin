import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Bot, Settings, Loader2, Trash2, Menu } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button, BottomSheet } from '@/components/common';
import {
  ChatMessage,
  ChatInput,
  SuggestedQuestions,
  ReasoningLevelSelect,
  ConversationList,
  StreamingIndicator,
  ErrorRecovery,
} from '@/components/ai';
import type { ChatInputRef } from '@/components/ai';
import { useAIChat, useAISettings, useConversations, useAriaAnnounce, useKeyboardShortcuts } from '@/hooks';
import type { OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';
import type { ConversationSettings } from '@/types/conversations';
import { cn } from '@/utils/cn';
import { getToolLabel } from '@/constants';

export function AIHistorianPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('c');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Override settings when loading a conversation with saved settings
  const [settingsOverride, setSettingsOverride] = useState<ConversationSettings | null>(null);
  // Local agentic mode state for new conversations (before first message)
  const [localAgenticMode, setLocalAgenticMode] = useState<boolean | null>(null);
  // ID of message to trigger edit mode (for keyboard shortcut)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const {
    conversations,
    isLoading: conversationsLoading,
    remove: removeConversation,
    rename: renameConversation,
    refetch: refetchConversations,
  } = useConversations();

  const { settings, isLoading: settingsLoading, updateSettings } = useAISettings();

  // Build current settings for creating new conversations
  const currentSettings = useMemo<ConversationSettings | null>(() => {
    if (!settings) return null;
    // For agentic mode: use local override if set, otherwise use global setting
    // Force OFF for Gemini
    const agenticMode = settings.provider === 'google'
      ? false
      : (localAgenticMode ?? settings.agenticMode ?? true);
    return {
      provider: settings.provider,
      model: settings.model,
      reasoningEffort: settings.openaiReasoningEffort ?? null,
      thinkingLevel: settings.geminiThinkingLevel ?? null,
      agenticMode,
    };
  }, [settings, localAgenticMode]);

  const {
    conversationId,
    messages,
    isLoading,
    error,
    streamingStatus,
    sendMessage,
    stopStreaming,
    regenerateResponse,
    editMessage,
    deleteMessages,
    clearError,
    loadConversation,
    startNewConversation,
  } = useAIChat({
    conversationId: conversationIdFromUrl,
    currentSettings,
    onConversationCreated: (id) => {
      setSearchParams({ c: id });
      refetchConversations();
    },
    onMessageSent: () => {
      // Refresh sidebar to update conversation order and timestamps
      refetchConversations();
    },
    onSettingsLoaded: (loadedSettings) => {
      // Apply loaded conversation's settings to UI, or clear if none
      setSettingsOverride(loadedSettings.provider ? loadedSettings : null);
    },
  });

  // ARIA announcements for screen readers
  const { announcement, announce } = useAriaAnnounce();
  const prevStreamingRef = useRef(false);
  const prevToolRef = useRef<string | null>(null);

  useEffect(() => {
    // Announce streaming start
    if (isLoading && !prevStreamingRef.current) {
      announce('AI is thinking...');
    }
    // Announce streaming end
    if (!isLoading && prevStreamingRef.current) {
      announce('Response complete');
    }
    prevStreamingRef.current = isLoading;
  }, [isLoading, announce]);

  useEffect(() => {
    // Announce tool changes with user-friendly labels
    if (streamingStatus.currentTool && streamingStatus.currentTool !== prevToolRef.current) {
      announce(getToolLabel(streamingStatus.currentTool));
    }
    prevToolRef.current = streamingStatus.currentTool;
  }, [streamingStatus.currentTool, announce]);

  useEffect(() => {
    // Announce errors
    if (error) {
      announce(`Error: ${error}`);
    }
  }, [error, announce]);

  // Effective settings: use override if set, otherwise use global settings
  // When override exists, do NOT fall back to global settings for individual fields
  // (that would cause all conversations to update when global settings change)
  const effectiveSettings = useMemo(() => {
    if (settingsOverride && conversationId) {
      return {
        provider: settingsOverride.provider,
        model: settingsOverride.model,
        openaiReasoningEffort: settingsOverride.reasoningEffort ?? 'medium',
        geminiThinkingLevel: settingsOverride.thinkingLevel ?? 'high',
        agenticMode: settingsOverride.agenticMode ?? true,
      };
    }
    // For new conversations, use localAgenticMode or global setting
    // Force OFF for Gemini
    const agenticMode = settings?.provider === 'google'
      ? false
      : (localAgenticMode ?? settings?.agenticMode ?? true);
    return settings ? { ...settings, agenticMode } : null;
  }, [settingsOverride, conversationId, settings, localAgenticMode]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);

  // Keyboard shortcuts handlers
  const handleCopyLastResponse = useCallback(() => {
    const lastAIMessage = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAIMessage) {
      navigator.clipboard.writeText(lastAIMessage.content);
      announce('Response copied to clipboard');
    }
  }, [messages, announce]);

  const handleEditLastMessage = useCallback(() => {
    // Get the last user message and trigger edit mode via state
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      setEditingMessageId(lastUserMessage.id);
    }
  }, [messages]);

  const handleEditModeEntered = useCallback(() => {
    // Clear the editing trigger after ChatMessage has entered edit mode
    setEditingMessageId(null);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    inputRef: chatInputRef,
    onStopStreaming: stopStreaming,
    onToggleSidebar: handleToggleSidebar,
    onCloseSidebar: () => setSidebarOpen(false),
    onEditLastMessage: handleEditLastMessage,
    onCopyLastResponse: handleCopyLastResponse,
    isStreaming: isLoading,
    sidebarOpen,
    hasMessages: messages.length > 0,
  });

  const handleReasoningChange = async (value: OpenAIReasoningEffort) => {
    // Update global settings
    await updateSettings({ openaiReasoningEffort: value });
    // Also update override if in existing conversation
    if (settingsOverride) {
      setSettingsOverride({ ...settingsOverride, reasoningEffort: value });
    }
  };

  const handleThinkingChange = async (value: GeminiThinkingLevel) => {
    // Update global settings
    await updateSettings({ geminiThinkingLevel: value });
    // Also update override if in existing conversation
    if (settingsOverride) {
      setSettingsOverride({ ...settingsOverride, thinkingLevel: value });
    }
  };

  // Handle conversation selection from sidebar
  const handleSelectConversation = (id: string) => {
    setSearchParams({ c: id });
    loadConversation(id);
    setSidebarOpen(false);
  };

  // Handle new conversation
  // Note: startNewConversation must be called BEFORE setSearchParams to avoid race condition
  // where the useEffect in useAIChat sees stale URL and reloads the old conversation
  const handleNewConversation = () => {
    startNewConversation();
    setSearchParams({});
    setSettingsOverride(null); // Clear override to use global settings
    setLocalAgenticMode(null); // Reset to use global agentic mode setting
    setSidebarOpen(false);
  };

  // Handle delete conversation
  const handleDeleteConversation = async (id: string) => {
    await removeConversation(id);
    if (conversationId === id) {
      handleNewConversation();
    }
  };

  // Handle rename conversation
  const handleRenameConversation = async (id: string, title: string) => {
    await renameConversation(id, title);
  };

  // Handle retry after error
  const handleRetry = () => {
    // Find the last user message and resend it
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI is configured if a provider is selected
  const isConfigured = !!settings?.provider;

  // Loading state
  if (settingsLoading) {
    return (
      <PageWrapper title="AI Historian">
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-theme-muted" />
        </div>
      </PageWrapper>
    );
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <PageWrapper title="AI Historian">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-theme-muted" />
          </div>
          <h2 className="text-xl font-semibold text-theme-primary mb-2">
            Set Up AI Historian
          </h2>
          <p className="text-theme-secondary max-w-md mb-6">
            Configure your AI provider to start asking questions about your health history.
            Your data is processed securely and never stored by AI providers.
          </p>
          <Link to="/settings">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure AI Settings
            </Button>
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper fullWidth className="!py-0 overflow-hidden">
      {/* Skip link for keyboard navigation */}
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-theme-primary focus:text-info focus:rounded-md focus:outline-none focus:ring-2 focus:ring-info"
        onClick={(e) => {
          e.preventDefault();
          chatInputRef.current?.focus();
        }}
      >
        Skip to chat input
      </a>

      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="flex fixed inset-x-0 top-16 bottom-0 lg:relative lg:inset-auto lg:chat-container-height lg:max-h-[900px] overflow-hidden bg-theme-secondary">
        {/* Mobile bottom sheet sidebar */}
        <BottomSheet
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          title="Conversations"
          snapPoints={[0.6, 0.9]}
        >
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
            isLoading={conversationsLoading}
          />
        </BottomSheet>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-theme-secondary border-r border-theme-primary">
          <ConversationList
            conversations={conversations}
            activeId={conversationId}
            onSelect={handleSelectConversation}
            onNew={handleNewConversation}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
            isLoading={conversationsLoading}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b border-theme-primary bg-theme-primary">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 hover:bg-theme-tertiary rounded flex-shrink-0"
              >
                <Menu className="h-5 w-5 text-theme-tertiary" />
              </button>

              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-info-muted rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-theme-primary text-sm sm:text-base truncate">AI Historian</h2>
                <p className="text-[10px] sm:text-xs text-theme-tertiary truncate">
                  {effectiveSettings?.provider === 'google' ? 'Gemini' : 'GPT'} · {effectiveSettings?.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Agentic Mode Toggle - disabled for Gemini or after first message */}
              {effectiveSettings?.provider && (
                <div className="relative">
                  <button
                    onClick={() => {
                      if (messages.length === 0 && effectiveSettings.provider !== 'google') {
                        setLocalAgenticMode(!(effectiveSettings.agenticMode ?? true));
                      }
                    }}
                    disabled={messages.length > 0 || effectiveSettings.provider === 'google' || isLoading}
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded-md transition-colors',
                      effectiveSettings.provider === 'google'
                        ? 'bg-theme-tertiary text-theme-muted cursor-not-allowed'
                        : messages.length > 0
                          ? 'bg-theme-tertiary text-theme-tertiary cursor-not-allowed'
                          : effectiveSettings.agenticMode
                            ? 'bg-info-muted text-info hover:opacity-80'
                            : 'bg-warning-muted text-warning hover:opacity-80'
                    )}
                    title={
                      effectiveSettings.provider === 'google'
                        ? 'Agentic mode not available for Gemini'
                        : messages.length > 0
                          ? 'Mode locked for this conversation'
                          : effectiveSettings.agenticMode
                            ? 'Click to switch to One-Shot mode'
                            : 'Click to switch to Agentic mode'
                    }
                  >
                    {effectiveSettings.provider === 'google'
                      ? 'One-Shot'
                      : effectiveSettings.agenticMode
                        ? 'Agentic'
                        : 'One-Shot'}
                  </button>
                </div>
              )}
              {effectiveSettings?.provider && (
                <ReasoningLevelSelect
                  provider={effectiveSettings.provider}
                  openaiReasoningEffort={effectiveSettings.openaiReasoningEffort}
                  geminiThinkingLevel={effectiveSettings.geminiThinkingLevel}
                  onChangeOpenAI={handleReasoningChange}
                  onChangeGemini={handleThinkingChange}
                  disabled={isLoading}
                />
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleNewConversation}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
          </div>

          {/* Messages area */}
          <div className={`flex-1 py-3 sm:py-4 px-2 sm:px-4 space-y-3 sm:space-y-4 ${messages.length > 0 ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 bg-theme-tertiary rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-theme-muted" />
                </div>
                <h3 className="text-lg font-medium text-theme-primary mb-2">
                  Ask about your health history
                </h3>
                <p className="text-sm text-theme-secondary max-w-md mb-6">
                  I can help you understand trends, find specific events, and summarize
                  your health journey. Ask me anything about your recorded health data.
                </p>
                <SuggestedQuestions onSelect={sendMessage} />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onRegenerate={regenerateResponse}
                    onEdit={editMessage}
                    onDelete={deleteMessages}
                    isLoading={isLoading}
                    triggerEditMode={editingMessageId === message.id}
                    onEditModeEntered={handleEditModeEntered}
                  />
                ))}
                {isLoading && <StreamingIndicator status={streamingStatus} onStop={stopStreaming} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error display */}
          {error && (
            <ErrorRecovery
              error={error}
              onRetry={handleRetry}
              onNewConversation={handleNewConversation}
              onDismiss={clearError}
              isLoading={isLoading}
            />
          )}

          {/* Input area */}
          <div id="chat-input" className="px-4 py-3 border-t border-theme-primary bg-theme-primary">
            <ChatInput
              ref={chatInputRef}
              onSend={sendMessage}
              onStop={stopStreaming}
              disabled={!settings?.provider}
              isStreaming={isLoading}
              placeholder="Ask about your health history..."
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
