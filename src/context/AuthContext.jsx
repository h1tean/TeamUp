import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = 'http://localhost:3000';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [phone, setPhone] = useState(localStorage.getItem('phone') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            setLoading(false);
            return;
        }
        setToken(storedToken);
        fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${storedToken}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('Не авторизовано');
                return res.json();
            })
            .then(data => {
                setUser(data.user);
                setPhone(data.user.phone);
                setIsAuthenticated(true);
            })
            .catch(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('phone');
                setToken(null);
                setIsAuthenticated(false);
            })
            .finally(() => setLoading(false));
    }, []);

    const registerUser = async ({ firstName, lastName, phone: phoneNumber, password, confirmPassword, birthDate }) => {
        try {
            const res = await fetch(`${API_URL}/api/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firstName, lastName, phone: phoneNumber, password, confirmPassword, birthDate })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            setUser(data.user);
            setPhone(phoneNumber);
            localStorage.setItem('phone', phoneNumber);
            return { success: true, userId: data.user.id };
        } catch (err) {
            console.error('AuthContext registerUser error:', err);
            return { success: false, error: err.message };
        }
    };

    const sendCode = async (userId) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            return res.ok;
        } catch (err) {
            console.error('AuthContext sendCode error:', err);
            return false;
        }
    };

    const loginUser = async ({ phone: phoneNumber, password }) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber, password })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            setUser(data.user);
            setPhone(data.user.phone);
            setIsAuthenticated(true);
            setToken(data.token);
            localStorage.setItem('token', data.token);
            localStorage.setItem('phone', data.user.phone);
            return { success: true };
        } catch (err) {
            console.error('AuthContext loginUser error:', err);
            return { success: false, error: err.message };
        }
    };

    const verifyCode = async ({ userId, code }) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error };
            setUser(data.user);
            setPhone(data.user.phone);
            setIsAuthenticated(true);
            setToken(data.token);
            localStorage.setItem('token', data.token);
            localStorage.removeItem('phone');
            return { success: true };
        } catch (err) {
            console.error('AuthContext verifyCode error:', err);
            return { success: false, error: err.message };
        }
    };

    const forgotPassword = async phoneNumber => {
        try {
            const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber })
            });
            const data = await res.json();
            return { success: res.ok, error: data.error };
        } catch (err) {
            console.error('AuthContext forgotPassword error:', err);
            return { success: false, error: err.message };
        }
    };

    const resetPassword = async ({ phone: phoneNumber, code, newPassword }) => {
        try {
            const res = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneNumber, code, newPassword })
            });
            const data = await res.json();
            return { success: res.ok, error: data.error };
        } catch (err) {
            console.error('AuthContext resetPassword error:', err);
            return { success: false, error: err.message };
        }
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        setPhone(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('phone');
    };

    if (loading) return null;

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                token,
                isAuthenticated,
                phone,
                registerUser,
                sendCode,
                loginUser,
                verifyCode,
                forgotPassword,
                resetPassword,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
