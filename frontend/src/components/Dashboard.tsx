import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { ChatView } from './ChatView.tsx';
import { TaskTableView } from './TaskTableView.tsx';
import { OverviewView } from './OverviewView.tsx';
import { SettingsView } from './SettingsView.tsx';
import { InboxView } from './InboxView.tsx';
import { AccountSettingsView } from './AccountSettingsView.tsx';
import { useWorkspaceData } from '../hooks/useWorkspaceData.ts';
import { apiClient } from '../api/client.ts';
import type { Workspace, Notification, Task } from "../types";

export const Dashboard = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [createLoading, setCreateLoading] = useState(false);

    // View tracking state variables
    const [isSettingsModeActive, setIsSettingsModeActive] = useState(false);
    const [isInboxModeActive, setIsInboxModeActive] = useState(false);
    const [isAccountModeActive, setIsAccountModeActive] = useState(false);
    const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // 🎯 Live synchronized tracking hook for notifications
    const [globalUnreadCount, setGlobalUnreadCount] = useState<number>(0);
    const [globalNotifications, setGlobalNotifications] = useState<Notification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(true);

    // Core data custom hook fetching engine
    const {
        channels, setChannels,
        projects, setProjects,
        members, loadingMembers,
        currentUserRole, refreshData,
        loadingChannels, loadingProjects
    } = useWorkspaceData(activeWorkspaceId);

    // Dynamic state management array synchronized with your Drizzle Schema
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    const fetchWorkspaces = async () => {
        try {
            setLoadingWorkspaces(true);
            const response = await apiClient.get('/workspaces');
            const data = Array.isArray(response.data) ? response.data : response.data?.workspaces || [];
            const validWorkspaces = data.filter((ws: any) => ws && ws.name);
            setWorkspaces(validWorkspaces);
            if (validWorkspaces.length > 0 && !activeWorkspaceId) {
                setActiveWorkspaceId(String(validWorkspaces[0].id));
            }
        } catch (err) {
            setFetchError('Failed to load workspaces.');
        } finally {
            setLoadingWorkspaces(false);
        }
    };

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    // 🎯 EFFECT LINK: Synchronize task loading with route project selection mutations
    const fetchProjectTasks = async () => {
        if (!activeWorkspaceId || !activeProjectId) return;
        try {
            // Matches parent route structural setup: /api/workspaces/:workspaceId/projects/:projectId/tasks
            const response = await apiClient.get(`/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`);
            setTasks(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Failed fetching core project deliverables array:', err);
            setTasks([]);
        }
    };

    useEffect(() => {
        if (activeProjectId) {
            fetchProjectTasks();
        }
    }, [activeProjectId, activeWorkspaceId]);

    // 🎯 GLOBAL POLL: Fetch notification data globally so badges work everywhere
    const fetchGlobalInbox = async () => {
        try {
            const response = await apiClient.get('/inbox');
            const fetchedNotifs = response.data?.notifications || [];
            setGlobalNotifications(fetchedNotifs);
            setGlobalUnreadCount(response.data.unreadCount as number);
        } catch (err) {
            console.error('Failed global background notification sync:', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    useEffect(() => {
        fetchGlobalInbox();
        const interval = setInterval(fetchGlobalInbox, 10000); // 10s background loop
        return () => clearInterval(interval);
    }, []);

    // Helper to clear out global view overlays when switching contextual states
    const clearGlobalOverlays = () => {
        setIsSettingsModeActive(false);
        setIsInboxModeActive(false);
        setIsAccountModeActive(false);
    };

    // Selection handlers that explicitly turn off conflicting modes
    const handleChannelSelection = (id: any) => {
        const stringId = id ? String(id) : null;
        setActiveChannelId(stringId);
        setActiveProjectId(null);
        clearGlobalOverlays();
    };

    const handleProjectSelection = (id: any) => {
        const stringId = id ? String(id) : null;
        setActiveProjectId(stringId);
        setActiveChannelId(null);
        clearGlobalOverlays();
    };

    const handleWorkspaceSelection = (id: any) => {
        setActiveWorkspaceId(id ? String(id) : null);
        setActiveChannelId(null);
        setActiveProjectId(null);
        clearGlobalOverlays();
    };

    const handleInboxSelection = () => {
        setIsInboxModeActive(true);
        setIsAccountModeActive(false);
        setIsSettingsModeActive(false);
    };

    const handleAccountSelection = () => {
        setIsAccountModeActive(true);
        setIsInboxModeActive(false);
        setIsSettingsModeActive(false);
    };

    const handleWorkspaceSelectionFromInbox = (id: any) => {
        setActiveWorkspaceId(id ? String(id) : null);
        setActiveChannelId(null);
        setActiveProjectId(null);
        setIsInboxModeActive(false);
        setIsAccountModeActive(false);
        setIsSettingsModeActive(false);
    };

    const handleLeaveWorkspace = async () => {
        if (!activeWorkspaceId) return;
        
        // Prevent owners from leaving their own workspace
        if (currentUserRole === 'Owner') {
            setToastMessage('Workspace owners cannot leave their workspace. Please transfer ownership first.');
            setTimeout(() => setToastMessage(null), 4000);
            return;
        }

        const currentWorkspace = workspaces.find(w => String(w.id) === String(activeWorkspaceId));
        const confirmMessage = `Are you sure you want to leave "${currentWorkspace?.name}"?\n\nYou will lose access to all projects, channels, and tasks in this workspace. You can rejoin later if you have the workspace ID.`;

        if (!window.confirm(confirmMessage)) return;

        try {
            await apiClient.post(`/workspaces/${activeWorkspaceId}/leave`);
            setToastMessage('Successfully left the workspace');
            setTimeout(() => setToastMessage(null), 4000);
            
            // Refresh workspaces and switch to first available
            await fetchWorkspaces();
            if (workspaces.length > 0) {
                setActiveWorkspaceId(String(workspaces[0].id));
            } else {
                setActiveWorkspaceId(null);
            }
        } catch (err: any) {
            console.error('Failed to leave workspace:', err);
            const errorMsg = err.response?.data?.error || 'Failed to leave workspace';
            setToastMessage(errorMsg);
            setTimeout(() => setToastMessage(null), 4000);
        }
    };

    const handleCreateWorkspaceSubmit = async (name: string) => {
        try {
            setCreateLoading(true);
            const response = await apiClient.post('/workspaces', { name });
            const ws = response.data?.workspace || response.data;
            if (ws?.id) {
                setWorkspaces(prev => [...prev, ws]);
                setActiveWorkspaceId(String(ws.id));
                return true;
            }
            return false;
        } catch { return false; } finally { setCreateLoading(false); }
    };

    const handleCreateChannelSubmit = async (name: string) => {
        try {
            setCreateLoading(true);
            const response = await apiClient.post(`/workspaces/${activeWorkspaceId}/channels`, { name });
            const chan = response.data?.channel || response.data;
            if (chan?.id) {
                setChannels(prev => [...prev, chan]);
                handleChannelSelection(chan.id);
                return true;
            }
            return false;
        } catch { return false; } finally { setCreateLoading(false); }
    };

    const handleCreateProjectSubmit = async (name: string) => {
        try {
            setCreateLoading(true);
            const response = await apiClient.post(`/workspaces/${activeWorkspaceId}/projects`, { name }).catch(() => apiClient.post('/projects', { name, workspaceId: activeWorkspaceId }));
            const proj = response.data?.project || response.data;
            if (proj?.id) {
                setProjects(prev => [...prev, proj]);
                handleProjectSelection(proj.id);
                return true;
            }
            return false;
        } catch { return false; } finally { setCreateLoading(false); }
    };

    // 🎯 FORM ACTION: Post task object safely to your backend validation schema
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !activeWorkspaceId || !activeProjectId) return;

        try {
            const titleToSubmit = newTaskTitle.trim();
            setNewTaskTitle(''); // Optimistic clear

            await apiClient.post(`/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/tasks`, {
                title: titleToSubmit,
                description: '',
                status: 'TODO',
                priority: 'MEDIUM',
            });

            await fetchProjectTasks(); // Sync refresh tracking view logs
        } catch (err) {
            console.error("Failed recording backend kanban entity track:", err);
        }
    };

    const currentWorkspaceName = workspaces.find(w => String(w.id) === String(activeWorkspaceId))?.name || "Dashboard";
    const currentWorkspaceDescription = workspaces.find(w => String(w.id) === String(activeWorkspaceId))?.description || '';
    const currentChannelName = channels.find(c => String(c.id) === String(activeChannelId))?.name;
    const currentProjectName = projects.find(p => String(p.id) === String(activeProjectId))?.name;

    return (
        <div className="h-screen max-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col md:flex-row overflow-hidden">
            <title>{currentWorkspaceName}</title>
            {toastMessage && (
                <div
                    className="fixed bottom-6 right-6 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 px-4 py-3 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200 flex items-center gap-2 text-xs font-medium z-[10000] animate-in slide-in-from-bottom-4 duration-200">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"/>
                    {toastMessage}
                </div>
            )}
            <Sidebar
                workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} setActiveWorkspaceId={handleWorkspaceSelection} loadingWorkspaces={loadingWorkspaces} fetchError={fetchError} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} handleCreateWorkspaceSubmit={handleCreateWorkspaceSubmit} createLoading={createLoading} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} theme={theme}
                channels={channels} activeChannelId={activeChannelId} setActiveChannelId={handleChannelSelection} loadingChannels={loadingChannels} handleCreateChannelSubmit={handleCreateChannelSubmit}
                projects={projects} activeProjectId={activeProjectId} setActiveProjectId={handleProjectSelection} loadingProjects={loadingProjects} handleCreateProjectSubmit={handleCreateProjectSubmit}
                isInboxModeActive={isInboxModeActive} setInboxModeActive={handleInboxSelection}
                isAccountModeActive={isAccountModeActive} setAccountModeActive={handleAccountSelection}
                unreadCount={globalUnreadCount}
                isJoinModalOpen={isJoinModalOpen} setIsJoinModalOpen={setIsJoinModalOpen}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 select-none flex items-center w-full">
                    <div className="max-w-4xl w-full mx-auto px-4 md:px-8 flex items-center justify-between min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="p-1.5 mr-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg md:hidden cursor-pointer"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                            </button>

                            {isInboxModeActive ? (
                                <span className="font-semibold text-sm">Inbox</span>
                            ) : isAccountModeActive ? (
                                <span className="font-semibold text-sm">Account Settings</span>
                            ) : (
                                <>
                                    <span className="font-semibold text-sm truncate">{currentWorkspaceName}</span>
                                    {activeChannelId && !isSettingsModeActive && (
                                        <>
                                            <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">/</span>
                                            <span className="text-[11px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded-md truncate hidden md:inline">#{currentChannelName || 'general'}</span>
                                        </>
                                    )}
                                    {activeProjectId && !isSettingsModeActive && (
                                        <>
                                            <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">/</span>
                                            <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md truncate hidden md:inline">📁 {currentProjectName || 'project'}</span>
                                        </>
                                    )}
                                    {isSettingsModeActive && (
                                        <>
                                            <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">/</span>
                                            <span className="text-[11px] font-mono font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md hidden md:inline">⚙️ Settings</span>
                                        </>
                                    )}
                                </>
                            )}
                        </div>

                        {!isInboxModeActive && !isAccountModeActive && activeWorkspaceId && (currentUserRole === 'Owner' || currentUserRole === 'Admin') && (
                            <button
                                onClick={() => {
                                    setIsSettingsModeActive(!isSettingsModeActive);
                                    setActiveChannelId(null);
                                    setActiveProjectId(null);
                                }}
                                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                                    isSettingsModeActive
                                        ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-950/20 dark:border-purple-900/40 dark:text-purple-400 font-semibold'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                                }`}
                            >
                                <svg className={`h-3.5 w-3.5 ${isSettingsModeActive ? 'animate-spin-slow' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.443.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span className="hidden sm:inline">Settings</span>
                            </button>
                        )}

                        {!isInboxModeActive && !isAccountModeActive && activeWorkspaceId && currentUserRole === 'Member' && (
                            <button
                                onClick={handleLeaveWorkspace}
                                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>
                                <span className="hidden sm:inline">Leave Workspace</span>
                            </button>
                        )}
                    </div>
                </header>

                <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-950">
                    {isInboxModeActive ? (
                        <InboxView
                            notifications={globalNotifications}
                            loading={loadingNotifications}
                            onMarkAsReadComplete={fetchGlobalInbox}
                            setActiveWorkspaceId={handleWorkspaceSelectionFromInbox}
                        />
                    ) : isAccountModeActive ? (
                        <AccountSettingsView onProfileUpdated={refreshData} />
                    ) : isSettingsModeActive ? (
                        <SettingsView
                            workspaceId={activeWorkspaceId}
                            workspaceName={currentWorkspaceName}
                            currentUserRole={currentUserRole}
                            onWorkspaceUpdated={() => { fetchWorkspaces(); refreshData(); }}
                            onWorkspaceDeleted={async () => {
                                await fetchWorkspaces();
                                refreshData();
                                setIsSettingsModeActive(false);
                                setActiveChannelId(null);
                                setActiveProjectId(null);
                                // Switch to first available workspace after deletion
                                const response = await apiClient.get('/workspaces');
                                const data = Array.isArray(response.data) ? response.data : response.data?.workspaces || [];
                                const validWorkspaces = data.filter((ws: any) => ws && ws.name);
                                if (validWorkspaces.length > 0) {
                                    setActiveWorkspaceId(String(validWorkspaces[0].id));
                                } else {
                                    setActiveWorkspaceId(null);
                                }
                            }}
                        />) : activeChannelId ? (
                        <ChatView
                            channelName={currentChannelName || 'General Channel'}
                            channelId={activeChannelId}
                            workspaceId={activeWorkspaceId!}
                            currentUserRole={currentUserRole || 'Member'}
                            onChannelMutated={async () => {
                                const response = await apiClient.get(`/workspaces/${activeWorkspaceId}/channels`);
                                setChannels(Array.isArray(response.data) ? response.data : response.data?.channels || []);
                                handleWorkspaceSelection(activeWorkspaceId);
                            }}
                        />
                    ) : activeProjectId ? (
                        <TaskTableView
                            workspaceId={activeWorkspaceId!}
                            projectId={activeProjectId!}
                            currentUserRole={currentUserRole || 'Member'}
                            onRefreshTasks={fetchProjectTasks}
                            onProjectMutated={async () => {
                                // 🎯 Refresh projects listed in sidebar list and pop view context safely
                                if (typeof useWorkspaceData === 'function' || projects) {
                                    const response = await apiClient.get(`/workspaces/${activeWorkspaceId}/projects`);
                                    setProjects(Array.isArray(response.data) ? response.data : response.data?.projects || []);
                                }
                                handleWorkspaceSelection(activeWorkspaceId); // Redirects smoothly to Overview dashboard view
                            }}
                            projectName={currentProjectName || 'Project Board'}
                            projectDescription={projects.find(p => String(p.id) === String(activeProjectId))?.description || null}
                            tasks={tasks}
                            newTaskTitle={newTaskTitle}
                            setNewTaskTitle={setNewTaskTitle}
                            onAddTask={handleAddTask}
                        />
                    ) : (
                        <OverviewView
                            workspaceId={activeWorkspaceId}
                            description={currentWorkspaceDescription}
                            workspaceName={currentWorkspaceName}
                            members={members}
                            loadingMembers={loadingMembers}
                        />
                    )}
                </div>
            </div>

            {/* Join Workspace Modal */}
            {isJoinModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Join a workspace</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter the workspace ID to join an existing workspace.</p>
                        </div>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const workspaceId = formData.get('workspaceId') as string;
                                if (!workspaceId?.trim()) return;
                                
                                try {
                                    await apiClient.post('/workspaces/join', { workspaceId: workspaceId.trim() });
                                    setIsJoinModalOpen(false);
                                    window.location.reload();
                                } catch (err: any) {
                                    console.error('Failed to join workspace:', err);
                                    const errorMsg = err.response?.data?.error || err.response?.data?.details?.[0]?.message || 'Failed to join workspace. Please check the workspace ID and try again.';
                                    setToastMessage(errorMsg);
                                    setTimeout(() => setToastMessage(null), 4000);
                                }
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <input
                                    type="text"
                                    name="workspaceId"
                                    placeholder="Workspace ID"
                                    className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 transition-all"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsJoinModalOpen(false)}
                                    className="flex-1 text-sm font-medium px-5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all shadow-sm"
                                >
                                    Join Workspace
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};