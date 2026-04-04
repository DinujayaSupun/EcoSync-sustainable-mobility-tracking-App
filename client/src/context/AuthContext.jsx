import { createContext, useState, useEffect, useContext } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data } = await API.get('/auth/profile');
                setUser(data.user);
            } catch {
                setUser(null);
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        const { data } = await API.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const { data } = await API.get('/auth/profile');
            setUser(data.user);
            return data.user;
        } catch (error) {
            console.error('Failed to refresh profile:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};