import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AISettingsForm } from './AISettingsForm';
import { useAISettings } from '@/hooks';

// Mock the useAISettings hook
vi.mock('@/hooks', () => ({
  useAISettings: vi.fn(),
}));

describe('AISettingsForm', () => {
  const mockUpdateSettings = vi.fn();
  const defaultSettings = {
    provider: null as 'openai' | 'google' | null,
    model: null as string | null,
    openaiReasoningEffort: 'medium' as const,
    geminiThinkingLevel: 'high' as const,
    agenticMode: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAISettings).mockReturnValue({
      settings: defaultSettings,
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });
  });

  it('renders loading skeleton when loading', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: null,
      isLoading: true,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    // Check for skeleton elements (animate-pulse class)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows provider dropdown options', () => {
    render(<AISettingsForm />);

    const providerSelect = screen.getByLabelText('AI Provider');
    expect(providerSelect).toBeInTheDocument();

    // Check options exist
    const options = providerSelect.querySelectorAll('option');
    expect(options.length).toBeGreaterThanOrEqual(2); // placeholder + providers
  });

  it('shows model dropdown when provider selected', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const modelSelect = screen.getByLabelText('Model');
    expect(modelSelect).toBeInTheDocument();
  });

  it('shows OpenAI reasoning effort dropdown when provider is openai', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const reasoningSelect = screen.getByLabelText('Reasoning Effort');
    expect(reasoningSelect).toBeInTheDocument();

    // Should not show Gemini thinking level
    expect(screen.queryByLabelText('Thinking Level')).not.toBeInTheDocument();
  });

  it('shows Gemini thinking level dropdown when provider is google', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'google', model: 'gemini-3-pro-preview' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const thinkingSelect = screen.getByLabelText('Thinking Level');
    expect(thinkingSelect).toBeInTheDocument();

    // Should not show OpenAI reasoning effort
    expect(screen.queryByLabelText('Reasoning Effort')).not.toBeInTheDocument();
  });

  it('calls updateSettings on save with correct values', async () => {
    mockUpdateSettings.mockResolvedValueOnce(undefined);

    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith({
        provider: 'openai',
        model: 'gpt-5.2',
        openaiReasoningEffort: 'medium',
        geminiThinkingLevel: 'high',
        agenticMode: true,
      });
    });
  });

  it('shows success message after save', async () => {
    mockUpdateSettings.mockResolvedValueOnce(undefined);

    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockUpdateSettings.mockRejectedValueOnce(new Error('Failed to save'));

    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });

  it('shows hook error message', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: defaultSettings,
      isLoading: false,
      error: 'API not available',
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    expect(screen.getByText(/api not available/i)).toBeInTheDocument();
  });

  it('disables save button when no provider selected', () => {
    render(<AISettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('enables save button when provider is selected', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).not.toBeDisabled();
  });

  it('updates provider selection', () => {
    render(<AISettingsForm />);

    const providerSelect = screen.getByLabelText('AI Provider');
    fireEvent.change(providerSelect, { target: { value: 'google' } });

    expect(providerSelect).toHaveValue('google');
  });

  it('shows description text for reasoning parameters', () => {
    vi.mocked(useAISettings).mockReturnValue({
      settings: { ...defaultSettings, provider: 'openai', model: 'gpt-5.2' },
      isLoading: false,
      error: null,
      updateSettings: mockUpdateSettings,
      refetch: vi.fn(),
    });

    render(<AISettingsForm />);

    expect(screen.getByText(/controls how much time gpt-5.2 spends thinking/i)).toBeInTheDocument();
  });
});
