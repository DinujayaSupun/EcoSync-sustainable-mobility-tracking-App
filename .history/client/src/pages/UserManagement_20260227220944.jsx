import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, UserCog, Mail } from 'lucide-react';
import API from '../api/axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users from MongoDB Atlas
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await API.get('/admin/users');
        
        if (!res.data || !Array.isArray(res.data)) {
          throw new Error('Invalid response format from server');
        }
        
        setUsers(res.data);
      } catch (err) {
        console.error('Fetch Error:', err);
        
        if (err.response) {
          // Server responded with error status
          if (err.response.status === 401) {
            setError('Unauthorized. Please log in again.');
          } else if (err.response.status === 403) {
            setError('Access denied. Admin privileges required.');
          } else if (err.response.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(err.response.data?.message || 'Failed to load users.');
          }
        } else if (err.request) {
          // Request made but no response
          setError('Network error. Please check your connection.');
        } else {
          // Something else happened
          setError('Failed to load users. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Open Edit Modal
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setValidationErrors([]);
    setEditModalOpen(true);
  };

  // Validate role selection
  const validateRoleUpdate = () => {
    const errors = [];
    
    if (!newRole) {
      errors.push({ field: 'role', message: 'Please select a role' });
    }
    
    if (!['user', 'admin'].includes(newRole)) {
      errors.push({ field: 'role', message: 'Invalid role selected' });
    }
    
    if (newRole === selectedUser.role) {
      errors.push({ field: 'role', message: 'New role must be different from current role' });
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle Role Update (CRUD: Update)
  const handleRoleUpdate = async () => {
    if (!selectedUser || !newRole) return;
    
    // Client-side validation
    if (!validateRoleUpdate()) {
      return;
    }

    setIsUpdating(true);
    setValidationErrors([]);

    try {
      const res = await API.put(`/admin/users/${selectedUser._id}`, { 
        role: newRole 
      });
      
      // Check for successful response
      if (res.data.success) {
        // Update the user in the local state
        setUsers(users.map(user => 
          user._id === selectedUser._id 
            ? { ...user, role: newRole }
            : user
        ));
        
        setSuccessMessage(`Successfully updated ${selectedUser.name}'s role to ${newRole}`);
        setEditModalOpen(false);
        setSelectedUser(null);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(res.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Update Error:', err);
      
      // Handle different types of errors
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            setValidationErrors(data.errors);
          } else {
            setValidationErrors([{ field: 'general', message: data.message || 'Invalid request' }]);
          }
        } else if (status === 401) {
          setValidationErrors([{ field: 'auth', message: 'Session expired. Please login again.' }]);
        } else if (status === 403) {
          setValidationErrors([{ field: 'auth', message: 'Access denied. Admin privileges required.' }]);
        } else if (status === 404) {
          setValidationErrors([{ field: 'user', message: 'User not found.' }]);
        } else if (status === 500) {
          setValidationErrors([{ field: 'server', message: 'Server error. Please try again later.' }]);
        } else {
          setValidationErrors([{ field: 'general', message: data.message || 'Failed to update user role' }]);
        }
      } else if (err.request) {
        setValidationErrors([{ field: 'network', message: 'Network error. Please check your connection.' }]);
      } else {
        setValidationErrors([{ field: 'general', message: err.message || 'An unexpected error occurred' }]);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle User Deletion (CRUD: Delete)
  const handleDelete = async (id) => {
    const userToDelete = users.find(u => u._id === id);
    
    if (!userToDelete) {
      setError('User not found');
      return;
    }
    
    const confirmMessage = `Are you sure you want to delete ${userToDelete.name} (${userToDelete.email})?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsDeleting(id);
    setError(null);

    try {
      const res = await API.delete(`/admin/users/${id}`);
      
      if (res.data.success) {
        // Optimized UI update: filter out the deleted user without re-fetching
        setUsers(users.filter((user) => user._id !== id));
        setSuccessMessage(`Successfully deleted user: ${userToDelete.name}`);
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(res.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete Error:', err);
      
      // Handle different types of errors
      if (err.response) {
        const { status, data } = err.response;
        
        if (status === 400) {
          setError(data.message || 'Invalid user ID');
        } else if (status === 401) {
          setError('Session expired. Please login again.');
        } else if (status === 403) {
          setError('Access denied. Admin privileges required.');
        } else if (status === 404) {
          setError('User not found. They may have already been deleted.');
          // Remove from local state anyway
          setUsers(users.filter((user) => user._id !== id));
        } else if (status === 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.message || 'Failed to delete user');
        }
      } else if (err.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to delete user. Please try again.');
      }
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <Link 
          to="/admin" 
          className="inline-flex items-center text-purple-600 hover:text-purple-800 mb-6 font-medium transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
          <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-semibold">
            {users.length} Total Users
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
            {error}
          </div>
        )}

        {/* Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-20 text-center text-gray-500">Loading users from Atlas...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Faculty</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail size={14} className="mr-2" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                          {user.faculty}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold uppercase ${user.role === 'admin' ? 'text-purple-600' : 'text-gray-500'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => handleEditClick(user)}
                            className="text-gray-400 hover:text-purple-600 transition-colors"
                            title="Edit Role"
                          >
                            <UserCog size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(user._id)} 
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Role Modal */}
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Edit User Role</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="text"
                    value={selectedUser.email}
                    disabled
                    className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {newRole !== selectedUser.role && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Warning:</strong> Changing role from <span className="font-semibold uppercase">{selectedUser.role}</span> to <span className="font-semibold uppercase">{newRole}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={newRole === selectedUser.role}
                  className={`px-5 py-2 rounded-lg font-medium transition-colors ${
                    newRole === selectedUser.role
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;