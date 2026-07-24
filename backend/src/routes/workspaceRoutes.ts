import { Router } from 'express';
import {
    createWorkSpace, deleteWorkspace,
    getUserWorkspaces,
    getWorkspaceById, getWorkspaceMembers,
    updateWorkspace, updateMemberRole,
    joinWorkspace, leaveWorkspace
} from '../controllers/workspaceController.js';
import {requireAuth} from "../middleware/authMiddleware.js";
import {validateRequest} from "../middleware/validateRequest.js";
import {createWorkspaceSchema, getOrDeleteWorkspaceSchema, updateWorkspaceSchema} from "../schemas/workspaceSchema.js";
const router = Router();

router.get('/', requireAuth, getUserWorkspaces);
router.post('/', requireAuth, validateRequest(createWorkspaceSchema), createWorkSpace);
router.post('/join', requireAuth, joinWorkspace);

router.get('/:id', requireAuth, validateRequest(getOrDeleteWorkspaceSchema), getWorkspaceById);
router.patch('/:id', requireAuth, validateRequest(updateWorkspaceSchema), updateWorkspace);
router.delete('/:id', requireAuth, validateRequest(getOrDeleteWorkspaceSchema), deleteWorkspace);
router.post('/:id/leave', requireAuth, leaveWorkspace);
router.get('/:id/members', requireAuth, getWorkspaceMembers);
router.patch('/:workspaceId/members/:memberId', requireAuth, updateMemberRole);

export default router;