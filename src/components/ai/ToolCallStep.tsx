import { useState } from 'react';
import { Code2 } from 'lucide-react';
import type { ToolCall } from '@/types/ai';

interface ToolCallStepProps {
  toolCall: ToolCall;
}

export function ToolCallStep({ toolCall }: ToolCallStepProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="flex gap-2">
      {/* Code icon */}
      <div className="mt-1 flex-shrink-0">
        <Code2 className="h-4 w-4 text-gray-400" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Tool call title (clickable to collapse) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-gray-800 hover:text-gray-600 transition-colors"
        >
          {toolCall.name}
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-0">
            {/* Code block with syntax highlighting */}
            {toolCall.arguments && Object.keys(toolCall.arguments).length > 0 && (
              <div className="bg-gray-900 rounded-t-lg p-3 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-100">
                  <code>{formatToolArguments(toolCall.arguments)}</code>
                </pre>
              </div>
            )}

            {/* Output block (if result exists) */}
            {toolCall.result && (
              <div className="bg-gray-800 rounded-b-lg p-3 font-mono text-sm border-t border-gray-700">
                <pre className="text-green-400">{toolCall.result}</pre>
              </div>
            )}

            {/* If no arguments but has result, show result with rounded corners */}
            {(!toolCall.arguments || Object.keys(toolCall.arguments).length === 0) && toolCall.result && (
              <div className="bg-gray-800 rounded-lg p-3 font-mono text-sm">
                <pre className="text-green-400">{toolCall.result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Format tool arguments as Python-like code with syntax highlighting colors
function formatToolArguments(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => {
      const formattedValue = formatValue(value);
      return `${key} = ${formattedValue}`;
    })
    .join('\n');
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (value === null) {
    return 'None';
  }
  if (Array.isArray(value)) {
    return `[${value.map(formatValue).join(', ')}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
