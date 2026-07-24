import React from "react";

export interface Workspace { id: string; name: string; description: string | null; }
export interface Channel { id: string; name: string; }
export interface Project { id: string; name: string; description: string | null; }

export interface SidebarProps {
    workspaces: Workspace[];
    activeWorkspaceId: string | null;
    setActiveWorkspaceId: (id: string) => void;
    loadingWorkspaces: boolean;
    fetchError: string;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    handleCreateWorkspaceSubmit: (name: string) => Promise<boolean>;
    createLoading: boolean;
    toggleTheme: () => void;
    theme: string;
    unreadCount: number;

    // Channels
    channels: Channel[];
    activeChannelId: string | null;
    setActiveChannelId: (id: string | null) => void;
    loadingChannels: boolean;
    handleCreateChannelSubmit: (name: string) => Promise<boolean>;

    // Projects
    projects: Project[];
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    loadingProjects: boolean;
    handleCreateProjectSubmit: (name: string) => Promise<boolean>;

    // 🎯 Inbox & Account state flags
    isInboxModeActive: boolean;
    setInboxModeActive: () => void;
    isAccountModeActive: boolean;
    setAccountModeActive: () => void;

    // Join workspace modal state
    isJoinModalOpen: boolean;
    setIsJoinModalOpen: (open: boolean) => void;
}

export interface AccordionSectionProps {
    title: string;
    count: number;
    placeholder: string;
    createButtonText: string;
    items: any[];
    activeId: string | null;
    onItemClick: (id: string) => void;
    onSubmit: (name: string) => Promise<boolean>;
    createLoading: boolean;
    showHash?: boolean;
}

export interface ChatViewProps {
    channelName: string;
    channelId: string;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    priority: string;
    projectId: string;
    createdAt: string;
}
export interface SettingsViewProps {
    workspaceId: string | null;
    workspaceName: string;
    currentUserRole: string;
    onWorkspaceDeleted?: () => void;
    onWorkspaceUpdated: () => void;
}

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

export interface TaskTableViewprops {
    projectName: string;
    tasks: Task[];
    newTaskTitle: string;
    setNewTaskTitle: (val: string) => void;
    onAddTask: (e: React.FormEvent) => void;
}

export interface Member {
    id: string;
    name: string;
    email: string;
    role: 'Owner' | 'Admin' | 'Member';
}

export interface OverviewViewProps {
    workspaceId: string | null;
    description: string | null;
    workspaceName: string;
    members: Member[];
    loadingMembers: boolean;
}

export interface InboxViewProps {
    notifications: Notification[];
    loading: boolean;
    onMarkAsReadComplete: () => Promise<void>;
    setActiveWorkspaceId: (id: string) => void;
}