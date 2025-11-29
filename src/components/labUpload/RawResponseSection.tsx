import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { ExtractionDebugInfo } from '@/types';

interface RawResponseSectionProps {
  debugInfo: ExtractionDebugInfo;
}

interface CollapsibleResponseProps {
  title: string;
  content: string | undefined;
  defaultOpen?: boolean;
}

function CollapsibleResponse({ title, content, defaultOpen = false }: CollapsibleResponseProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!content) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <ChevronRight className="h-4 w-4" />
          <span>{title}</span>
          <span className="text-xs">(no response)</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span>{title}</span>
          <span className="text-xs font-normal text-gray-400">
            ({(content.length / 1024).toFixed(1)} KB)
          </span>
        </div>
        {isOpen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded bg-white border border-gray-200"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </button>

      {isOpen && (
        <div className="p-3 bg-gray-900 max-h-64 overflow-auto">
          <pre className="text-xs text-gray-100 font-mono whitespace-pre-wrap break-words">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

export function RawResponseSection({ debugInfo }: RawResponseSectionProps) {
  const { stage1, stage2, stage3 } = debugInfo;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700">Raw AI Responses</h4>

      <div className="space-y-2">
        <CollapsibleResponse
          title="Stage 1: Gemini Extraction Response"
          content={stage1.rawResponse}
        />

        <CollapsibleResponse
          title="Stage 2: GPT Verification Response"
          content={stage2.rawResponse}
        />

        <CollapsibleResponse
          title="Stage 3: Gemini Post-Processing Response"
          content={stage3.rawResponse}
        />
      </div>
    </div>
  );
}
