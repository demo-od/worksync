import { Router } from 'express';
import { sendMessage, getChannelMessages, updateMessage, deleteMessage } from '../controllers/messageController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
    createMessageSchema,
    deleteMessageSchema,
    getMessagesSchema,
    updateMessageSchema
} from '../schemas/messageSchema.js';

const router = Router();

// Manage chat streams inside a target channel scope
router.post('/:channelId/messages', requireAuth, validateRequest(createMessageSchema), sendMessage);
router.get('/:channelId/messages', requireAuth, validateRequest(getMessagesSchema), getChannelMessages);
router.patch('/:channelId/messages/:messageId', requireAuth, validateRequest(updateMessageSchema), updateMessage);
router.delete('/:channelId/messages/:messageId', requireAuth, validateRequest(deleteMessageSchema), deleteMessage);
export default router;