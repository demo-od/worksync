import { Router } from 'express';
import {
    createProject,
    getWorkspaceProjects,
    updateProject,
    deleteProject,
    getProjectById
} from '../controllers/projectController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireWorkspaceRole } from '../middleware/roleMiddleware.js';
import { createProjectSchema, updateProjectSchema, getOrDeleteProjectSchema } from '../schemas/projectSchema.js';

const router = Router({ mergeParams: true });

router.post('/', requireAuth, validateRequest(createProjectSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), createProject);
router.get('/', requireAuth, requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), getWorkspaceProjects);

// Update: Requires Admin or Owner status
router.patch('/:projectId', requireAuth, validateRequest(updateProjectSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), updateProject);

router.get('/:projectId', requireAuth, validateRequest(getOrDeleteProjectSchema), requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), getProjectById);
// Delete: Highly destructive, requires Workspace Owner status
router.delete('/:projectId', requireAuth, validateRequest(getOrDeleteProjectSchema), requireWorkspaceRole(['OWNER']), deleteProject);

export default router;