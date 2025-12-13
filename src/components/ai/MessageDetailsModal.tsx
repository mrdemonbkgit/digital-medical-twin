import { Modal } from '@/components/common/Modal';
import { Bot, Cpu, Clock, Settings2 } from 'lucide-react';
import type { ChatMessage, MessageMetadata, AIModel } from '@/types/ai';
import { MODEL_DISPLAY_NAMES } from '@/types/ai';

interface MessageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function MessageDetailsModal({
  isOpen,
  onClose,
  message,
}: MessageDetailsModalProps) {
  const metadata: MessageMetadata | undefined = message.metadata;
  const hasMetadata = metadata && (metadata.model || metadata.tokensUsed);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Details" size="sm">
      <div className="space-y-6">
        {/* Model Info */}
        {metadata?.model && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-theme-tertiary flex items-center justify-center">
              <Bot className="w-5 h-5 text-theme-secondary" />
            </div>
            <div>
              <p className="text-sm text-theme-tertiary">Model</p>
              <p className="font-medium text-theme-primary">
                {metadata.model && MODEL_DISPLAY_NAMES[metadata.model as AIModel] || metadata.model}
              </p>
            </div>
          </div>
        )}

        {/* Token Usage */}
        {metadata?.tokensUsed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-theme-tertiary" />
              <h3 className="text-sm font-medium text-theme-secondary">Token Usage</h3>
            </div>
            <div className="bg-theme-secondary rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-theme-primary">
                    <th className="text-left py-2 px-4 font-medium text-theme-secondary">Type</th>
                    <th className="text-right py-2 px-4 font-medium text-theme-secondary">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-theme-primary">
                    <td className="py-2 px-4 text-theme-secondary">Input</td>
                    <td className="py-2 px-4 text-right text-theme-primary">
                      {formatNumber(metadata.tokensUsed.prompt)}
                    </td>
                  </tr>
                  <tr className="border-b border-theme-primary">
                    <td className="py-2 px-4 text-theme-secondary">Output</td>
                    <td className="py-2 px-4 text-right text-theme-primary">
                      {formatNumber(metadata.tokensUsed.completion)}
                    </td>
                  </tr>
                  <tr className="bg-theme-tertiary">
                    <td className="py-2 px-4 font-medium text-theme-secondary">Total</td>
                    <td className="py-2 px-4 text-right font-medium text-theme-primary">
                      {formatNumber(metadata.tokensUsed.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Parameters */}
        {(metadata?.reasoningEffort || metadata?.thinkingLevel || metadata?.elapsedMs) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Settings2 className="w-4 h-4 text-theme-tertiary" />
              <h3 className="text-sm font-medium text-theme-secondary">Parameters</h3>
            </div>
            <div className="space-y-2">
              {metadata?.reasoningEffort && (
                <div className="flex justify-between text-sm">
                  <span className="text-theme-secondary">reasoning_effort</span>
                  <span className="text-theme-primary">{metadata.reasoningEffort}</span>
                </div>
              )}
              {metadata?.thinkingLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-theme-secondary">thinking_level</span>
                  <span className="text-theme-primary">{metadata.thinkingLevel}</span>
                </div>
              )}
              {metadata?.elapsedMs && (
                <div className="flex justify-between text-sm">
                  <span className="text-theme-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    elapsed_time
                  </span>
                  <span className="text-theme-primary">{formatDuration(metadata.elapsedMs)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No metadata available */}
        {!hasMetadata && (
          <div className="text-center py-4 text-theme-tertiary">
            <p className="text-sm">No detailed metadata available for this message.</p>
            <p className="text-xs mt-1 text-theme-muted">
              Metadata is only captured for new messages.
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-4 border-t border-theme-primary text-xs text-theme-tertiary">
          <span>Sent at {message.timestamp.toLocaleString()}</span>
        </div>
      </div>
    </Modal>
  );
}
