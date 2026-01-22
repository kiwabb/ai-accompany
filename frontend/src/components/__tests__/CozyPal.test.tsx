// frontend/src/components/__tests__/CozyPal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import CozyPal from '../CozyPal';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    body: {
      getReader: () => ({
        read: vi.fn()
          .mockResolvedValueOnce({ value: new TextEncoder().encode('Hello'), done: false })
          .mockResolvedValueOnce({ value: new TextEncoder().encode(' World'), done: false })
          .mockResolvedValueOnce({ done: true }),
      }),
    },
  })
);

describe('CozyPal', () => {
  beforeAll(() => {
    vi.stubGlobal('fetch', mockFetch);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('renders the avatar initially', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    expect(screen.getByRole('button', { name: /cozy pal ai avatar/i })).toBeInTheDocument();
  });

  it('opens the chat window when avatar is clicked', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    const avatar = screen.getByRole('button', { name: /cozy pal ai avatar/i });
    fireEvent.click(avatar);
    expect(screen.getByRole('dialog', { name: /cozy pal chat window/i })).toBeInTheDocument();
    expect(screen.getByText(/hello, how can i help you today\?/i)).toBeInTheDocument();
  });

  it('sends a message and receives a streaming response', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: /cozy pal ai avatar/i }));

    const input = screen.getByPlaceholderText(/type your message.../i);
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('closes the chat window when avatar is clicked again', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    const avatar = screen.getByRole('button', { name: /cozy pal ai avatar/i });
    fireEvent.click(avatar); // Open
    
    fireEvent.click(avatar); // Close
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /cozy pal chat window/i })).not.toBeInTheDocument();
    });
  });
});
