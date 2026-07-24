import { useState, useEffect } from 'react';
import { apiClient } from '../api/client.ts';
import type { SettingsViewProps, Member } from "../types";

export const SettingsView = ({
                                 workspaceId,
                                 workspaceName,
                                 currentUserRole,
                                 onWorkspaceUpdated,
                                 onWorkspaceDeleted
                             }: SettingsViewProps) => {
    const [name, setName] = useState(workspaceName);
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [statusText, setStatusText] = useState('// System tracking modification state active');
    const [members, setMembers] = useState<Member[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const isOwner = currentUserRole?.toUpperCase() === 'OWNER';
    const isAdmin = currentUserRole?.toUpperCase() === 'ADMIN';
    const canManageMembers = isOwner || isAdmin;

    const handleCopyWorkspaceId = async () => {
        if (!workspaceId) return;
        try {
            await navigator.clipboard.writeText(workspaceId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy workspace ID:', err);
        }
    };

    // Fetch single workspace details to load current description string on mounting
    useEffect(() => {
        const fetchWorkspaceDetails = async () => {
            if (!workspaceId) return;
            try {
                const res = await apiClient.get(`/workspaces/${workspaceId}`);
                setName(res.data.name || workspaceName);
                setDescription(res.data.description || '');
            } catch (err) {
                console.error("Failed loading workspace properties:", err);
                setStatusText('// Failed to load additional attributes.');
            }
        };

        fetchWorkspaceDetails();
    }, [workspaceId, workspaceName]);

    // Fetch workspace members
    useEffect(() => {
        const fetchMembers = async () => {
            if (!workspaceId) return;
            try {
                setLoadingMembers(true);
                const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
                setMembers(Array.isArray(res.data) ? res.data : res.data?.members || []);
            } catch (err) {
                console.error("Failed loading workspace members:", err);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchMembers();
    }, [workspaceId]);

    // Update Core Workspace Metadata Parameters
    const handleUpdateWorkspace = async () => {
        if (!name.trim() || !workspaceId) return;
        try {
            setIsSaving(true);
            setStatusText('// Transmitting parameter updates...');

            // 🚀 PATCH matches your backend workspace updates perfectly
            await apiClient.patch(`/workspaces/${workspaceId}`, {
                name: name.trim(),
                description: description.trim() || null
            });

            setStatusText('// Core attributes committed successfully.');

            // 🎯 Fires hook-level refresh (forces re-fetch & updates sidebar name)
            onWorkspaceUpdated();
        } catch (err) {
            console.error(err);
            setStatusText('// Parameter tracking correction failed.');
        } finally {
            setIsSaving(false);
        }
    };

    // Destructive workspace removal block
    const handleDeleteWorkspace = async () => {
        if (!workspaceId) return;
        const confirmMessage = `Are you absolutely sure you want to delete "${workspaceName}"?\n\nThis will instantly destroy all projects, channels, tasks, and historical chat logging frames. This action cannot be undone.`;

        if (!window.confirm(confirmMessage)) return;

        try {
            setIsDeleting(true);
            setStatusText('// Demolishing workspace infrastructure...');

            await apiClient.delete(`/workspaces/${workspaceId}`);

            setStatusText('// Workspace successfully decommissioned.');

            // 🎯 Soft handling: Instead of reloading the page, notify the parent layout to deselect the workspace
            if (onWorkspaceDeleted) {
                onWorkspaceDeleted();
            } else {
                // Fallback: trigger workspace lists reload
                onWorkspaceUpdated();
            }
        } catch (err) {
            console.error("Error deleting workspace:", err);
            setStatusText('// Deletion operation failed.');
            setIsDeleting(false);
        }
    };

    // Leave workspace functionality
    const handleLeaveWorkspace = async () => {
        if (!workspaceId) return;
        const confirmMessage = `Are you sure you want to leave "${workspaceName}"?\n\nYou will lose access to all projects, channels, and tasks in this workspace. You can rejoin later if you have the workspace ID.`;

        if (!window.confirm(confirmMessage)) return;

        try {
            setIsLeaving(true);
            setStatusText('// Leaving workspace...');

            await apiClient.post(`/workspaces/${workspaceId}/leave`);

            setStatusText('// Successfully left the workspace.');

            // Notify parent to deselect the workspace
            if (onWorkspaceDeleted) {
                onWorkspaceDeleted();
            } else {
                onWorkspaceUpdated();
            }
        } catch (err) {
            console.error("Error leaving workspace:", err);
            setStatusText('// Failed to leave workspace.');
            setIsLeaving(false);
        }
    };

    // Update member role
    const handleUpdateMemberRole = async (memberId: string, newRole: 'Owner' | 'Admin' | 'Member') => {
        if (!workspaceId) return;
        
        const member = members.find(m => m.id === memberId);
        if (!member) return;

        const confirmMessage = member.role === newRole 
            ? null 
            : `Are you sure you want to change ${member.name}'s role from ${member.role} to ${newRole}?`;

        if (confirmMessage && !window.confirm(confirmMessage)) return;

        try {
            setUpdatingMemberId(memberId);
            setStatusText('// Updating member role...');

            const response = await apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}`, {
                role: newRole.toUpperCase()
            });

            if (response.data.transferred) {
                setStatusText('// Ownership transferred successfully!');
            } else {
                setStatusText('// Member role updated successfully.');
            }

            // Refresh members list
            const res = await apiClient.get(`/workspaces/${workspaceId}/members`);
            setMembers(Array.isArray(res.data) ? res.data : res.data?.members || []);

            // Refresh workspace data to update current user role if needed
            // Force a complete refresh to update the current user's role in the UI
            onWorkspaceUpdated();
            
            // If ownership was transferred, force page reload to update all UI elements
            if (response.data.transferred) {
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (err) {
            console.error("Error updating member role:", err);
            setStatusText('// Failed to update member role.');
        } finally {
            setUpdatingMemberId(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-150">
            <div className="space-y-1">
                <h2 className="text-xl sm:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Workspace Settings</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Configure workspace metadata, manage members, and control permissions.</p>
            </div>

            {/* Core Settings Block */}
            <div className="space-y-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 shadow-sm">
                <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Workspace Name</label>
                    <input
                        type="text"
                        value={name}
                        disabled={isSaving || isDeleting}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Description</label>
                    <textarea
                        rows={3}
                        value={description}
                        disabled={isSaving || isDeleting}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write a brief overview describing this workspace..."
                        className="w-full text-sm rounded-lg px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-all"
                    />
                </div>

                {isOwner && (
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Workspace ID</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={workspaceId!}
                                disabled
                                className="flex-1 text-sm rounded-lg px-4 py-2.5 bg-zinc-100 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed font-mono transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleCopyWorkspaceId}
                                className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-all cursor-pointer"
                                title={copied ? 'Copied!' : 'Copy workspace ID'}
                            >
                                {copied ? (
                                    <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">{statusText}</span>
                    <button
                        onClick={handleUpdateWorkspace}
                        disabled={isSaving || isDeleting || !name.trim()}
                        className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Danger Zone Block (Strictly visible only to Workspace OWNER) */}
            {isOwner && (
                <div className="border border-red-200/70 dark:border-red-900/50 rounded-xl p-5 sm:p-6 bg-red-50/50 dark:bg-red-950/20 space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">Deleting this workspace will permanently remove all projects, channels, tasks, and chat history. This action cannot be undone.</p>
                    </div>

                    <div className="pt-4 border-t border-red-200 dark:border-red-900/30">
                        <button
                            onClick={handleDeleteWorkspace}
                            disabled={isSaving || isDeleting}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isDeleting ? 'Deleting Workspace...' : 'Delete Workspace'}
                        </button>
                    </div>
                </div>
            )}

            {/* Leave Workspace Block (Visible to non-owners) */}
            {!isOwner && (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 shadow-sm space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Leave Workspace</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">You can leave this workspace at any time. You will lose access to all projects, channels, and tasks.</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                        <button
                            onClick={handleLeaveWorkspace}
                            disabled={isSaving || isLeaving}
                            className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 text-sm font-medium px-5 py-2.5 rounded-lg cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isLeaving ? 'Leaving Workspace...' : 'Leave Workspace'}
                        </button>
                    </div>
                </div>
            )}

            {/* Member Management Block (Visible to Owners and Admins) */}
            {canManageMembers && (
                <div className="space-y-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 bg-white dark:bg-zinc-900/50 shadow-sm">
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Member Management</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage member roles and workspace permissions.</p>
                    </div>

                    {loadingMembers ? (
                        <div className="text-xs text-zinc-400 dark:text-zinc-500 py-4">Loading members...</div>
                    ) : (
                        <div className="space-y-3">
                            {members.map((member) => {
                                const isCurrentUser = member.id === JSON.parse(localStorage.getItem('user') || '{}').id;
                                const memberRole = member.role as 'Owner' | 'Admin' | 'Member';
                                const canModify = canManageMembers && !isCurrentUser && !(memberRole === 'Owner' && !isOwner);
                                
                                return (
                                    <div 
                                        key={member.id} 
                                        className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center text-sm font-semibold text-zinc-600 dark:text-zinc-300 shadow-sm">
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                                    {member.name}
                                                    {isCurrentUser && <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500 font-normal">(You)</span>}
                                                </div>
                                                <div className="text-xs text-zinc-500 dark:text-zinc-400">{member.email}</div>
                                            </div>
                                        </div>
                                        
                                        {canModify ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    value={memberRole}
                                                    onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as 'Owner' | 'Admin' | 'Member')}
                                                    disabled={updatingMemberId === member.id}
                                                    className="text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-zinc-400 dark:focus:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                                                >
                                                    <option value="Member">Member</option>
                                                    <option value="Admin">Admin</option>
                                                    {isOwner && <option value="Owner">Owner</option>}
                                                </select>
                                                {updatingMemberId === member.id && (
                                                    <div className="text-xs text-zinc-400 dark:text-zinc-500">Updating...</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                                                memberRole === 'Owner' 
                                                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400'
                                                    : memberRole === 'Admin'
                                                    ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-400'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                                            }`}>
                                                {memberRole}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};