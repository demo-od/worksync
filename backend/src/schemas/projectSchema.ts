import { z } from 'zod';

export const createProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Project name is required').max(100),
        description: z.string().max(255).optional(),
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
    }),
});

export const updateProjectSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional(),
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
        projectId: z.string().uuid('Invalid project ID'),
    }),
});

export const getOrDeleteProjectSchema = z.object({
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
        projectId: z.string().uuid('Invalid project ID'),
    }),
});