import React from 'react'

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
            setUsers(users.filter(u => u._id !== id)); // Update UI instantly
        }
    };

  return (
    <div>
      
    </div>
  )
}

export default UserManagement
