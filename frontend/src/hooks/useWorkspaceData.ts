import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client.ts';

import type { Channel } from "../types";
import type { Project } from "../types";

export const useWorkspaceData = (activeWorkspaceId: string | null) => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState<'Owner' | 'Admin' | 'Member'>('Member');
    const [loadingChannels, setLoadingChannels] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // 🎯 A counter that we increment to manually force a re-fetch of workspace data
    const [refreshTick, setRefreshTick] = useState(0);

    const refreshData = useCallback(() => {
        setRefreshTick(prev => prev + 1);
    }, []);

    useEffect(() => {
        // Guard checking if workspaceId is invalid, empty, or set to an action string
        if (!activeWorkspaceId || activeWorkspaceId === 'undefined' || activeWorkspaceId === 'UPDATE') {
            setChannels([]);
            setProjects([]);
            setMembers([]);
            return;
        }

        const fetchWorkspaceData = async () => {
            try {
                setLoadingChannels(true);
                const cRes = await apiClient.get(`/workspaces/${activeWorkspaceId}/channels`);
                setChannels(Array.isArray(cRes.data) ? cRes.data : cRes.data?.channels || []);

                setLoadingProjects(true);
                const pRes = await apiClient.get(`/workspaces/${activeWorkspaceId}/projects`).catch(() => ({ data: [] }));
                setProjects(Array.isArray(pRes.data) ? pRes.data : pRes.data?.projects || []);

                setLoadingMembers(true);
                const mRes = await apiClient.get(`/workspaces/${activeWorkspaceId}/members`).catch(() => ({ data: [] }));
                const memberList = Array.isArray(mRes.data) ? mRes.data : mRes.data?.members || [];
                setMembers(memberList);

                // Safe ID & Role Matching Logic
                const localUser = JSON.parse(localStorage.getItem('user') || '{}');
                const matchedSelf = memberList.find((m: any) => m.id && localUser.id && m.id == localUser.id);

                if (matchedSelf?.role) {
                    const cleanRole = matchedSelf.role.toUpperCase();
                    if (cleanRole === 'OWNER') setCurrentUserRole('Owner');
                    else if (cleanRole === 'ADMIN') setCurrentUserRole('Admin');
                    else setCurrentUserRole('Member');
                } else {
                    setCurrentUserRole('Member');
                }
            } catch (e) {
                console.error("Error synchronizing tracking indices:", e);
            } finally {
                setLoadingChannels(false);
                setLoadingProjects(false);
                setLoadingMembers(false);
            }
        };

        fetchWorkspaceData();
        // Added refreshTick to re-trigger the hook's database call
    }, [activeWorkspaceId, refreshTick]);

    return {
        channels, setChannels,
        projects, setProjects,
        members, loadingMembers,
        currentUserRole,
        loadingChannels, loadingProjects,
        refreshData // 🎯 Expose this trigger
    };
};