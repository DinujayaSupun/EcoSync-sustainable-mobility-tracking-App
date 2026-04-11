import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import UserManagement from '../UserManagement';
import API from '../../api/axios';

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UserManagement', () => {
  const users = [
    {
      _id: 'u1',
      name: 'Alice Admin',
      email: 'alice@test.com',
      role: 'admin',
      faculty: 'Engineering',
    },
    {
      _id: 'u2',
      name: 'Bob User',
      email: 'bob@test.com',
      role: 'user',
      faculty: 'Science',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    API.get.mockResolvedValue({ data: users });
  });

  it('loads and renders user list', async () => {
    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('Bob User')).toBeInTheDocument();
    expect(API.get).toHaveBeenCalledWith('/admin/users');
  });

  it('updates a user role via modal', async () => {
    API.put.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>,
    );

    await screen.findByText('Bob User');

    const editButtons = screen.getAllByTitle('Edit Role');
    fireEvent.click(editButtons[1]);

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /update role/i }));

    await waitFor(() => {
      expect(API.put).toHaveBeenCalledWith('/admin/users/u2', { role: 'admin' });
    });

    expect(
      await screen.findByText("Successfully updated Bob User's role to admin"),
    ).toBeInTheDocument();
  });

  it('deletes a user when confirmed', async () => {
    API.delete.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <UserManagement />
      </MemoryRouter>,
    );

    await screen.findByText('Bob User');

    const deleteButtons = screen.getAllByTitle('Delete User');
    fireEvent.click(deleteButtons[1]);

    await waitFor(() => {
      expect(API.delete).toHaveBeenCalledWith('/admin/users/u2');
    });

    expect(
      await screen.findByText('Successfully deleted user: Bob User'),
    ).toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
