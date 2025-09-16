import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebsiteIntelligenceForm from '../WebsiteIntelligenceForm';

// Mock environment variable
vi.mock('import.meta', () => ({
  env: {
    VITE_API_BASE_URL: 'http://test-api.com'
  }
}));

describe('WebsiteIntelligenceForm', () => {
  const defaultProps = {
    badgeLabel: 'Website Intelligence Agent',
    agentId: 'website-intelligence'
  };

  it('renders form with required fields', () => {
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    expect(screen.getByText('Website Intelligence Agent')).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/website url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of documents/i)).toBeInTheDocument();
    expect(screen.getByTestId('analyze-button')).toBeInTheDocument();
  });

  it('has correct default values', () => {
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const documentsSelect = screen.getByTestId('number-documents-select') as HTMLSelectElement;
    expect(documentsSelect.value).toBe('5');

    const submitButton = screen.getByTestId('analyze-button');
    expect(submitButton).toHaveTextContent('Start Website Intelligence');
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const submitButton = screen.getByTestId('analyze-button');
    await user.click(submitButton);

    // HTML5 validation should prevent submission without required fields
    const companyInput = screen.getByTestId('company-name-input') as HTMLInputElement;
    const urlInput = screen.getByTestId('website-url-input') as HTMLInputElement;

    expect(companyInput.validity.valid).toBe(false);
    expect(urlInput.validity.valid).toBe(false);
  });

  it('allows changing number of documents', async () => {
    const user = userEvent.setup();
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const documentsSelect = screen.getByTestId('number-documents-select');
    await user.selectOptions(documentsSelect, '10');

    expect((documentsSelect as HTMLSelectElement).value).toBe('10');
  });

  it('submits form and shows loading state', async () => {
    const user = userEvent.setup();
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const companyInput = screen.getByTestId('company-name-input');
    const urlInput = screen.getByTestId('website-url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(companyInput, 'Example Company');
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByTestId('loading-dog')).toBeInTheDocument();
    });

    // Button should be disabled and show appropriate text
    expect(submitButton).toBeDisabled();

    // Should show either "Starting..." or "Processing..." text
    const hasStartingText = screen.queryByText('Starting...');
    const hasProcessingText = screen.queryByText('Processing...');
    expect(hasStartingText || hasProcessingText).toBeInTheDocument();
  });

  it('displays result when analysis completes', async () => {
    const user = userEvent.setup();
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const companyInput = screen.getByTestId('company-name-input');
    const urlInput = screen.getByTestId('website-url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(companyInput, 'Example Company');
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    // Wait for the result to appear
    await waitFor(() => {
      expect(screen.getByText(/website intelligence complete/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    // Check that the result link is present
    const resultLink = screen.getByText(/download files/i).closest('a');
    expect(resultLink).toHaveAttribute('href', expect.stringContaining('http'));
  });

  it('handles network errors gracefully', async () => {
    // Mock fetch to throw an error
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const companyInput = screen.getByTestId('company-name-input');
    const urlInput = screen.getByTestId('website-url-input');
    const submitButton = screen.getByTestId('analyze-button');

    await user.type(companyInput, 'Example Company');
    await user.type(urlInput, 'https://example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    // Restore original fetch
    global.fetch = originalFetch;
  });

  it('shows different button text based on status', () => {
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const submitButton = screen.getByTestId('analyze-button');
    expect(submitButton).toHaveTextContent('Start Website Intelligence');
  });

  it('allows document count selection', () => {
    render(<WebsiteIntelligenceForm {...defaultProps} />);

    const documentsSelect = screen.getByTestId('number-documents-select');
    const options = Array.from(documentsSelect.querySelectorAll('option')).map(
      option => option.textContent
    );

    expect(options).toEqual([
      '5 documents',
      '10 documents',
      '15 documents',
      '20 documents'
    ]);
  });
});