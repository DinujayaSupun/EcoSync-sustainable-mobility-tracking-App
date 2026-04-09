import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            // Navigation is handled by App.jsx based on user role
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-lg rounded-lg w-96">
                <h2 className="text-2xl mb-4 font-bold text-center">Login to EcoSync</h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <input 
                    type="email" 
                    placeholder="SLIIT Email" 
                    className="w-full p-2 mb-4 border rounded" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full p-2 mb-4 border rounded" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                />
                <button className="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded transition">Login</button>
                <p className="mt-4 text-sm text-center text-gray-600">
                    New here?{' '}
                    <Link to="/register" className="text-green-700 hover:text-green-800 font-semibold">
                        Create an account
                    </Link>
                </p>
                <p className="mt-2 text-sm text-center text-gray-500">
                    <Link to="/" className="hover:text-gray-700">
                        Back to landing page
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;