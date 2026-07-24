import { z } from 'zod';

export const createChannelSchema = z.object({
    body: z.object({
        name: z.string().min(1, "Channel name is required").max(30, "Channel name must be 30 characters or less")
            .transform((val) => val.toLowerCase().trim().replace(/\s+/g, '-')),
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace identification token'),
    })
});

export const updateChannelSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(30)
            .transform((val) => val.toLowerCase().trim().replace(/\s+/g, '-'))
            .optional(),
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace identification token'), // 🎯 Added!
        channelId: z.string().uuid('Invalid channel ID'),
    })
});

export const getOrDeleteChannelSchema = z.object({
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace identification token'), // 🎯 Added!
        channelId: z.string().uuid('Invalid channel ID'),
    }),
});