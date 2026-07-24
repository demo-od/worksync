import { z } from 'zod';

export const sendInviteSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        role: z.enum(['ADMIN', 'MEMBER']).optional(),
    }),
    params: z.object({
        workspaceId: z.string().uuid('Invalid workspace ID'),
    }),
});

export const respondToInviteSchema = z.object({
    body: z.object({
        action: z.enum(['ACCEPT', 'REJECT']),
    }),
    params: z.object({
        notificationId: z.string().uuid('Invalid notification ID'),
    }),
});