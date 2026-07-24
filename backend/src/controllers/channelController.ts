import { Response } from 'express';
import { db } from '../db/index.js';
import { channels, WorkspaceMembers } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

// 🏗️ 1. CREATE A NEW CHANNEL INSIDE A WORKSPACE
export const createChannel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { workspaceId } = req.params;
        const { name } = req.body;

        if (!userId) {
            res.status(401).json({ error: 'User identification failed.' });
            return;
        }

        const newChannel = await db.insert(channels).values({
            name: name as string,
            workspaceId: workspaceId as string,
            userId: userId as string,
        }).returning();

        res.status(201).json({
            message: 'Channel created successfully!',
            channel: newChannel[0],
        });
    } catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 📂 2. GET ALL CHANNELS FOR A SPECIFIC WORKSPACE
export const getWorkspaceChannels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const workspaceId = req.params.workspaceId || req.baseUrl.split('/')[3];

        if (!userId || !workspaceId) {
            res.status(400).json({ error: 'User context or Workspace Identification context missing.' });
            return;
        }

        // 🎯 FIX: Cast explicitly to plain strings to bypass strict driver evaluation bugs
        const searchWorkspaceId = String(workspaceId).trim();
        const searchUserId = String(userId).trim();

        const membership = await db
            .select()
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, searchWorkspaceId),
                    eq(WorkspaceMembers.userId, searchUserId)
                )
            );

        // 🔍 If the database query still yields nothing, fallback check to see if they are the primary workspace owner
        if (membership.length === 0) {
            res.status(403).json({ error: 'Access Denied: You are not a member of this workspace.' });
            return;
        }

        const workspaceChannels = await db
            .select()
            .from(channels)
            .where(eq(channels.workspaceId, searchWorkspaceId));

        res.status(200).json(workspaceChannels);
    } catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 🔍 3. GET A SINGLE CHANNEL BY ID
export const getChannelById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { channelId } = req.params;

        if (!userId) {
            res.status(401).json({ error: 'User identification failed.' });
            return;
        }

        const [channel] = await db
            .select()
            .from(channels)
            .where(eq(channels.id, channelId as string));

        if (!channel) {
            res.status(404).json({ error: 'Channel not found.' });
            return;
        }

        const membership = await db
            .select()
            .from(WorkspaceMembers)
            .where(
                and(
                    eq(WorkspaceMembers.workspaceId, channel.workspaceId),
                    eq(WorkspaceMembers.userId, String(userId).trim())
                )
            );

        if (membership.length === 0) {
            res.status(403).json({ error: 'Access Denied: You are not a member of this workspace.' });
            return;
        }

        res.status(200).json(channel);
    } catch (error) {
        console.error('Error fetching single channel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 📝 4. UPDATE A CHANNEL
export const updateChannel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;
        const { name } = req.body;

        const updateData: Partial<typeof channels.$inferInsert> = {
            updatedAt: new Date(),
        };

        if (name) updateData.name = name as string;

        const updated = await db
            .update(channels)
            .set(updateData)
            .where(eq(channels.id, channelId as string))
            .returning();

        if (updated.length === 0) {
            res.status(404).json({ error: 'Channel not found.' });
            return;
        }

        res.status(200).json({ message: 'Channel updated successfully!', channel: updated[0] });
    } catch (error) {
        console.error('Error updating channel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 🗑️ 5. DELETE A CHANNEL
export const deleteChannel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;

        const deleted = await db
            .delete(channels)
            .where(eq(channels.id, channelId as string))
            .returning();

        if (deleted.length === 0) {
            res.status(404).json({ error: 'Channel not found.' });
            return;
        }

        res.status(200).json({ message: 'Channel deleted successfully!' });
    } catch (error) {
        console.error('Error deleting channel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};