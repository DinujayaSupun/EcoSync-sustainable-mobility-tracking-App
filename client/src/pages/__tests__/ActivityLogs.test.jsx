import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ActivityLogs from '../ActivityLogs';
import API from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('ActivityLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and renders activity logs', async () => {
    API.get.mockResolvedValueOnce({
      data: {
        logs: [
          {
            _id: 'log-1',
            createdAt: '2026-04-11T10:00:00.000Z',
            adminName: 'Admin User',
            adminEmail: 'admin@test.com',
            action: 'UPDATE',
            targetType: 'USER',
            targetId: 'u1',
            description: 'Updated user role',
            status: 'SUCCESS',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalLogs: 1,
          logsPerPage: 25,
        },
      },
    });

    render(
      <MemoryRouter>
        <ActivityLogs />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading activity logs...')).toBeInTheDocument();

    expect(await screen.findByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('Updated user role')).toBeInTheDocument();
    expect(screen.getByText('Showing 1-1 of 1')).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith('/admin/activity-logs?page=1&limit=25');
  });

  it('applies filters and sends filtered request', async () => {
    API.get
      .mockResolvedValueOnce({
        data: {
          logs: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalLogs: 0,
            logsPerPage: 25,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          logs: [],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalLogs: 0,
            logsPerPage: 25,
          },
        },
      });

    render(
      <MemoryRouter>
        <ActivityLogs />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(API.get).toHaveBeenCalledTimes(1);
    });

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'UPDATE' } });
    fireEvent.change(selects[1], { target: { value: 'USER' } });

    fireEvent.click(screen.getByRole('button', { name: /apply/i }));

    await waitFor(() => {
      expect(API.get).toHaveBeenLastCalledWith(
        '/admin/activity-logs?page=1&limit=25&action=UPDATE&targetType=USER',
      );
    });
  });

  it('shows API error message when request fails', async () => {
    API.get.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Access denied. Admin privileges required.',
        },
      },
    });

    render(
      <MemoryRouter>
        <ActivityLogs />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Access denied. Admin privileges required.'),
    ).toBeInTheDocument();
  });
});
