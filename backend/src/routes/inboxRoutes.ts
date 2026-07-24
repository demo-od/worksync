import { Router } from 'express';
import {sendWorkspaceInvitation, getUserInbox, respondToInvitation, ReadAll} from '../controllers/inboxController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireWorkspaceRole } from '../middleware/roleMiddleware.js';
import {sendInviteSchema, respondToInviteSchema} from "../schemas/inboxSchemas.js";
const router = Router();

// 📥 Get current logged-in user's notification feed
router.get('/', requireAuth, getUserInbox);

// 📬 Respond to a specific invitation notification card
router.post('/:notificationId/respond', requireAuth, validateRequest(respondToInviteSchema), respondToInvitation);

// 📨 Send an invitation to someone (Requires Sender to be an ADMIN or OWNER of that Workspace)
router.post('/workspace/:workspaceId/invite', requireAuth, validateRequest(sendInviteSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), sendWorkspaceInvitation);
router.patch('/read-all', requireAuth, ReadAll);

export default router;