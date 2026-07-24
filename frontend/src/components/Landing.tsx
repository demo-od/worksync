import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Landing = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    // Handle theme class syncing with document element
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased font-sans flex flex-col justify-between transition-colors duration-200">

            {/* 🧭 Minimal Top Header Navbar */}
            <header className="h-16 px-6 md:px-12 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-3 select-none">

                    <button
                        onClick={toggleTheme}
                        className="h-7 w-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                        title="Toggle theme"
                    >
                        {theme === 'dark' ? (
                            <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                            </svg>
                        ) : (
                            <svg className="h-[15px] w-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                            </svg>
                        )}
                    </button>

                    <span className="font-semibold tracking-tight text-sm">WorkSync//</span>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                        Sign In
                    </Link>
                    <Link to="/register" className="text-xs font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 px-3 py-1.5 rounded-lg transition-all">
                        Get Started
                    </Link>
                </div>
            </header>

            {/* 🎯 Centered Hero / Value Section */}
            <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-2xl mx-auto space-y-6">
                <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-none text-zinc-900 dark:text-zinc-50">
                        Enterprise execution meets real-time velocity.
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-lg mx-auto font-normal leading-relaxed">
                        Streamline workspace operations, manage critical project flows, and collaborate instantly across distributed team nodes.
                    </p>
                </div>

                {/* Quick Action Link Cluster */}
                <div className="flex items-center justify-center gap-3 w-full">
                    <Link to="/register" className="text-sm font-medium bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200 h-10 px-5 rounded-lg flex items-center justify-center transition-all shadow-sm">
                        Create Free Account
                    </Link>
                    <Link to="/login" className="text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 h-10 px-5 rounded-lg flex items-center justify-center transition-all">
                        Access Workspaces
                    </Link>
                </div>
            </main>

            {/* 📋 Minimalist Footer */}
            <footer className="h-14 px-6 md:px-12 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
                <div>© 2026 WorkSync Inc.</div>
                <div className="flex gap-4">
                    <span className="hover:underline cursor-pointer">Terms</span>
                    <span className="hover:underline cursor-pointer">Privacy</span>
                </div>
            </footer>

        </div>
    );
};