import React, { useState } from 'react';
import { apiClient } from '../api/client.ts';
import type { Notification, InboxViewProps } from "../types";

export const InboxView = ({ setActiveWorkspaceId, notifications, loading, onMarkAsReadComplete }: InboxViewProps) => {
    // Tracking processing states per notification ID to prevent double-clicking
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleInvitationResponse = async (notificationId: string, action: 'ACCEPT' | 'REJECT') => {
        try {
            setProcessingId(notificationId);

            // 🎯 POST execution matching your backend route design
            const response = await apiClient.post(`/inbox/${notificationId}/respond`, { action });

            console.log(response);

            setActiveWorkspaceId(response.data.workspaceId);

            // Re-sync global states inside Dashboard.tsx to update counts and arrays
            await onMarkAsReadComplete();
        } catch (err) {
            console.error(`Failed to dispatch ${action} decision:`, err);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 max-w-4xl w-full mx-auto animate-in fade-in duration-200">
            <div className="flex items-center gap-2 mb-6 select-none border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <h1 className="text-base font-semibold tracking-tight">Inbox</h1>
            </div>

            {loading ? (
                <div className="space-y-3 animate-pulse">
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-full" />
                    <div className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-xl w-full" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center p-6 bg-white dark:bg-zinc-900/20">
                    <span className="text-xl mb-2 select-none">✨</span>
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50">You're all caught up</p>
                    <p className="text-[11px] text-zinc-400 max-w-xs mt-1 leading-relaxed">
                        When nodes or team structures dispatch event notifications, they will surface directly inside this center flow context.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className="p-4 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col gap-2"
                        >
                            <div className="flex items-start justify-between gap-4 min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    {(!notif.isRead) && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" title="Unread notice" />
                                    )}
                                    <span className={`font-medium text-sm text-zinc-900 dark:text-zinc-50 truncate ${notif.isRead ? 'pl-4' : ''}`}>
                                        {notif.title}
                                    </span>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap shrink-0 mt-0.5">
                                    {new Date(notif.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed pl-4">
                                {notif.message}

                                {notif.type === 'INVITATION' && (
                                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                                        <button
                                            disabled={processingId !== null}
                                            onClick={() => handleInvitationResponse(notif.id, 'ACCEPT')}
                                            className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-[11px] font-medium px-3 py-1.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                        >
                                            {processingId === notif.id ? 'Processing...' : 'Accept Invitation'}
                                        </button>
                                        <button
                                            disabled={processingId !== null}
                                            onClick={() => handleInvitationResponse(notif.id, 'REJECT')}
                                            className="bg-zinc-50 text-zinc-600 border border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-300 dark:border-zinc-800 text-[11px] font-medium px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};