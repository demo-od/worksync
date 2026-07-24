import React, {useState, useEffect, useRef} from 'react';
import {io, Socket} from 'socket.io-client';
import {apiClient} from '../api/client.ts';
import type {ChatViewProps} from "../types";

interface SenderProfile {
    id: string;
    firstName: string;
    lastName: string;
    profilePicture: string | null;
}

interface Message {
    id: string;
    content: string;
    channelId: string;
    createdAt: string;
    isEdited: boolean;
    sender: SenderProfile;
}

export const ChatView = ({
                             channelId,
                             channelName,
                             workspaceId,         // Ensure this is passed down from Dashboard.tsx
                             currentUserRole,     // Ensure role string is passed down ('Owner' | 'Admin' | 'Member')
                             onChannelMutated     // Callback block inside Dashboard to refresh sidebar lists and pop view contexts
                         }: ChatViewProps & {
    workspaceId: string;
    currentUserRole: string;
    onChannelMutated: () => void;
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [typedText, setTypedText] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Settings panel UI management states
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [editChannelName, setEditChannelName] = useState(channelName);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Mobile & Tap state track index
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Typing system tracker states
    const [activeTypers, setActiveTypers] = useState<{ [socketId: string]: string }>({});
    const typingTimeoutRef = useRef<{ [channelId: string]: ReturnType<typeof setTimeout> }>({});

    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const userProfile = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = userProfile?.id;
    const currentUserFirstName = userProfile?.firstName || 'Someone';

    const isAuthorizedToManage = currentUserRole === 'Owner' || currentUserRole === 'Admin';

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({behavior: 'smooth'});
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                const res = await apiClient.get(`/channels/${channelId}/messages`);
                setMessages(res.data || []);
            } catch (err) {
                console.error("Failed loading chat logs:", err);
            } finally {
                setLoading(false);
                setTimeout(scrollToBottom, 50);
            }
        };
        if (channelId) {
            setIsSettingsOpen(false); // Reset configuration panels on channel change
            fetchHistory();
        }
    }, [channelId]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
        socketRef.current = io(socketUrl);
        socketRef.current.emit('join_channel', channelId);

        socketRef.current.on('message_received', (newMsg: Message) => {
            if (newMsg.channelId === channelId) {
                setMessages(prev => [...prev, newMsg]);
                setTimeout(scrollToBottom, 50);
            }
        });

        socketRef.current.on('message_updated', (updatedRecord: any) => {
            setMessages(prev => prev.map(msg =>
                msg.id === updatedRecord.id ? {...msg, content: updatedRecord.content, isEdited: true} : msg
            ));
        });

        socketRef.current.on('message_deleted', ({messageId}: { messageId: string }) => {
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
        });

        socketRef.current.on('user_typing_received', ({firstName, isTyping, socketId}) => {
            setActiveTypers(prev => {
                const updated = {...prev};
                if (isTyping) {
                    updated[socketId] = firstName;
                } else {
                    delete updated[socketId];
                }
                return updated;
            });
            setTimeout(scrollToBottom, 30);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.off('message_received');
                socketRef.current.off('message_updated');
                socketRef.current.off('message_deleted');
                socketRef.current.off('user_typing_received');
                socketRef.current.disconnect();
            }
        };
    }, [channelId]);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTypedText(e.target.value);

        if (socketRef.current) {
            socketRef.current.emit('user_typing', {channelId, firstName: currentUserFirstName, isTyping: true});

            if (typingTimeoutRef.current[channelId]) {
                clearTimeout(typingTimeoutRef.current[channelId]);
            }

            typingTimeoutRef.current[channelId] = setTimeout(() => {
                socketRef.current?.emit('user_typing', {channelId, firstName: currentUserFirstName, isTyping: false});
            }, 2000);
        }
    };

    const handleSendMessage = async () => {
        if (!typedText.trim()) return;
        try {
            if (typingTimeoutRef.current[channelId]) clearTimeout(typingTimeoutRef.current[channelId]);
            socketRef.current?.emit('user_typing', {channelId, firstName: currentUserFirstName, isTyping: false});

            const textToSubmit = typedText.trim();
            setTypedText('');
            await apiClient.post(`/channels/${channelId}/messages`, {content: textToSubmit});
        } catch (err) {
            console.error("Failed sending message:", err);
        }
    };

    const handleSaveEdit = async (messageId: string) => {
        if (!editText.trim()) return;
        try {
            setIsSavingEdit(true);
            await apiClient.patch(`/channels/${channelId}/messages/${messageId}`, {content: editText.trim()});
            setEditingMessageId(null);
            setEditText('');
            setActiveMenuId(null);
        } catch (err) {
            console.error("Failed executing patch updates:", err);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await apiClient.delete(`/channels/${channelId}/messages/${messageId}`);
            setActiveMenuId(null);
        } catch (err) {
            console.error(err);
        }
    };

    // 🎯 Save Channel Settings Mutation
    const handleUpdateChannelSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editChannelName.trim()) return;
        try {
            setIsSavingSettings(true);
            await apiClient.patch(`/workspaces/${workspaceId}/channels/${channelId}`, {
                name: editChannelName.trim().toLowerCase().replace(/\s+/g, '-') // standard clean formatting channel slug names
            });
            setIsSettingsOpen(false);
            onChannelMutated();
        } catch (err) {
            console.error("Error modifying channel parameters:", err);
        } finally {
            setIsSavingSettings(false);
        }
    };

    // 🎯 Delete Channel Sequence
    const handleDeleteChannel = async () => {
        if (!window.confirm(`Are you certain you want to destroy #${channelName}? All conversation tracks inside will be deleted.`)) return;
        try {
            setIsSavingSettings(true);
            await apiClient.delete(`/workspaces/${workspaceId}/channels/${channelId}`);
            setIsSettingsOpen(false);
            onChannelMutated();
        } catch (err) {
            console.error("Error deleting channel item row:", err);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const uniqueTypers = Object.values(activeTypers);

    return (
        <div
            className="flex-1 flex flex-col h-full min-h-0 p-4 md:p-8 max-w-4xl w-full mx-auto justify-between bg-zinc-50 dark:bg-zinc-950">

            {/* Context Heading Control Bar */}
            <div
                className="shrink-0 flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800 select-none">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">#{channelName}</h3>
                    {isAuthorizedToManage && (
                        <button
                            onClick={() => {
                                setEditChannelName(channelName);
                                setIsSettingsOpen(!isSettingsOpen);
                            }}
                            className="text-[10px] font-mono font-medium px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 shadow-2xs transition-colors cursor-pointer"
                        >
                            {isSettingsOpen ? 'close //' : 'settings //'}
                        </button>
                    )}
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Stream Synchronized</span>
            </div>

            {isSettingsOpen ? (
                /* Inline Channel Settings Form view pane */
                <div
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm max-w-xl w-full mx-auto animate-in fade-in zoom-in-95 duration-150 flex flex-col justify-between mb-4">
                    <form onSubmit={handleUpdateChannelSettings} className="space-y-4">
                        <div>
                            <label
                                className="block text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Channel
                                Reference Name</label>
                            <input
                                type="text" value={editChannelName} onChange={(e) => setEditChannelName(e.target.value)}
                                required disabled={isSavingSettings}
                                className="w-full text-xs rounded-xl px-3 py-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                            />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <button type="submit" disabled={isSavingSettings || !editChannelName.trim()}
                                    className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-xs font-medium px-4 py-2 rounded-xl transition-opacity disabled:opacity-40 cursor-pointer">
                                {isSavingSettings ? 'Saving changes...' : 'Save Settings'}
                            </button>
                            <button type="button" onClick={() => setIsSettingsOpen(false)} disabled={isSavingSettings}
                                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                                Cancel
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800/60">
                        <h4 className="text-xs font-semibold text-red-500">Danger Zone</h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Purging this channel wipes the dialogue message
                            logs data grid instantly.</p>
                        <button
                            type="button"
                            disabled={isSavingSettings}
                            onClick={handleDeleteChannel}
                            className="mt-3 text-xs font-medium px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-950/40 dark:text-red-400 dark:hover:bg-red-950/10 rounded-xl transition-all cursor-pointer"
                        >
                            Delete Channel Stream
                        </button>
                    </div>
                </div>
            ) : (
                /* Primary Stream View Logs wrapper */
                <>
                    <div className="flex-1 overflow-y-auto min-h-0 mb-4 flex flex-col custom-scrollbar space-y-4 pr-1">
                        <div
                            className="text-center py-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/40 p-6 select-none shrink-0">
                            <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">End of Encrypted
                                Stream</p>
                            <p className="text-xs text-zinc-500 mt-1">This is the start of the #{channelName} channel
                                context chain.</p>
                        </div>

                        {!loading && messages.map((msg) => {
                            const isSelf = msg.sender?.id === currentUserId;
                            const isBeingEdited = editingMessageId === msg.id;
                            const isMenuOpen = activeMenuId === msg.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col text-xs animate-in fade-in duration-100 ${
                                        isSelf ? 'items-end' : 'items-start'
                                    }`}
                                >
                                    <div
                                        className={`flex items-end gap-2.5 max-w-[85%] sm:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {!isSelf && (
                                            <div
                                                className="h-6 w-6 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-600 dark:text-zinc-400 shrink-0 uppercase select-none mb-1">
                                                {msg.sender?.firstName?.charAt(0) || '?'}
                                            </div>
                                        )}

                                        <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                            <div className="group relative flex items-center gap-2">
                                                {isBeingEdited ? (
                                                    <div
                                                        className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-xs animate-in fade-in duration-100">
                                                        <input
                                                            type="text"
                                                            value={editText}
                                                            disabled={isSavingEdit}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-70"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !isSavingEdit) handleSaveEdit(msg.id);
                                                                if (e.key === 'Escape') {
                                                                    setEditingMessageId(null);
                                                                    setActiveMenuId(null);
                                                                }
                                                            }}
                                                        />
                                                        <button
                                                            onClick={() => handleSaveEdit(msg.id)}
                                                            disabled={isSavingEdit || !editText.trim()}
                                                            className="text-[10px] px-2 py-1 bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 rounded font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 select-none whitespace-nowrap"
                                                        >
                                                            {isSavingEdit ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            disabled={isSavingEdit}
                                                            onClick={() => {
                                                                setEditingMessageId(null);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 disabled:opacity-20 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => setActiveMenuId(isMenuOpen ? null : msg.id)}
                                                        className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap shadow-xs cursor-pointer transition-all hover:opacity-90 active:scale-[0.99] select-none ${
                                                            isSelf
                                                                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 rounded-br-xs'
                                                                : 'bg-white text-zinc-900 border border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-50 dark:border-zinc-800 rounded-bl-xs'
                                                        }`}
                                                    >
                                                        {msg.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {isMenuOpen && !isBeingEdited && (
                                        <div
                                            className={`flex items-center gap-2 mt-1 px-1.5 text-[10px] font-mono text-zinc-400 select-none animate-in fade-in duration-100 ${isSelf ? 'text-right justify-end' : 'text-left justify-start'}`}>
                                            {!isSelf && <span
                                                className="font-semibold text-zinc-500">{msg.sender?.firstName}</span>}
                                            <span>{new Date(msg.createdAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}</span>
                                            {msg.isEdited && <span>(edited)</span>}
                                            {isSelf && (
                                                <>
                                                    <span>•</span>
                                                    <button onClick={() => {
                                                        setEditingMessageId(msg.id);
                                                        setEditText(msg.content);
                                                    }}
                                                            className="text-zinc-600 dark:text-zinc-300 hover:underline cursor-pointer">edit
                                                    </button>
                                                    <span>/</span>
                                                    <button onClick={() => handleDeleteMessage(msg.id)}
                                                            className="text-red-500 hover:underline cursor-pointer">delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {uniqueTypers.length > 0 && (
                            <div
                                className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 dark:text-zinc-500 pl-2 py-1 animate-in fade-in duration-150 select-none">
                                <div className="flex items-center gap-1 shrink-0 px-1">
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce"
                                          style={{animationDelay: '0ms'}}/>
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce"
                                          style={{animationDelay: '150ms'}}/>
                                    <span className="h-1 w-1 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce"
                                          style={{animationDelay: '300ms'}}/>
                                </div>
                                <p className="italic">
                                    {uniqueTypers.length === 1
                                        ? `${uniqueTypers[0]} is writing...`
                                        : `${uniqueTypers.length} team members are typing...`}
                                </p>
                            </div>
                        )}

                        <div ref={chatEndRef}/>
                    </div>

                    {/* Chat Text Input Area */}
                    <div
                        className="shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
                        <div className="flex gap-2">
                            <textarea
                                rows={2}
                                value={typedText}
                                onChange={handleTextareaChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder={`Message #${channelName}...`}
                                className="flex-1 resize-none bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!typedText.trim()}
                                className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 text-[11px] font-medium p-2 rounded-md transition-opacity cursor-pointer disabled:opacity-30 h-fit self-end"
                            >
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                     transform="rotate(90)" className="w-4 h-4">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <path
                                            d="M14.4376 15.3703L12.3042 19.5292C11.9326 20.2537 10.8971 20.254 10.525 19.5297L4.24059 7.2971C3.81571 6.47007 4.65077 5.56156 5.51061 5.91537L18.5216 11.2692C19.2984 11.5889 19.3588 12.6658 18.6227 13.0704L14.4376 15.3703ZM14.4376 15.3703L5.09594 6.90886"
                                            stroke="#000000" stroke-width="2" stroke-linecap="round"></path>
                                    </g>
                                </svg>
                            </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono hidden sm:block mt-1">Markdown active //</div>
                    </div>
                </>
            )}
        </div>
    );
};