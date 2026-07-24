import { z } from 'zod';

export const createMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Message content cannot be empty'),
    }),
    params: z.object({
        channelId: z.string().uuid('Invalid channel ID'),
    }),
});

export const getMessagesSchema = z.object({
    params: z.object({
        channelId: z.string().uuid('Invalid channel ID'),
    }),
});

export const updateMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1, 'Message content cannot be empty'),
    }),
    params: z.object({
        channelId: z.string().uuid('Invalid channel ID'),
        messageId: z.string().uuid('Invalid message ID'),
    }),
});

export const deleteMessageSchema = z.object({
    params: z.object({
        channelId: z.string().uuid('Invalid channel ID'),
        messageId: z.string().uuid('Invalid message ID'),
    }),
});