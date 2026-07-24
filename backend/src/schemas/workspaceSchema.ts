import { z } from 'zod';

export const createWorkspaceSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Workspace name must be at least 2 characters long'),
    }),
});

export const getOrDeleteWorkspaceSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid workspace identification token'),
    })
});

export const updateWorkspaceSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(50),
        description: z.string().max(255).nullable().optional().transform(val => val === "" || val === null ? undefined : val),
    }),
    params: z.object({
        id: z.string().uuid('Invalid workspace ID'),
    }),
});