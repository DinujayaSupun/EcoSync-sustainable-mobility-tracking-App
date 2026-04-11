import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, UserCog, Mail, Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import API from '../api/axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [createValidationErrors, setCreateValidationErrors] = useState([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    faculty: '',
    role: 'user',
  });
  const [successMessage, setSuccessMessage] = useState('');
  
  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterRole, setFilterRole] = useState('all');

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

  const openCreateModal = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      faculty: '',
      role: 'user',
    });
    setCreateValidationErrors([]);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (isCreating) return;
    setCreateModalOpen(false);
    setCreateValidationErrors([]);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateCreateForm = () => {
    const errors = [];
    const normalizedEmail = createForm.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!createForm.name.trim()) {
      errors.push({ field: 'name', message: 'Name is required' });
    } else if (createForm.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters' });
    }

    if (!normalizedEmail) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!emailRegex.test(normalizedEmail)) {
      errors.push({ field: 'email', message: 'Please enter a valid email' });
    }

    if (!createForm.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (createForm.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    if (createForm.faculty && createForm.faculty.trim().length < 2) {
      errors.push({ field: 'faculty', message: 'Faculty must be at least 2 characters if provided' });
    }

    if (!['user', 'admin'].includes(createForm.role)) {
      errors.push({ field: 'role', message: 'Role must be user or admin' });
    }

    setCreateValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateCreateForm()) return;

    setIsCreating(true);
    setCreateValidationErrors([]);
    setError(null);

    try {
      const payload = {
        name: createForm.name.trim(),
        email: createForm.email.trim().toLowerCase(),
        password: createForm.password,
        faculty: createForm.faculty.trim(),
        role: createForm.role,
      };

      const res = await API.post('/admin/users', payload);

      if (res.data?.success && res.data?.user) {
        setUsers((prev) => [res.data.user, ...prev]);
        setSuccessMessage(`Successfully created user: ${res.data.user.name}`);
        closeCreateModal();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(res.data?.message || 'Create failed');
      }
    } catch (err) {
      console.error('Create Error:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setCreateValidationErrors(err.response.data.errors);
      } else {
        setCreateValidationErrors([
          {
            field: 'general',
            message:
              err.response?.data?.message || err.message || 'Failed to create user',
          },
        ]);
      }
    } finally {
      setIsCreating(false);
    }
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

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.faculty || '').toLowerCase().includes(search)
      );
    }
    
    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }
    
    return filtered;
  }, [users, searchTerm, filterRole]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedUser(null);
    setValidationErrors([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden border border-gray-200">
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-purple-100 text-xs uppercase tracking-wider font-semibold">Admin Panel</p>
              <h2 className="text-3xl font-bold">User Management</h2>
              <p className="text-purple-100 text-sm mt-1">Manage account roles, permissions, and user lifecycle.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={openCreateModal}
                className="inline-flex items-center rounded-lg bg-white px-4 py-2 font-medium text-purple-700 transition hover:bg-purple-50"
              >
                <UserPlus size={16} className="mr-2" />
                Create User
              </button>
              <span className="bg-white/20 text-white px-4 py-1.5 rounded-full text-sm font-semibold border border-white/30">
                {users.length} Total Users
              </span>
              <Link
                to="/admin"
                className="inline-flex items-center bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 font-medium transition"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 border border-green-200 flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Success</p>
              <p className="text-sm">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="ml-auto text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Role Filter */}
            <div className="md:w-48">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users Only</option>
                <option value="admin">Admins Only</option>
              </select>
            </div>
            
            {/* Results Count */}
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-semibold">{filteredUsers.length}</span>
              <span className="ml-1">result{filteredUsers.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
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
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Search size={48} className="mb-3 text-gray-300" />
                          <p className="text-lg font-medium">No users found</p>
                          <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
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
                          {user.faculty || 'N/A'}
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
                            disabled={isDeleting === user._id}
                            className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete User"
                          >
                            {isDeleting === user._id ? (
                              <div className="animate-spin rounded-full h-[18px] w-[18px] border-b-2 border-red-600"></div>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(indexOfLastItem, filteredUsers.length)}</span> of{' '}
                  <span className="font-semibold">{filteredUsers.length}</span> users
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-1 rounded-lg ${
                              pageNumber === currentPage
                                ? 'bg-purple-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2 py-1">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Role Modal */}
        {editModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-100">Role Management</p>
                    <h3 className="mt-1 text-2xl font-bold">Edit User Role</h3>
                    <p className="mt-1 text-sm text-purple-100">Update access level for this account.</p>
                  </div>
                  <button
                    onClick={closeEditModal}
                    disabled={isUpdating}
                    className="rounded-lg border border-white/30 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close edit role modal"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="p-6">
              
              {/* Validation Errors Display */}
              {validationErrors.length > 0 && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 mb-1">Validation Errors:</p>
                      <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    User Name
                  </label>
                  <input
                    type="text"
                    value={selectedUser.name}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Email
                  </label>
                  <input
                    type="text"
                    value={selectedUser.email}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Select Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {newRole !== selectedUser.role && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="text-sm text-amber-900">
                      <span className="font-semibold">Warning:</span> You are changing role from{' '}
                      <span className="inline-block rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-bold uppercase text-white">{selectedUser.role}</span>
                      {' '}to{' '}
                      <span className="inline-block rounded-full bg-purple-700 px-2 py-0.5 text-[11px] font-bold uppercase text-white">{newRole}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleUpdate}
                  disabled={newRole === selectedUser.role || isUpdating}
                  className={`rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center justify-center gap-2 ${
                    newRole === selectedUser.role || isUpdating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                  }`}
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Update Role'
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-purple-100">User Provisioning</p>
                    <h3 className="mt-1 text-2xl font-bold">Create User</h3>
                    <p className="mt-1 text-sm text-purple-100">Add a new user account with role and profile details.</p>
                  </div>
                  <button
                    onClick={closeCreateModal}
                    disabled={isCreating}
                    className="rounded-lg border border-white/30 px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close create user modal"
                  >
                    X
                  </button>
                </div>
              </div>

              <div className="p-6">
                {createValidationErrors.length > 0 && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800 mb-1">Validation Errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      {createValidationErrors.map((error, index) => (
                        <li key={index}>{error.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="create-user-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Name</label>
                    <input
                      id="create-user-name"
                      type="text"
                      value={createForm.name}
                      onChange={(e) => handleCreateFormChange('name', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-user-email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
                    <input
                      id="create-user-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => handleCreateFormChange('email', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="user@university.edu"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-user-password" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Password</label>
                    <input
                      id="create-user-password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) => handleCreateFormChange('password', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-user-faculty" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Faculty</label>
                    <input
                      id="create-user-faculty"
                      type="text"
                      value={createForm.faculty}
                      onChange={(e) => handleCreateFormChange('faculty', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Engineering"
                    />
                  </div>

                  <div>
                    <label htmlFor="create-user-role" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
                    <select
                      id="create-user-role"
                      value={createForm.role}
                      onChange={(e) => handleCreateFormChange('role', e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-800 transition-all focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={closeCreateModal}
                    disabled={isCreating}
                    className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={isCreating}
                    className={`rounded-xl px-5 py-2.5 font-semibold transition-colors flex items-center justify-center gap-2 ${
                      isCreating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;