import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client.ts';
import Loader from './Loader';

export const Register = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        
        // Client-side validation
        if (password !== confirmPassword) {
            setErrors(['Passwords do not match']);
            return;
        }
        
        if (password.length < 6) {
            setErrors(['Password must be at least 6 characters long']);
            return;
        }

        setLoading(true);

        try {
            await apiClient.post('/auth/signup', { firstName, lastName, email, password });
            navigate('/login', { state: { registrationMessage: 'Registration successful! Please check your email to verify your account before logging in.' } });
        } catch (err: any) {
            setLoading(false);
            const backendData = err.response?.data;

            if (backendData?.details && Array.isArray(backendData.details)) {
                const validationMessages = backendData.details.map((item: any) => item.message);
                setErrors(validationMessages);
            } else if (backendData?.error) {
                setErrors([backendData.error]);
            } else {
                setErrors(['Registration processing failure.']);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased font-sans">
            <div className="w-full max-w-[440px] mx-6">

                {/* Card Chassis Block */}
                <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 space-y-6">

                    <div className="flex flex-col space-y-1.5 text-center mb-2">
                        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter your operational details to configure a profile</p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {/* 🚨 Loop over and display multiple errors if they exist */}
                        {errors.length > 0 && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3.5 rounded-lg border border-red-200/50 dark:border-red-900/30 space-y-1.5">
                                {errors.map((err, idx) => (
                                    <div key={idx} className="flex items-start gap-2 font-medium">
                                        {/* 🛑 Small minimalist dash indicator instead of a bulky dot */}
                                        <span>{err}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Split row for names */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Jane"
                                    className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 placeholder:text-zinc-400"
                                    disabled={loading}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Dev"
                                    className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 placeholder:text-zinc-400"
                                    disabled={loading}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 placeholder:text-zinc-400"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 placeholder:text-zinc-400"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-sm rounded-lg px-3 py-2 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-zinc-300/10 placeholder:text-zinc-400"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 h-10 rounded-lg transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <Loader />
                                    <span>Creating your account...</span>
                                </>
                            ) : (
                                'Create account'
                            )}
                        </button>
                    </form>

                    <div className="text-center text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-zinc-900 dark:text-zinc-50 font-medium hover:underline">
                            Sign In
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};