import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversationList } from './ConversationList';
import type { Conversation } from '@/types/conversations';

// Mock common components
vi.mock('@/components/common', () => ({
  Button: ({ children, onClick, className, size }: any) => (
    <button onClick={onClick} className={className} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('ConversationList', () => {
  const mockOnSelect = vi.fn();
  const mockOnNew = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnRename = vi.fn();

  const mockConversations: Conversation[] = [
    {
      id: 'conv-1',
      userId: 'user-1',
      title: 'Health Questions',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'conv-2',
      userId: 'user-1',
      title: 'Lab Results Discussion',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'conv-3',
      userId: 'user-1',
      title: 'Old Conversation',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('rendering', () => {
    it('renders new chat button', () => {
      render(
        <ConversationList
          conversations={[]}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('New Chat')).toBeInTheDocument();
    });

    it('renders loading state', () => {
      render(
        <ConversationList
          conversations={[]}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
          isLoading
        />
      );
      // Loader2 icon is rendered in loading state
      expect(screen.queryByText('No conversations yet')).not.toBeInTheDocument();
    });

    it('renders empty state when no conversations', () => {
      render(
        <ConversationList
          conversations={[]}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('No conversations yet')).toBeInTheDocument();
    });

    it('renders conversation titles', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('Health Questions')).toBeInTheDocument();
      expect(screen.getByText('Lab Results Discussion')).toBeInTheDocument();
    });

    it('renders date labels', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('Today')).toBeInTheDocument();
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('highlights active conversation', () => {
      render(
        <ConversationList
          conversations={mockConversations}
          activeId="conv-1"
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      // Find the clickable container which has the highlight class
      const convItems = document.querySelectorAll('[class*="cursor-pointer"]');
      const activeConv = Array.from(convItems).find(el => el.className.includes('bg-info-muted'));
      expect(activeConv).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('calls onNew when new chat button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      await user.click(screen.getByText('New Chat'));
      expect(mockOnNew).toHaveBeenCalled();
    });

    it('calls onSelect when conversation clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      await user.click(screen.getByText('Health Questions'));
      expect(mockOnSelect).toHaveBeenCalledWith('conv-1');
    });

    it('opens actions menu on more button click', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);

      // Multiple Rename/Delete buttons exist in DOM (one per conversation)
      const renameButtons = screen.getAllByText('Rename');
      const deleteButtons = screen.getAllByText('Delete');
      expect(renameButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });

    it('calls onDelete when delete clicked and confirmed', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);

      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Delete this conversation?');
      expect(mockOnDelete).toHaveBeenCalledWith('conv-1');
    });

    it('does not call onDelete when delete cancelled', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);

      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });
  });

  describe('rename functionality', () => {
    it('shows edit input when rename clicked', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      const input = screen.getByDisplayValue('Health Questions');
      expect(input).toBeInTheDocument();
    });

    it('saves on Enter key', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      // Open actions and start editing
      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      // Type new name and press Enter
      const input = screen.getByDisplayValue('Health Questions');
      await user.clear(input);
      await user.type(input, 'New Title{Enter}');

      expect(mockOnRename).toHaveBeenCalledWith('conv-1', 'New Title');
    });

    it('cancels on Escape key', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      // Open actions and start editing
      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      // Press Escape
      const input = screen.getByDisplayValue('Health Questions');
      await user.type(input, '{Escape}');

      expect(mockOnRename).not.toHaveBeenCalled();
      // Input should be gone - but title text should still show
      expect(screen.getByText('Health Questions')).toBeInTheDocument();
    });

    it('saves on check button click', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      // Open actions and start editing
      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      // Clear and type new name
      const input = screen.getByDisplayValue('Health Questions');
      await user.clear(input);
      await user.type(input, 'Updated Title');

      // Click save button
      await user.click(screen.getByTitle('Save'));

      expect(mockOnRename).toHaveBeenCalledWith('conv-1', 'Updated Title');
    });

    it('cancels on X button click', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      // Open actions and start editing
      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      // Click cancel button
      await user.click(screen.getByTitle('Cancel'));

      expect(mockOnRename).not.toHaveBeenCalled();
    });

    it('does not save empty title', async () => {
      const user = userEvent.setup();
      render(
        <ConversationList
          conversations={mockConversations}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );

      // Open actions and start editing
      const moreButtons = screen.getAllByLabelText('Conversation actions');
      await user.click(moreButtons[0]);
      const renameButtons = screen.getAllByText('Rename');
      await user.click(renameButtons[0]);

      // Clear input and try to save
      const input = screen.getByDisplayValue('Health Questions');
      await user.clear(input);
      await user.click(screen.getByTitle('Save'));

      expect(mockOnRename).not.toHaveBeenCalled();
    });
  });

  describe('date formatting', () => {
    it('shows "Today" for today conversations', () => {
      const todayConv: Conversation[] = [{
        id: 'today',
        userId: 'user-1',
        title: 'Today Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];

      render(
        <ConversationList
          conversations={todayConv}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows "Yesterday" for yesterday conversations', () => {
      const yesterdayConv: Conversation[] = [{
        id: 'yesterday',
        userId: 'user-1',
        title: 'Yesterday Chat',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      }];

      render(
        <ConversationList
          conversations={yesterdayConv}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('shows "X days ago" for recent conversations', () => {
      const threeDaysAgoConv: Conversation[] = [{
        id: 'three-days',
        userId: 'user-1',
        title: 'Three Days Chat',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      }];

      render(
        <ConversationList
          conversations={threeDaysAgoConv}
          activeId={null}
          onSelect={mockOnSelect}
          onNew={mockOnNew}
          onDelete={mockOnDelete}
          onRename={mockOnRename}
        />
      );
      expect(screen.getByText('3 days ago')).toBeInTheDocument();
    });
  });
});
