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
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="font-medium text-gray-900">
                {metadata.model && MODEL_DISPLAY_NAMES[metadata.model as AIModel] || metadata.model}
              </p>
            </div>
          </div>
        )}

        {/* Token Usage */}
        {metadata?.tokensUsed && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Token Usage</h3>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-right py-2 px-4 font-medium text-gray-600">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-4 text-gray-700">Input</td>
                    <td className="py-2 px-4 text-right text-gray-900">
                      {formatNumber(metadata.tokensUsed.prompt)}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-4 text-gray-700">Output</td>
                    <td className="py-2 px-4 text-right text-gray-900">
                      {formatNumber(metadata.tokensUsed.completion)}
                    </td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="py-2 px-4 font-medium text-gray-700">Total</td>
                    <td className="py-2 px-4 text-right font-medium text-gray-900">
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
              <Settings2 className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-medium text-gray-700">Parameters</h3>
            </div>
            <div className="space-y-2">
              {metadata?.reasoningEffort && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">reasoning_effort</span>
                  <span className="text-gray-900">{metadata.reasoningEffort}</span>
                </div>
              )}
              {metadata?.thinkingLevel && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">thinking_level</span>
                  <span className="text-gray-900">{metadata.thinkingLevel}</span>
                </div>
              )}
              {metadata?.elapsedMs && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    elapsed_time
                  </span>
                  <span className="text-gray-900">{formatDuration(metadata.elapsedMs)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No metadata available */}
        {!hasMetadata && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No detailed metadata available for this message.</p>
            <p className="text-xs mt-1 text-gray-400">
              Metadata is only captured for new messages.
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
          <span>Sent at {message.timestamp.toLocaleString()}</span>
        </div>
      </div>
    </Modal>
  );
}
