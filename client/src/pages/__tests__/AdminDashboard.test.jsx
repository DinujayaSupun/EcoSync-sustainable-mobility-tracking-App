import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import AdminDashboard from '../AdminDashboard';
import API from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../utils/adminSettings', () => ({
  getAdminSettings: () => ({ liveFeedRefreshSeconds: 30 }),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div data-testid="bar-chart" />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads stats and shows quick actions including audit logs', async () => {
    API.get
      .mockResolvedValueOnce({
        data: {
          totalUsers: 12,
          totalCO2: 45.6,
          activeToday: 4,
          faculties: 3,
          facultyData: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          trips: [
            {
              _id: 'trip-1',
              faculty: 'Engineering',
              co2Saved: 1.2,
              transportMode: 'bus',
              createdAt: new Date().toISOString(),
            },
          ],
        },
      });

    render(
      <AuthContext.Provider
        value={{ user: { name: 'Admin User', email: 'admin@test.com', role: 'admin' }, logout: vi.fn() }}
      >
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();

    expect(await screen.findByText('EcoSync Admin')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('45.6 kg')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
    expect(screen.getByText('Engineering:')).toBeInTheDocument();

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledWith('/admin/stats');
      expect(API.get).toHaveBeenCalledWith('/admin/recent-trips?limit=5');
    });
  });
});
