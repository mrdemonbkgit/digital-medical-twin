import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Copy, Info, Check, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/types/ai';

interface MessageActionsMenuProps {
  message: ChatMessage;
  onShowDetails: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function MessageActionsMenu({
  message,
  onShowDetails,
  onRegenerate,
  onEdit,
  onDelete,
  isLoading = false,
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

  const handleRegenerate = () => {
    setIsOpen(false);
    onRegenerate?.();
  };

  const handleEdit = () => {
    setIsOpen(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete?.();
  };

  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';

  return (
    <div ref={menuRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full text-theme-muted hover:text-theme-secondary hover:bg-theme-tertiary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Message actions"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-theme-primary rounded-lg shadow-lg border border-theme-primary py-1 z-50">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-secondary transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success">Copied!</span>
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
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-secondary transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Details</span>
          </button>
          {isUser && onEdit && (
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {isAssistant && onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-theme-secondary hover:bg-theme-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          )}
          {isUser && onDelete && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
