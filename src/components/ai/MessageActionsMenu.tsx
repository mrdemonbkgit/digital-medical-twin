import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Copy, Info, Check } from 'lucide-react';
import type { ChatMessage } from '@/types/ai';

interface MessageActionsMenuProps {
  message: ChatMessage;
  onShowDetails: () => void;
  className?: string;
}

export function MessageActionsMenu({
  message,
  onShowDetails,
  className = '',
}: MessageActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShowDetails = () => {
    setIsOpen(false);
    onShowDetails();
  };

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Message actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy message</span>
              </>
            )}
          </button>
          <button
            onClick={handleShowDetails}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
          </button>
        </div>
      )}
    </div>
  );
}
