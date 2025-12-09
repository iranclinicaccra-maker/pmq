import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbQuery } from '../api';
import { logLogin, logLogout } from '../utils/activityLogger';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('pmq_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                setUser(data.user);
                localStorage.setItem('pmq_user', JSON.stringify(data.user));
                // TODO: Log login activity after fixing authentication timing
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Invalid credentials' };
            }
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, message: 'An error occurred during login' };
        }
    };

    const logout = async () => {
        try {
            if (user) {
                await logLogout(user);
            }
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            setUser(null);
            localStorage.removeItem('pmq_user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
