import React from 'react'
import { useState, useEffect } from 'react';
import API from '../api/axios';

const UserManagement = () => {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const res = await API.get('/admin/users');
            setUsers(res.data);
        };
        fetchUsers();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            await API.delete(`/admin/users/${id}`);
            setUsers(users.filter(u => u._id !== id)); 
        }
    };

  return (

    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Link to="/admin" className="flex items-center text-purple-600 hover:text-purple-800 mb-6 transition">
          <ArrowLeft size={20} className="mr-2" />
          Back to Dashboard
        </Link>
        
        <h2 className="text-3xl font-bold text-gray-800 mb-8">User Management</h2>
        
        <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Faculty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u._id}>
                                <td className="px-6 py-4">{u.name}</td>
                                <td className="px-6 py-4">{u.faculty}</td>
                                <td className="px-6 py-4">
                                    <button onClick={() => handleDelete(u._id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
      </div>
    </div>
    <div className="p-8">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                
            </div>
        </div>
  )
}

export default UserManagement
