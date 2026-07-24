import React, {useState} from 'react';
import {apiClient} from '../api/client.ts';
import Loader from './Loader';

import type {OverviewViewProps} from "../types";


export const OverviewView = ({workspaceId, description, workspaceName, members, loadingMembers}: OverviewViewProps) => {
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !workspaceId) return;

        try {
            setIsSending(true);
            await apiClient.post(`inbox/workspace/${workspaceId}/invite`, {email: inviteEmail.trim()});
            setToastMessage(`Invitation successfully sent to ${inviteEmail}`);
            setIsInviteOpen(false);
            setInviteEmail('');
        } catch (err: any) {
            if (err.response?.data.details) {
                setToastMessage(err.response.data.details[0].message);
            }
            if (err.response?.data.error && !err.response?.data.details) {
                setToastMessage(err.response.data.error);
            }
            console.error(err);
            setIsInviteOpen(false);
        } finally {
            setIsSending(false);
            setTimeout(() => setToastMessage(null), 4000);
        }
    };

    return (
        <div
            className="flex-1 overflow-y-auto min-h-0 p-4 md:p-8 max-w-4xl w-full mx-auto space-y-8 animate-in fade-in duration-150 relative">
            {toastMessage && (
                <div
                    className="fixed bottom-6 right-6 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 px-4 py-3 rounded-xl shadow-lg border border-zinc-800 dark:border-zinc-200 flex items-center gap-2 text-xs font-medium z-50 animate-in slide-in-from-bottom-4 duration-200">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full"/>
                    {toastMessage}
                </div>
            )}

            <div
                className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{workspaceName}</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">{description && description}</p>
                </div>
                {workspaceId && (
                    <button onClick={() => setIsInviteOpen(true)}
                            className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap self-start sm:self-center">
                        + Invite Member
                    </button>
                )}
            </div>

            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-semibold tracking-tight">Workspace members</h3>
                </div>

                <div
                    className="border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/20">
                    {loadingMembers ? (
                        <div className="p-8 text-center text-xs text-zinc-400 animate-pulse font-mono">// Loading workspace members...</div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                            {members.map((member) => (
                                <div key={member.id} className="p-4 flex items-center justify-between text-xs gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                                            {member.name ? member.name.split(' ').map(n => n[0]).join('') : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{member.name || 'Pending User'}</p>
                                            <p className="text-[11px] text-zinc-400 truncate font-mono">{member.email}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-medium tracking-wider border ${
                                            member.role === 'Owner' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-900/30'
                                                : member.role === 'Admin' ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/30'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-zinc-200 dark:border-zinc-800/60'
                                        }`}>
                                        {member.role || 'Member'}
                                    </span>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <div className="p-8 text-center text-xs text-zinc-400 italic">No team members
                                    loaded.</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/*Modal*/}
            {isInviteOpen && (
                <div
                    className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-sm w-full p-5 shadow-xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">Invite users to workspace</h4>
                            <button onClick={() => setIsInviteOpen(false)}
                                    className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 text-base">×
                            </button>
                        </div>
                        <p className="text-xs text-zinc-500 mb-4">Enter the email address of the user you want to invite.</p>
                        <form onSubmit={handleInviteSubmit} className="space-y-3">
                            <input type="email" required value={inviteEmail}
                                   onChange={(e) => setInviteEmail(e.target.value)}
                                   placeholder="collaborator@company.com"
                                   className="w-full text-xs rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-all placeholder:text-zinc-400"/>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setIsInviteOpen(false)}
                                        className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400">Cancel
                                </button>
                                <button type="submit" disabled={isSending || !inviteEmail.trim()}
                                        className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-40">{isSending ?
                                    (<div className="flex gap-2">
                                        <div className="flex flex-row gap-2">
                                            <Loader />
                                            Sending...
                                        </div>
                                    </div>) : 'Send Invitation'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};