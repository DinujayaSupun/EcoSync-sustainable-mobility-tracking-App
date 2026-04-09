import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const faculties = [
    'Computing',
    'Engineering',
    'Business',
    'Architecture',
    'Humanities',
    'Law',
    'Science',
    'Other',
];

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        faculty: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        return (
            form.name.trim().length > 1 &&
            form.email.trim().length > 3 &&
            form.password.length >= 8 &&
            form.password === form.confirmPassword
        );
    }, [form]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const name = form.name.trim();
        const email = form.email.trim();

        if (name.length < 2) {
            setError('Name should be at least 2 characters long.');
            return;
        }

        if (form.password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);
            await register({
                name,
                email,
                password: form.password,
                faculty: form.faculty || undefined,
            });
            navigate('/home', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-green-100 via-white to-emerald-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <h1 className="text-3xl font-bold text-center text-green-700 mb-2">Create Account</h1>
                <p className="text-center text-gray-600 mb-6">Join EcoSync and start tracking greener commutes.</p>

                {error ? (
                    <div className="mb-4 p-3 text-sm rounded-md border border-red-200 bg-red-50 text-red-700">
                        {error}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            className="w-full p-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Jane Doe"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="w-full p-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-1">Faculty (Optional)</label>
                        <select
                            id="faculty"
                            name="faculty"
                            className="w-full p-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={form.faculty}
                            onChange={handleChange}
                        >
                            <option value="">Select faculty</option>
                            {faculties.map((faculty) => (
                                <option key={faculty} value={faculty}>{faculty}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="w-full p-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            className="w-full p-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Re-enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !canSubmit}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white p-2.5 rounded-md transition font-medium"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600 mt-5">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-700 hover:text-green-800 font-semibold">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;