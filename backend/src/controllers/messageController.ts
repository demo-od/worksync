import { Response } from 'express';
import { db } from '../db/index.js';
import { messages, users } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { io } from '../index.js'; // 🎯 Import our real-time Socket manager!

// 1. SEND A NEW MESSAGE
export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;
        const { content } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'User context unauthenticated.' });
            return;
        }

        const [newMessage] = await db.insert(messages).values({
            content: content as string,
            channelId: channelId as string,
            userId: userId as string,
        }).returning();

        const [sender] = await db.select().from(users).where(eq(users.id, userId));

        const finalPayload = {
            ...newMessage,
            sender: {
                id: sender!.id,
                firstName: sender!.firstName,
                lastName: sender!.lastName,
                profilePicture: sender!.profilePicture
            }
        };

        // ⚡ REAL-TIME BROADCAST:
        // .to(channelId) -> Targets the private virtual room for this channel
        // .emit('message_received', ...) -> Sends the chat data labeled with this custom tag
        io.to(channelId as string).emit('message_received', finalPayload);

        res.status(201).json({
            message: 'Message sent successfully!',
            chatRecord: finalPayload
        });
    } catch (error) {
        console.error('Error recording message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 2. GET CHANNEL CHAT HISTORY
export const getChannelMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId } = req.params;

        const chatLogs = await db
            .select({
                id: messages.id,
                content: messages.content,
                channelId: messages.channelId,
                createdAt: messages.createdAt,
                isEdited: messages.isEdited,
                sender: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    profilePicture: users.profilePicture
                }
            })
            .from(messages)
            .leftJoin(users, eq(messages.userId, users.id))
            .where(eq(messages.channelId, channelId as string))
            .orderBy(desc(messages.createdAt));

        res.status(200).json(chatLogs.reverse());
    } catch (error) {
        console.error('Error querying chat logs:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 3. EDIT A MESSAGE (Author Only)
export const updateMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId, messageId } = req.params;
        const { content } = req.body;
        const userId = req.user?.userId;

        const [existingMessage] = await db.select().from(messages).where(eq(messages.id, messageId as string));

        if (!existingMessage) {
            res.status(404).json({ error: 'Message not found.' });
            return;
        }

        if (existingMessage.userId !== userId) {
            res.status(403).json({ error: 'Unauthorized: You can only edit your own messages.' });
            return;
        }

        const [updatedMessage] = await db
            .update(messages)
            .set({
                content: content as string,
                isEdited: true,
                updatedAt: new Date(),
            })
            .where(and(eq(messages.id, messageId as string), eq(messages.channelId, channelId as string)))
            .returning();

        // ⚡ REAL-TIME BROADCAST:
        // Inform the channel room that an existing message has been modified
        io.to(channelId as string).emit('message_updated', updatedMessage);

        res.status(200).json({ message: 'Message updated successfully!', chatRecord: updatedMessage });
    } catch (error) {
        console.error('Error updating message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// 4. DELETE A MESSAGE (Author Only)
export const deleteMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { channelId, messageId } = req.params;
        const userId = req.user?.userId;

        const [existingMessage] = await db.select().from(messages).where(eq(messages.id, messageId as string));

        if (!existingMessage) {
            res.status(404).json({ error: 'Message not found.' });
            return;
        }

        if (existingMessage.userId !== userId) {
            res.status(403).json({ error: 'Unauthorized: You can only delete your own messages.' });
            return;
        }

        await db
            .delete(messages)
            .where(and(eq(messages.id, messageId as string), eq(messages.channelId, channelId as string)));

        // ⚡ REAL-TIME BROADCAST:
        // Pass the messageId down so the frontend can instantly drop it from view
        io.to(channelId as string).emit('message_deleted', { messageId });

        res.status(200).json({ message: 'Message deleted successfully!' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};