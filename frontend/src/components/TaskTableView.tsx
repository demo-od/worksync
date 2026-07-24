import React, { useState, useMemo } from 'react';
import { apiClient } from '../api/client.ts';
import type { TaskTableViewprops } from "../types";

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH'] as const;

type TaskStatus = typeof STATUS_OPTIONS[number];
type TaskPriority = typeof PRIORITY_OPTIONS[number];

export const TaskTableView = ({
                               projectName,
                               projectDescription,
                               tasks = [],
                               newTaskTitle,
                               setNewTaskTitle,
                               onAddTask,
                               workspaceId,
                               projectId,
                               onRefreshTasks,
                               currentUserRole,
                               onProjectMutated
                           }: TaskTableViewprops & {
    projectDescription: string | null;
    workspaceId: string;
    projectId: string;
    currentUserRole: string;
    onRefreshTasks: () => Promise<void>;
    onProjectMutated: () => void;
}) => {
    // Structural state trackers
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSavingProject, setIsSavingProject] = useState(false);
    const [isProcessingTaskId, setIsProcessingTaskId] = useState<string | null>(null);

    // Project Metadata Edit Form Fields
    const [editProjectName, setEditProjectName] = useState(projectName);
    const [editProjectDesc, setEditProjectDesc] = useState(projectDescription || '');

    // Modal Task Creation Form State
    const [modalTaskTitle, setModalTaskTitle] = useState('');
    const [modalTaskStatus, setModalTaskStatus] = useState<TaskStatus>('TODO');
    const [modalTaskPriority, setModalTaskPriority] = useState<TaskPriority>('MEDIUM');

    // Inline Task Editing Parameters
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [editingStatus, setEditingStatus] = useState<TaskStatus>('TODO');
    const [editingPriority, setEditingPriority] = useState<TaskPriority>('MEDIUM');

    // Global Query Filtering Rules State
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterPriority, setFilterPriority] = useState<string>('ALL');
    const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

    const isAuthorizedToManage = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    // Core Filtering and Sorting Engine Execution
    const processedTasks = useMemo(() => {
        let items = Array.isArray(tasks) ? [...tasks] : [];

        if (filterStatus !== 'ALL') {
            items = items.filter(t => (t.status || 'TODO').toUpperCase() === filterStatus);
        }
        if (filterPriority !== 'ALL') {
            items = items.filter(t => (t.priority || 'MEDIUM').toUpperCase() === filterPriority);
        }

        items.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return sortOrder === 'NEWEST' ? dateB - dateA : dateA - dateB;
        });

        return items;
    }, [tasks, filterStatus, filterPriority, sortOrder]);

    // Task Creation Handler (Uses modal inputs or falls back to props)
    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const titleToSend = modalTaskTitle.trim() || newTaskTitle.trim();
        if (!titleToSend) return;

        try {
            setIsProcessingTaskId('CREATING');
            await apiClient.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, {
                title: titleToSend,
                status: modalTaskStatus,
                priority: modalTaskPriority
            });

            // Clean up state
            setModalTaskTitle('');
            setNewTaskTitle('');
            setModalTaskStatus('TODO');
            setModalTaskPriority('MEDIUM');
            setIsCreateModalOpen(false);
            await onRefreshTasks();
        } catch (err) {
            console.error("Task creation failed:", err);
            // Fallback to parent handler if API endpoint fails
            if (onAddTask) {
                await onAddTask(e);
                setIsCreateModalOpen(false);
            }
        } finally {
            setIsProcessingTaskId(null);
        }
    };

    // Update Task Mutation
    const handleUpdateTask = async (taskId: string) => {
        if (!editingTitle.trim()) return;
        try {
            setIsProcessingTaskId(taskId);
            await apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, {
                title: editingTitle.trim(),
                status: editingStatus,
                priority: editingPriority
            });
            setEditingTaskId(null);
            await onRefreshTasks();
        } catch (err) {
            console.error("Task update failed:", err);
        } finally {
            setIsProcessingTaskId(null);
        }
    };

    // Delete Task Operation
    const handleDeleteTask = async (taskId: string) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            setIsProcessingTaskId(taskId);
            await apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
            await onRefreshTasks();
        } catch (err) {
            console.error("Task deletion failed:", err);
        } finally {
            setIsProcessingTaskId(null);
        }
    };

    // Project Settings Controllers
    const handleUpdateProjectSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editProjectName.trim()) return;
        try {
            setIsSavingProject(true);
            await apiClient.patch(`/workspaces/${workspaceId}/projects/${projectId}`, {
                name: editProjectName.trim(),
                description: editProjectDesc.trim() || null
            });
            setIsSettingsOpen(false);
            onProjectMutated();
        } catch (err) {
            console.error("Failed project update:", err);
        } finally {
            setIsSavingProject(false);
        }
    };

    const handleDeleteProject = async () => {
        if (currentUserRole !== 'Owner') {
            alert("Only the Workspace Owner can delete core projects.");
            return;
        }
        if (!window.confirm(`Are you absolutely sure you want to delete "${projectName}"? This operation cannot be undone.`)) return;

        try {
            setIsSavingProject(true);
            await apiClient.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
            setIsSettingsOpen(false);
            onProjectMutated();
        } catch (err) {
            console.error("Failed deleting project:", err);
        } finally {
            setIsSavingProject(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full min-w-0 p-4 sm:p-6 md:p-8 max-w-4xl mx-auto overflow-y-auto bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-150">

            {/* Context Header Row */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 shrink-0 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{projectName}</h2>
                        {isAuthorizedToManage && (
                            <button
                                onClick={() => {
                                    setEditProjectName(projectName);
                                    setEditProjectDesc(projectDescription || '');
                                    setIsSettingsOpen(!isSettingsOpen);
                                }}
                                className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 shadow-2xs transition-colors cursor-pointer"
                            >
                                {isSettingsOpen ? 'close //' : 'settings //'}
                            </button>
                        )}
                    </div>
                    {projectDescription && !isSettingsOpen && (
                        <p className="text-xs text-zinc-400 mt-0.5 break-words max-w-2xl">{projectDescription}</p>
                    )}
                </div>

                {!isSettingsOpen && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                    >
                        + Create Task
                    </button>
                )}
            </div>

            {/* Inline Project Settings Management Layer Pane */}
            {isSettingsOpen ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs max-w-4xl w-full mx-auto animate-in fade-in zoom-in-95 duration-150 space-y-6">
                    <form onSubmit={handleUpdateProjectSettings} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Project Identity Name</label>
                            <input
                                type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} required disabled={isSavingProject}
                                className="w-full text-xs rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Scope Description Context</label>
                            <textarea
                                rows={3} value={editProjectDesc} onChange={(e) => setEditProjectDesc(e.target.value)} disabled={isSavingProject}
                                className="w-full text-xs rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="submit" disabled={isSavingProject || !editProjectName.trim()} className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 cursor-pointer">
                                {isSavingProject ? 'Saving...' : 'Save Configuration'}
                            </button>
                            <button type="button" onClick={() => setIsSettingsOpen(false)} className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">Cancel</button>
                        </div>
                    </form>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2">
                        <h4 className="text-xs font-semibold text-red-500">Danger Zone</h4>
                        <p className="text-[11px] text-zinc-400">Purging project removes task records permanently.</p>
                        <button
                            type="button"
                            onClick={handleDeleteProject}
                            disabled={isSavingProject || currentUserRole !== 'Owner'}
                            className={`text-xs font-medium px-4 py-2 border rounded-xl transition-all ${
                                currentUserRole === 'Owner'
                                    ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/40 dark:text-red-400 dark:hover:bg-red-950/10 cursor-pointer'
                                    : 'border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700 cursor-not-allowed'
                            }`}
                        >
                            {currentUserRole === 'Owner' ? 'Delete Project Entity' : 'Deletion Restricted (Owners Only)'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">

                    {/* Filters & Sorting Controls */}
                    <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xs">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Status:</span>
                            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                                <option value="ALL">All Statuses</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Priority:</span>
                            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                                <option value="ALL">All Priorities</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 sm:ml-auto">
                            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Created:</span>
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                                <option value="NEWEST">Newest First</option>
                                <option value="OLDEST">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Task Table View */}
                    <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/30 overflow-hidden shadow-2xs flex flex-col">
                        <div className="overflow-x-auto min-h-0 flex-1">
                            <table className="w-full text-left border-collapse table-fixed min-w-[600px]">
                                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider sticky top-0 z-10 select-none">
                                <tr>
                                    <th className="p-3.5 w-2/5">Task Name</th>
                                    <th className="p-3.5 w-1/5">Status</th>
                                    <th className="p-3.5 w-1/5">Priority</th>
                                    <th className="p-3.5 w-1/5">Date Created</th>
                                    <th className="p-3.5 text-right w-32">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="text-xs divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                                {processedTasks.map((task) => {
                                    const isEditing = editingTaskId === task.id;
                                    const isLocked = isProcessingTaskId === task.id;

                                    return (
                                        <tr key={task.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors ${isLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                                            <td className="p-3.5 font-medium text-zinc-900 dark:text-zinc-50 break-words">
                                                {isEditing ? (
                                                    <input
                                                        type="text" value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)}
                                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                                    />
                                                ) : (
                                                    task.title
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                {isEditing ? (
                                                    <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value as TaskStatus)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg px-2 py-1 focus:outline-none">
                                                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                                                        task.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' :
                                                                'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                                    }`}>
                                                            {task.status || 'TODO'}
                                                        </span>
                                                )}
                                            </td>
                                            <td className="p-3.5">
                                                {isEditing ? (
                                                    <select value={editingPriority} onChange={(e) => setEditingPriority(e.target.value as TaskPriority)} className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded-lg px-2 py-1 focus:outline-none">
                                                        {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className={`font-semibold tracking-wide text-[10px] ${
                                                        task.priority === 'HIGH' ? 'text-red-500' :
                                                            task.priority === 'MEDIUM' ? 'text-amber-500' :
                                                                'text-zinc-400'
                                                    }`}>
                                                            {task.priority || 'MEDIUM'}
                                                        </span>
                                                )}
                                            </td>
                                            <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '--'}
                                            </td>
                                            <td className="p-3.5 text-right whitespace-nowrap">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => handleUpdateTask(task.id)} className="text-[11px] font-medium bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 px-2 py-1 rounded-md shadow-2xs cursor-pointer">Save</button>
                                                        <button onClick={() => setEditingTaskId(null)} className="text-[11px] font-medium text-zinc-400 hover:text-zinc-600 cursor-pointer">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2.5">
                                                        <button
                                                            onClick={() => {
                                                                setEditingTaskId(task.id);
                                                                setEditingTitle(task.title);
                                                                setEditingStatus((task.status as TaskStatus) || 'TODO');
                                                                setEditingPriority((task.priority as TaskPriority) || 'MEDIUM');
                                                            }}
                                                            className="text-[11px] font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded bg-white dark:bg-zinc-950 shadow-3xs cursor-pointer"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button onClick={() => handleDeleteTask(task.id)} className="text-[11px] font-medium text-red-500 hover:underline cursor-pointer">
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {processedTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center font-mono text-zinc-400 italic bg-zinc-50/20 dark:bg-zinc-900/5">
                                            No tasks match your current filter selection
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-100">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl max-w-md w-full animate-in zoom-in-95 duration-150 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Create New Task</h3>
                            <p className="text-[11px] text-zinc-400">Add a task and configure its initial status and priority.</p>
                        </div>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">Task Name</label>
                                <input
                                    type="text"
                                    value={modalTaskTitle || newTaskTitle}
                                    onChange={(e) => {
                                        setModalTaskTitle(e.target.value);
                                        setNewTaskTitle(e.target.value);
                                    }}
                                    placeholder="Task title..."
                                    required
                                    className="w-full text-xs rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400 placeholder:text-zinc-400"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</label>
                                    <select value={modalTaskStatus} onChange={(e) => setModalTaskStatus(e.target.value as TaskStatus)} className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1">Priority</label>
                                    <select value={modalTaskPriority} onChange={(e) => setModalTaskPriority(e.target.value as TaskPriority)} className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-700 dark:text-zinc-300 focus:outline-none">
                                        {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-xs font-medium text-zinc-400 hover:text-zinc-600">Cancel</button>
                                <button type="submit" disabled={isProcessingTaskId === 'CREATING' || (!modalTaskTitle.trim() && !newTaskTitle.trim())} className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 cursor-pointer">
                                    {isProcessingTaskId === 'CREATING' ? 'Creating...' : 'Create Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};