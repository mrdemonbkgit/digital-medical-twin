import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Settings, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Button } from '@/components/common';
import { ChatMessage, ChatInput, SuggestedQuestions, ReasoningLevelSelect } from '@/components/ai';
import { useAIChat, useAISettings } from '@/hooks';
import type { OpenAIReasoningEffort, GeminiThinkingLevel } from '@/types/ai';

export function AIHistorianPage() {
  const { messages, isLoading, error, sendMessage, clearChat } = useAIChat();
  const { settings, isLoading: settingsLoading, updateSettings } = useAISettings();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleReasoningChange = async (value: OpenAIReasoningEffort) => {
    await updateSettings({ openaiReasoningEffort: value });
  };

  const handleThinkingChange = async (value: GeminiThinkingLevel) => {
    await updateSettings({ geminiThinkingLevel: value });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI is configured if a provider is selected (API keys are now server-side)
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
    <PageWrapper title="AI Historian">
      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Historian</h2>
              <p className="text-sm text-gray-500">
                Using {settings.provider === 'google' ? 'Gemini' : 'GPT'} · {settings.model}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {settings.provider && (
              <ReasoningLevelSelect
                provider={settings.provider}
                openaiReasoningEffort={settings.openaiReasoningEffort}
                geminiThinkingLevel={settings.geminiThinkingLevel}
                onChangeOpenAI={handleReasoningChange}
                onChangeGemini={handleThinkingChange}
                disabled={isLoading}
              />
            )}
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
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
              {isLoading && (
                <div className="flex items-center gap-2 p-4 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Input area */}
        <div className="pt-4 border-t">
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
    </PageWrapper>
  );
}
