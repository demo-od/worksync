import { Router } from "express";
import { createChannel, deleteChannel, getWorkspaceChannels, updateChannel, getChannelById } from '../controllers/channelController.js';
import { requireAuth } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createChannelSchema, getOrDeleteChannelSchema, updateChannelSchema } from "../schemas/channelSchema.js";
import { requireWorkspaceRole } from "../middleware/roleMiddleware.js";

const router = Router({ mergeParams: true });

// POST /api/workspaces/:workspaceId/channels
router.post('/', requireAuth, validateRequest(createChannelSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), createChannel);

// GET /api/workspaces/:workspaceId/channels
router.get('/', requireAuth, getWorkspaceChannels);

// GET /api/workspaces/:workspaceId/channels/:channelId (New Single Fetch Route!)
router.get('/:channelId', requireAuth, validateRequest(getOrDeleteChannelSchema), requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), getChannelById);

// PATCH /api/workspaces/:workspaceId/channels/:channelId
router.patch('/:channelId', requireAuth, validateRequest(updateChannelSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), updateChannel);

// DELETE /api/workspaces/:workspaceId/channels/:channelId
router.delete('/:channelId', requireAuth, validateRequest(getOrDeleteChannelSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), deleteChannel);

export default router;