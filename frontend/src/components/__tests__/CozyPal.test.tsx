// frontend/src/components/__tests__/CozyPal.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CozyPal from '../CozyPal';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../../i18n/locales/en.json';

const testI18n = i18next.createInstance();
testI18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        if (key === 'cozyPal.placeholder') return 'Type your message...';
        if (key === 'cozyPal.disclaimer') return 'AI can make mistakes. Please verify important info.';
        if (key === 'cozyPal.greeting') return 'Hello, how can I help you today?';
      },
      i18n: testI18n,
    }),
  };
});

vi.mock('../hooks/cozypal/useCozyPalTopics', () => ({
  useCozyPalTopics: vi.fn(() => ({
    topics: [{ id: 1, name: 'Default' }],
    activeTopicId: 1,
    showTopicSelector: false,
    setShowTopicSelector: vi.fn(),
    handleSelectTopic: vi.fn(),
    handleCreateTopic: vi.fn(),
  })),
}));

const defaultProps = {
  themeName: 'Focus',
  phase: 'focus',
  timeLeft: 1500,
  currentLanguage: 'en',
  aiPersona: 'gentle_encourager',
  dailyCompletedPomodoros: 0,
  totalFocusMinutes: 0
};

describe('CozyPal', () => {
  vi.setConfig({ testTimeout: 10000 });
  beforeEach(() => {
    const mockFetch = vi.fn((url: string) => {
      if (url.includes('/api/diagnostics/latest-memory-update')) {
        return Promise.resolve({
          ok: true,
          json: vi.fn(() => Promise.resolve({ messages: [], fragments: [] })),
        });
      }
      if (url.includes('/api/chat/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ messages: [] }),
        });
      }
      if (url.includes('/api/chat/completions')) {
        return Promise.resolve({
          ok: true,
          body: {
            getReader: () => ({
              read: vi.fn()
                .mockResolvedValueOnce({ value: new TextEncoder().encode('Hello'), done: false })
                .mockResolvedValueOnce({ value: new TextEncoder().encode(' World'), done: false })
                .mockResolvedValueOnce({ done: true }),
            }),
          },
        });
      }
      return Promise.reject(new Error('Unhandled mock url: ' + url));
    });

    vi.stubGlobal('fetch', mockFetch);
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the avatar initially', async () => {
    await act(async () => {
      render(
        <I18nextProvider i18n={testI18n}>
          <CozyPal {...defaultProps} />
        </I18nextProvider>
      );
    });
    expect(screen.getByTestId("cozypal-avatar-button")).toBeInTheDocument();
  });

  it('opens the chat window when avatar is clicked', async () => {
    await act(async () => {
      render(
        <I18nextProvider i18n={testI18n}>
          <CozyPal {...defaultProps} />
        </I18nextProvider>
      );
    });
    const avatar = screen.getByTestId("cozypal-avatar-button");
    fireEvent.click(avatar);
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: "Cozy Pal Chat Window" })).toBeInTheDocument();
    });
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'Hello, how can I help you today?';
    })).toBeInTheDocument();
  });

  it('sends a message and receives a streaming response', async () => {
    await act(async () => {
      render(
        <I18nextProvider i18n={testI18n}>
          <CozyPal {...defaultProps} />
        </I18nextProvider>
      );
    });
    fireEvent.click(screen.getByTestId("cozypal-avatar-button"));

    const input = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    const form = screen.getByRole('dialog').querySelector('form');
    if (form) {
      fireEvent.submit(form);
    } else {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    }

    await waitFor(() => {
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('closes the chat window when avatar is clicked again', async () => {
    await act(async () => {
      render(
        <I18nextProvider i18n={testI18n}>
          <CozyPal {...defaultProps} />
        </I18nextProvider>
      );
    });
    const avatar = screen.getByTestId("cozypal-avatar-button");
    fireEvent.click(avatar); // Open
    
    fireEvent.click(avatar); // Close
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: "Cozy Pal Chat Window" })).not.toBeInTheDocument();
    });
  });
});
