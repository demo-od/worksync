import { z } from 'zod';

export const createTaskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Task title is required').max(255),
        description: z.string().max(1000).optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        assigneeIds: z.array(z.string().uuid()).optional(), // 🎯 The array of ticked checkboxes!
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
        projectId: z.string().uuid('Invalid project ID'),
    }),
});

export const updateTaskSchema = z.object({
    body: z.object({
        title: z.string().max(255).optional(),
        description: z.string().max(1000).optional(),
        status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        assigneeIds: z.array(z.string().uuid()).optional(), // Can update assignees too!
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});

export const getOrDeleteTaskSchema = z.object({
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
        projectId: z.string().uuid('Invalid project ID'),
        taskId: z.string().uuid('Invalid task ID'),
    }),
});