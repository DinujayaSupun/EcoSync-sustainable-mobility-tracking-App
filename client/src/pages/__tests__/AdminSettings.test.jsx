import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import AdminSettings from '../AdminSettings';
import {
  ADMIN_SETTINGS_STORAGE_KEY,
  defaultAdminSettings,
} from '../../utils/adminSettings';

describe('AdminSettings', () => {
  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ user: { name: 'Admin User' } }}>
        <MemoryRouter>
          <AdminSettings />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

  beforeEach(() => {
    localStorage.clear();
  });

  it('loads saved settings from localStorage', () => {
    const saved = {
      ...defaultAdminSettings,
      liveFeedRefreshSeconds: 60,
    };
    localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(saved));

    renderPage();

    expect(screen.getByDisplayValue('Every 60 seconds')).toBeInTheDocument();
  });

  it('saves updated settings', () => {
    renderPage();

    fireEvent.change(screen.getByDisplayValue('Every 30 seconds'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    const parsed = JSON.parse(
      localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY) || '{}',
    );

    expect(parsed.liveFeedRefreshSeconds).toBe(15);
    expect(screen.getByText('Settings saved successfully.')).toBeInTheDocument();
  });
});
