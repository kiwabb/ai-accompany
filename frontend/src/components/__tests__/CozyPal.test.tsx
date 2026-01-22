// frontend/src/components/__tests__/CozyPal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CozyPal from '../CozyPal';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

describe('CozyPal', () => {
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

  it('closes the chat window when avatar is clicked again', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <CozyPal />
      </I18nextProvider>
    );
    const avatar = screen.getByRole('button', { name: /cozy pal ai avatar/i });
    fireEvent.click(avatar); // Open
    expect(screen.getByRole('dialog', { name: /cozy pal chat window/i })).toBeInTheDocument();
    
    fireEvent.click(avatar); // Close
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /cozy pal chat window/i })).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
