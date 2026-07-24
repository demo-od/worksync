import {Response} from 'express';
import {db} from '../db/index.js';
import {inboxNotifications, users, WorkspaceMembers} from '../db/schema.js';
import {eq, and, inArray} from 'drizzle-orm';
import {AuthenticatedRequest} from '../middleware/authMiddleware.js';

// 1. SEND THE WORKSPACE INVITATION TO USER'S INBOX
export const sendWorkspaceInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {workspaceId} = req.params;
        const {email, role} = req.body;
        const senderId = req.user?.userId;

        const [sender] = await db.select().from(users).where(eq(users.id, senderId as string));

        if (sender?.email === email.toLowerCase().trim()) {
            res.status(400).json({error: "You cannot invite yourself to a workspace."});
            return;
        }
        const [targetUser] = await db.select().from(users).where(eq(users.email, email as string));
        if (!targetUser) {
            res.status(404).json({error: 'No WorkSync account found with this email.'});
            return;
        }

        const [existingInvite] = await db.select().from(inboxNotifications).where(
            and(
                eq(inboxNotifications.workspaceId, workspaceId as string),
                eq(inboxNotifications.userId, targetUser.id),
                eq(inboxNotifications.type, 'INVITATION')
            )
        );
        if (existingInvite) {
            res.status(400).json({error: 'An active invitation has already been sent to this user.'});
            return;
        }

        const [existingMember] = await db.select().from(WorkspaceMembers).where(
            and(eq(WorkspaceMembers.workspaceId, workspaceId as string), eq(WorkspaceMembers.userId, targetUser.id))
        );

        if (existingMember) {
            res.status(400).json({error: 'This user is already a member of this workspace.'});
            return;
        }

        await db.insert(inboxNotifications).values({
            userId: targetUser.id,
            type: 'INVITATION',
            title: 'Workspace Invitation',
            message: `${sender!.firstName} ${sender!.lastName} has invited you to join their workspace.`,
            workspaceId: workspaceId as string,
            roleRequested: (role as string) || 'MEMBER',
        });

        res.status(200).json({message: 'Invitation pushed safely to user inbox!'});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

//2. GET USER'S INBOX ITEMS
export const getUserInbox = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;

        const notifications = await db
            .select()
            .from(inboxNotifications)
            .where(eq(inboxNotifications.userId, userId as string))
            .orderBy(inboxNotifications.createdAt);

        // Calculate unread items for the red circle badge count
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({unreadCount, notifications});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
}

// 3. RESPOND TO AN INVITATION (Accept / Reject)
export const respondToInvitation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {notificationId} = req.params;
        const {action} = req.body;
        const userId = req.user?.userId;

        // Fetch the notification item to verify ownership and extract workspace hooks
        const [notification] = await db.select().from(inboxNotifications).where(
            and(eq(inboxNotifications.id, notificationId as string), eq(inboxNotifications.userId, userId as string))
        );

        if (!notification) {
            res.status(404).json({error: 'Notification item not found.'});
            return;
        }

        if (notification.type !== 'INVITATION' || !notification.workspaceId) {
            res.status(400).json({error: 'This notification type cannot be responded to.'});
            return;
        }

        if (action === 'ACCEPT') {
            // Add user to the workspace memberships pool transitionally
            await db.transaction(async (tx) => {
                await tx.insert(WorkspaceMembers).values({
                    workspaceId: notification.workspaceId!,
                    userId: userId as string,
                    role: notification.roleRequested || 'MEMBER',
                });
                // Remove notification card once processed successfully
                await tx.delete(inboxNotifications).where(eq(inboxNotifications.id, notificationId as string));
            });

            res.status(200).json({message: 'Successfully joined the workspace!', workspaceId: notification.workspaceId});
        } else {
            // If REJECT, just trash the notification card quietly
            await db.delete(inboxNotifications).where(eq(inboxNotifications.id, notificationId as string));
            res.status(200).json({message: 'Invitation declined successfully.'});
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Internal Server Error'});
    }
};

export const ReadAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const {notificationIds} = req.body;
        if (!notificationIds || !Array.isArray(notificationIds)) {
            res.status(400).json({
                error: 'Invalid payload context. notificationIds must be an array.'
            });
            return;
        }

        if (notificationIds.length === 0) {
            res.status(200).json({success: true, updatedCount: 0});
            return;
        }

        const currentUserId = (req as any).user?.userId;
        if (!currentUserId) {
            res.status(401).json({error: 'Unauthorized system user context.'});
            return;
        }

        const result = await db
            .update(inboxNotifications)
            .set({isRead: true})
            .where(
                and(
                    eq(inboxNotifications.userId, currentUserId),
                    inArray(inboxNotifications.id, notificationIds)
                )
            );

        res.status(200).json({
            success: true,
            message: 'Notification sync batch tracking update successful.'
        });
    } catch (error) {
        console.error('Database execution error while writing read states:', error);
        res.status(500).json({ error: 'Internal server tracking fault.' });
        return;
    }
}