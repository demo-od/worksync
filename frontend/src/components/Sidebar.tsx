import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client.ts';
import type { SidebarProps, AccordionSectionProps } from '../types';

const SidebarSkeleton = () => (
    <div className="animate-pulse space-y-4 px-2">
        <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-7 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
            <div className="h-7 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
        </div>
    </div>
);

const ChannelProjectSkeleton = () => (
    <div className="animate-pulse space-y-3 px-2">
        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="space-y-2">
            <div className="h-7 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
            <div className="h-7 w-3/4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
            <div className="h-7 w-1/2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg" />
        </div>
    </div>
);

const AccordionSection = ({
                              title, count, placeholder, createButtonText, items, activeId, onItemClick, onSubmit, createLoading, showHash = false
                          }: AccordionSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isCreating && inputRef.current) inputRef.current.focus();
    }, [isCreating]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = showHash ? newName.trim().toLowerCase().replace(/\s+/g, '-') : newName.trim();
        if (!cleanName || createLoading) return;
        if (await onSubmit(cleanName)) {
            setNewName('');
            setIsCreating(false);
        }
    };

    return (
        <nav className="space-y-1">
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between px-2 mb-2 cursor-pointer group select-none"
            >
                <span className="text-[11px] font-medium tracking-wider text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors uppercase">
                    {title} ({count})
                </span>
                <div className="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                    {isExpanded ? (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>
                    ) : (
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {!isCreating && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full text-left text-xs font-medium px-2.5 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800/30 flex items-center gap-2 mb-2 border border-dashed border-zinc-200 dark:border-zinc-800/60 cursor-pointer transition-colors"
                        >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            {createButtonText}
                        </button>
                    )}

                    {isCreating && (
                        <form onSubmit={handleFormSubmit} className="px-1 py-0.5 mb-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                            <div className="relative flex-1">
                                {showHash && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono select-none">#</span>}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={placeholder}
                                    disabled={createLoading}
                                    className={`w-full text-xs rounded-md pr-7 py-1.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-all placeholder:text-zinc-400 ${showHash ? 'pl-5 lowercase' : 'pl-2'}`}
                                    onKeyDown={(e) => { if (e.key === 'Escape') setIsCreating(false); }}
                                />
                                <button
                                    type="submit"
                                    disabled={createLoading || !newName.trim()}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 cursor-pointer transition-colors"
                                >
                                    <svg className="h-3 w-3 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                            <button type="button" onClick={() => setIsCreating(false)} className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1">×</button>
                        </form>
                    )}

                    {items.map((item) => {
                        const isActive = String(item.id) === String(activeId);
                        return (
                            <button
                                key={item.id}
                                onClick={() => onItemClick(item.id)}
                                className={`w-full text-left text-xs font-medium px-2.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                                    isActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/50'
                                }`}
                            >
                                {showHash ? (
                                    <span className="font-mono text-zinc-400 dark:text-zinc-500 text-sm">#</span>
                                ) : (
                                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-zinc-950 dark:bg-zinc-50' : 'bg-transparent border border-zinc-300 dark:border-zinc-700'}`} />
                                )}
                                <span className="truncate">{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </nav>
    );
};

export const Sidebar = ({
                            workspaces, activeWorkspaceId, setActiveWorkspaceId, loadingWorkspaces,
                            isMobileMenuOpen, setIsMobileMenuOpen, handleCreateWorkspaceSubmit, createLoading,
                            toggleTheme, theme,
                            channels, activeChannelId, setActiveChannelId, loadingChannels, handleCreateChannelSubmit,
                            projects = [], activeProjectId, setActiveProjectId, loadingProjects, handleCreateProjectSubmit,
                            isInboxModeActive, setInboxModeActive,
                            isAccountModeActive, setAccountModeActive,
                            unreadCount,
                            setIsJoinModalOpen
                        }: SidebarProps) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const executeSignOut = async () => {
        try {
            setIsLoggingOut(true);
            await apiClient.post('/auth/logout').catch(() => {});
        } catch (err) {
            console.error("Logout request error:", err);
        } finally {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setIsLoggingOut(false);
            window.location.href = '/login';
        }
    };

    return (
        <aside className={`
      fixed inset-y-0 left-0 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-screen z-50 transition-transform duration-200 ease-in-out shrink-0
      md:sticky md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
            <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="font-semibold tracking-tight text-sm px-2 hidden md:block select-none">
                    WorkSync //
                </div>
                <div className="flex items-center justify-between md:hidden px-2">
                    <span className="font-semibold tracking-tight text-sm">WorkSync //</span>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* GLOBAL OVERLAY CORE ACCESS POINTS LAYER */}
                <div className="space-y-1 border-b border-zinc-100 dark:border-zinc-800/60 pb-3 px-1">
                    <button
                        onClick={() => { setInboxModeActive(); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left text-xs font-medium px-2.5 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${isInboxModeActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <div className="flex items-center gap-2">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span>Inbox</span>
                        </div>
                        {unreadCount > 0 && (
                            <span className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold select-none">{unreadCount}</span>
                        )}
                    </button>

                    <button
                        onClick={() => { setAccountModeActive(); setIsMobileMenuOpen(false); }}
                        className={`w-full text-left text-xs font-medium px-2.5 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${isAccountModeActive ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 font-semibold' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/50'}`}
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span>Account Settings</span>
                    </button>

                    <button
                        onClick={() => { setIsJoinModalOpen(true); setIsMobileMenuOpen(false); }}
                        className="w-full text-left text-xs font-medium px-2.5 py-2 rounded-lg flex items-center gap-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                    >
                        <svg className="h-3.5 w-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        <span>Join a workspace</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {loadingWorkspaces ? (
                        <SidebarSkeleton />
                    ) : (
                        <>
                            {/* TRACK 1: WORKSPACES */}
                            <AccordionSection
                                title="Workspaces"
                                count={workspaces.length}
                                placeholder="Space name..."
                                createButtonText="New Workspace"
                                items={workspaces}
                                activeId={isInboxModeActive || isAccountModeActive ? null : activeWorkspaceId}
                                onItemClick={(id) => { setActiveWorkspaceId(id); setIsMobileMenuOpen(false); }}
                                onSubmit={handleCreateWorkspaceSubmit}
                                createLoading={createLoading}
                            />

                            {/* TRACK 2: CHANNELS */}
                            {activeWorkspaceId && !isInboxModeActive && !isAccountModeActive && (
                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                                    {loadingChannels ? (
                                        <ChannelProjectSkeleton />
                                    ) : (
                                        <AccordionSection
                                            title="Channels"
                                            count={channels.length}
                                            placeholder="new-channel"
                                            createButtonText="New Channel"
                                            items={channels}
                                            activeId={activeChannelId}
                                            onItemClick={(id) => { setActiveChannelId(id); setIsMobileMenuOpen(false); }}
                                            onSubmit={handleCreateChannelSubmit}
                                            createLoading={createLoading}
                                            showHash={true}
                                        />
                                    )}
                                </div>
                            )}

                            {/* TRACK 3: PROJECTS */}
                            {activeWorkspaceId && !isInboxModeActive && !isAccountModeActive && (
                                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50">
                                    {loadingProjects ? (
                                        <ChannelProjectSkeleton />
                                    ) : (
                                        <AccordionSection
                                            title="Projects"
                                            count={projects.length}
                                            placeholder="Project name..."
                                            createButtonText="New Project"
                                            items={projects}
                                            activeId={activeProjectId}
                                            onItemClick={(id) => { setActiveProjectId(id); setIsMobileMenuOpen(false); }}
                                            onSubmit={handleCreateProjectSubmit}
                                            createLoading={createLoading}
                                        />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900">
                <button
                    onClick={executeSignOut}
                    disabled={isLoggingOut}
                    className="text-xs font-medium text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 py-1.5 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                    {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </button>
                <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer">
                    {theme === 'dark' ? (
                        <svg className="h-[16px] w-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></svg>
                    ) : (
                        <svg className="h-[16px] w-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                    )}
                </button>
            </div>
        </aside>
    );
};