import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

describe('TagInput', () => {
  const defaultProps = {
    tags: [],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders input element', () => {
      render(<TagInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders label when provided', () => {
      render(<TagInput {...defaultProps} label="Tags" />);
      expect(screen.getByText('Tags')).toBeInTheDocument();
    });

    it('renders placeholder when no tags', () => {
      render(<TagInput {...defaultProps} placeholder="Add tags..." />);
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
    });

    it('hides placeholder when tags exist', () => {
      render(<TagInput {...defaultProps} tags={['tag1']} placeholder="Add tags..." />);
      expect(screen.queryByPlaceholderText('Add tags...')).not.toBeInTheDocument();
    });

    it('renders existing tags', () => {
      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(<TagInput {...defaultProps} />);
      expect(screen.getByText('Press Enter or comma to add a tag')).toBeInTheDocument();
    });

    it('renders error message when provided', () => {
      render(<TagInput {...defaultProps} error="At least one tag required" />);
      expect(screen.getByText('At least one tag required')).toBeInTheDocument();
    });

    it('applies error styling when error present', () => {
      render(<TagInput {...defaultProps} error="Error" />);
      const container = document.querySelector('.border-red-500');
      expect(container).toBeInTheDocument();
    });
  });

  describe('adding tags', () => {
    it('adds tag on Enter key', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'newtag{enter}');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('adds tag on comma key', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'newtag,');

      expect(onChange).toHaveBeenCalledWith(['newtag']);
    });

    it('trims whitespace from tags', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '  spaced  {enter}');

      expect(onChange).toHaveBeenCalledWith(['spaced']);
    });

    it('converts tags to lowercase', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'UpperCase{enter}');

      expect(onChange).toHaveBeenCalledWith(['uppercase']);
    });

    it('does not add empty tags', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, '   {enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not add duplicate tags', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} tags={['existing']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'existing{enter}');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('clears input after adding tag', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await userEvent.type(input, 'newtag{enter}');

      expect(input.value).toBe('');
    });

    it('adds to existing tags', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} tags={['existing']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'newtag{enter}');

      expect(onChange).toHaveBeenCalledWith(['existing', 'newtag']);
    });
  });

  describe('removing tags', () => {
    it('removes tag when X button clicked', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} onChange={onChange} />);

      // Find the remove button for 'tag1'
      const tag1Element = screen.getByText('tag1').parentElement;
      const removeButton = tag1Element?.querySelector('button');
      expect(removeButton).toBeInTheDocument();

      await userEvent.click(removeButton!);

      expect(onChange).toHaveBeenCalledWith(['tag2']);
    });

    it('removes last tag on Backspace when input empty', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} tags={['tag1', 'tag2']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).toHaveBeenCalledWith(['tag1']);
    });

    it('does not remove tag on Backspace when input has value', async () => {
      const onChange = vi.fn();
      render(<TagInput {...defaultProps} tags={['tag1']} onChange={onChange} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'text');
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('suggestions', () => {
    it('shows suggestions on focus', async () => {
      render(
        <TagInput
          {...defaultProps}
          suggestions={['suggestion1', 'suggestion2']}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      expect(screen.getByText('suggestion1')).toBeInTheDocument();
      expect(screen.getByText('suggestion2')).toBeInTheDocument();
    });

    it('filters suggestions based on input', async () => {
      render(
        <TagInput
          {...defaultProps}
          suggestions={['apple', 'banana', 'apricot']}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'ap');

      expect(screen.getByText('apple')).toBeInTheDocument();
      expect(screen.getByText('apricot')).toBeInTheDocument();
      expect(screen.queryByText('banana')).not.toBeInTheDocument();
    });

    it('excludes already added tags from suggestions', async () => {
      render(
        <TagInput
          {...defaultProps}
          tags={['apple']}
          suggestions={['apple', 'banana']}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      expect(screen.queryByRole('button', { name: 'apple' })).not.toBeInTheDocument();
      expect(screen.getByText('banana')).toBeInTheDocument();
    });

    it('adds tag when suggestion clicked', async () => {
      const onChange = vi.fn();
      render(
        <TagInput
          {...defaultProps}
          onChange={onChange}
          suggestions={['suggestion1']}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      await userEvent.click(screen.getByText('suggestion1'));

      expect(onChange).toHaveBeenCalledWith(['suggestion1']);
    });

    it('hides suggestions on Escape key', async () => {
      render(
        <TagInput
          {...defaultProps}
          suggestions={['suggestion1']}
        />
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(screen.getByText('suggestion1')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });
      expect(screen.queryByText('suggestion1')).not.toBeInTheDocument();
    });

    it('hides suggestions on outside click', async () => {
      render(
        <div>
          <TagInput
            {...defaultProps}
            suggestions={['suggestion1']}
          />
          <div data-testid="outside">Outside</div>
        </div>
      );

      const input = screen.getByRole('textbox');
      await userEvent.click(input);
      expect(screen.getByText('suggestion1')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByTestId('outside'));
      expect(screen.queryByText('suggestion1')).not.toBeInTheDocument();
    });

    it('does not show suggestions when empty', async () => {
      render(<TagInput {...defaultProps} suggestions={[]} />);

      const input = screen.getByRole('textbox');
      await userEvent.click(input);

      // Should not have any suggestion dropdown
      expect(document.querySelector('.max-h-48')).not.toBeInTheDocument();
    });
  });

  describe('focus behavior', () => {
    it('focuses input when container clicked', async () => {
      render(<TagInput {...defaultProps} />);

      const container = document.querySelector('.flex.flex-wrap');
      await userEvent.click(container!);

      expect(screen.getByRole('textbox')).toHaveFocus();
    });

    it('refocuses input after adding tag', async () => {
      render(<TagInput {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await userEvent.type(input, 'tag{enter}');

      expect(input).toHaveFocus();
    });
  });

  describe('styling', () => {
    it('applies focus styling to container', () => {
      render(<TagInput {...defaultProps} />);
      const container = document.querySelector('.focus-within\\:border-blue-500');
      expect(container).toBeInTheDocument();
    });

    it('renders tags with correct styling', () => {
      render(<TagInput {...defaultProps} tags={['tag1']} />);
      const tagSpan = screen.getByText('tag1').closest('span');
      expect(tagSpan).toHaveClass('bg-blue-100', 'text-blue-800', 'rounded-full');
    });
  });
});
