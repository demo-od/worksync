import { Router } from 'express';
import { createTask, getProjectTasks, updateTask, deleteTask } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { requireWorkspaceRole } from '../middleware/roleMiddleware.js';
import { createTaskSchema, updateTaskSchema, getOrDeleteTaskSchema } from '../schemas/taskSchema.js';

// mergeParams lets us grab :workspaceId and :projectId from the parent router chain!
const router = Router({ mergeParams: true });

// Workspace members and higher can read/write tasks
router.post('/', requireAuth, validateRequest(createTaskSchema), requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), createTask);
router.get('/', requireAuth, requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), getProjectTasks);

router.patch('/:taskId', requireAuth, validateRequest(updateTaskSchema), requireWorkspaceRole(['OWNER', 'ADMIN', 'MEMBER']), updateTask);
router.delete('/:taskId', requireAuth, validateRequest(getOrDeleteTaskSchema), requireWorkspaceRole(['OWNER', 'ADMIN']), deleteTask);

export default router;