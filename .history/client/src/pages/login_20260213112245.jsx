import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            alert("Login Successful!");
        } catch (err) {
            alert("Login Failed: " + err.response.data.message);
        }
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white shadow-lg rounded-lg">
                <h2 className="text-2xl mb-4 font-bold">Login to EcoSync</h2>
                <input type="email" placeholder="SLIIT Email" className="w-full p-2 mb-4 border" onChange={(e) => setEmail(e.target.value)} />
                <input type="password" placeholder="Password" className="w-full p-2 mb-4 border" onChange={(e) => setPassword(e.target.value)} />
                <button className="w-full bg-green-600 text-white p-2 rounded">Login</button>
            </form>
        </div>
    );
};

export default Login;