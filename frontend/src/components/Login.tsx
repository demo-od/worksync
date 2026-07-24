import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

export const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
    const navigate = useNavigate(); // 2. Initialize the navigate function
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]); // 🎯 Changed from 'error' string to 'errors' array
    const [loading, setLoading] = useState(false);
    const [theme] = useState(localStorage.getItem('theme') || 'dark');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        // Check for registration message from localStorage
        const registrationMessage = localStorage.getItem('registrationMessage');
        if (registrationMessage) {
            setSuccessMessage(registrationMessage);
            // Clear the message after displaying it
            localStorage.removeItem('registrationMessage');
            // Auto-hide the success message after 5 seconds
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]); // Clear old errors on submission
        setLoading(true);

        try {
            const response = await apiClient.post('/auth/login', { email, password });
            localStorage.setItem('worksync_token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            // 1. Turn off loading immediately on success
            setLoading(false);

            // 2. Update parent state
            onLoginSuccess();
            navigate('/dashboard');

        } catch (err: any) {
            // 3. Make sure loading is disabled on failure as well
            setLoading(false);
            const backendData = err.response?.data;

            // 🎯 Drill down to check for details array or fallback error messages
            if (backendData?.details && Array.isArray(backendData.details)) {
                const validationMessages = backendData.details.map((item: any) => item.message);
                setErrors(validationMessages);
            } else if (backendData?.error) {
                setErrors([backendData.error]);
            } else {
                setErrors(['Invalid credentials.']);
            }
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors duration-200 antialiased font-sans">
            <title>Login</title>
            <div className="w-full max-w-[400px] mx-6">

                {/* Card Container */}
                <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">

                    <div className="flex flex-col space-y-1.5 text-center mb-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Welcome to WorkSync
                        </h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your credentials to access your workspaces
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Success message from registration */}
                        {successMessage && (
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 p-5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Registration Successful!</h3>
                                        <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">{successMessage}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span>Check your inbox for the verification email</span>
                                </div>
                            </div>
                        )}

                        {/* 🚨 Clean Modern Error Box mapped with your exact styling preferences */}
                        {errors.length > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-lg border border-red-200/50 dark:border-red-900/30 space-y-1.5">
                                {errors.map((err, idx) => (
                                    <div key={idx} className="flex items-start gap-2 font-medium">
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium leading-none tracking-tight">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="m@example.com"
                                className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 transition-all placeholder:text-zinc-400"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium leading-none tracking-tight">
                                    Password
                                </label>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 transition-all placeholder:text-zinc-400"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* 🔘 Button with conditional loading structure */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 rounded-lg transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-zinc-900 dark:text-zinc-50 font-medium hover:underline">Register</Link>
                    </div>

                </div>
            </div>
        </div>
    );
};