import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Bot, Settings, AlertCircle, Loader2, Trash2, Menu, X } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/common';
import {
  ChatMessage,
  ChatInput,
  SuggestedQuestions,
  ReasoningLevelSelect,
  ConversationList,
  StreamingIndicator,
} from '@/components/ai';
import { useAIChat, useAISettings, useConversations } from '@/hooks';
import type { OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';
import type { ConversationSettings } from '@/types/conversations';
import { cn } from '@/utils/cn';

export function AIHistorianPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationIdFromUrl = searchParams.get('c');

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Override settings when loading a conversation with saved settings
  const [settingsOverride, setSettingsOverride] = useState<ConversationSettings | null>(null);
  // Local agentic mode state for new conversations (before first message)
  const [localAgenticMode, setLocalAgenticMode] = useState<boolean | null>(null);

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

  const handleReasoningChange = async (value: OpenAIReasoningEffort) => {
    await updateSettings({ openaiReasoningEffort: value });
  };

  const handleThinkingChange = async (value: GeminiThinkingLevel) => {
    await updateSettings({ geminiThinkingLevel: value });
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
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </PageWrapper>
    );
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <PageWrapper title="AI Historian">
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Set Up AI Historian
          </h2>
          <p className="text-gray-600 max-w-md mb-6">
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
    <PageWrapper title="AI Historian" fullWidth>
      <div className="flex h-[calc(100vh-8rem)] max-h-[900px]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-50 border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-200">
            <span className="font-medium text-gray-900">Conversations</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="h-full lg:h-auto">
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
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1 hover:bg-gray-100 rounded"
              >
                <Menu className="h-5 w-5 text-gray-500" />
              </button>

              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">AI Historian</h2>
                <p className="text-xs text-gray-500">
                  {effectiveSettings?.provider === 'google' ? 'Gemini' : 'GPT'} · {effectiveSettings?.model}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : messages.length > 0
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : effectiveSettings.agenticMode
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
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
          <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Ask about your health history
                </h3>
                <p className="text-sm text-gray-600 max-w-md mb-6">
                  I can help you understand trends, find specific events, and summarize
                  your health journey. Ask me anything about your recorded health data.
                </p>
                <SuggestedQuestions onSelect={sendMessage} />
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && <StreamingIndicator status={streamingStatus} />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Error display */}
          {error && (
            <div className="mx-4 mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="px-4 py-3 border-t border-gray-200 bg-white">
            <ChatInput
              onSend={sendMessage}
              disabled={isLoading}
              placeholder="Ask about your health history..."
            />
            <p className="text-xs text-gray-400 mt-2 text-center">
              AI responses are based on your recorded health data and should not replace medical advice.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
