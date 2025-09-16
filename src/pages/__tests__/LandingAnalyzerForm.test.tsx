import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingAnalyzerForm from '../LandingAnalyzerForm';

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://test-api.com'
  }
}));

describe('LandingAnalyzerForm', () => {
  const defaultProps = {
    badgeLabel: 'Test Analyzer',
    agentId: 'landing'
  };

  it('renders form with required fields', () => {
    render(<LandingAnalyzerForm {...defaultProps} />);

    expect(screen.getByText('Test Analyzer')).toBeInTheDocument();
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByTestId('analyze-button')).toBeInTheDocument();
  });

  it('validates required URL field', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const submitButton = screen.getByTestId('analyze-button');
    await user.click(submitButton);

    // HTML5 validation should prevent submission without URL
    const urlInput = screen.getByTestId('url-input') as HTMLInputElement;
    expect(urlInput.validity.valid).toBe(false);
  });

  it('submits form and shows loading state', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    // Should show loading state - either "Starting..." or "Analyzing..."
    await waitFor(() => {
      expect(screen.getByTestId('loading-dog')).toBeInTheDocument();
    });

    // Button should be disabled and show appropriate text
    expect(submitButton).toBeDisabled();

    // Should show either "Starting..." or "Analyzing..." text
    const hasStartingText = screen.queryByText('Starting...');
    const hasAnalyzingText = screen.queryByText('Analyzing...');
    expect(hasStartingText || hasAnalyzingText).toBeInTheDocument();
  });

  it('displays result when analysis completes', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    // Wait for the result to appear
    await waitFor(() => {
      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check that the result link is present
    const resultLink = screen.getByText(/view pdf report/i).closest('a');
    expect(resultLink).toHaveAttribute('href', 'https://test-result.com/report.pdf');
  });

  it('handles network errors gracefully', async () => {
    // Mock fetch to throw an error
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('disables submit button during processing', async () => {
    const user = userEvent.setup();
    render(<LandingAnalyzerForm {...defaultProps} />);

    const urlInput = screen.getByTestId('url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    // Button should be disabled while processing
    expect(submitButton).toBeDisabled();
  });

  it('shows different button text based on status', () => {
    render(<LandingAnalyzerForm {...defaultProps} />);

    const submitButton = screen.getByTestId('analyze-button');
    expect(submitButton).toHaveTextContent('Analyze Landing Page');
  });
});