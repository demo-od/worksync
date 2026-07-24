import { Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { WorkspaceMembers } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';
import { AuthenticatedRequest } from './authMiddleware.js';

export const requireWorkspaceRole = (allowedRoles: ('OWNER' | 'ADMIN' | 'MEMBER')[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.userId;
            const { workspaceId } = req.params; // 🎯 Confirmed present thanks to Zod update!

            if (!userId || !workspaceId) {
                res.status(400).json({ error: 'Missing user authentication or workspace validation token.' });
                return;
            }

            // Query the user's membership entry for this specific workspace
            const [membership] = await db
                .select()
                .from(WorkspaceMembers)
                .where(
                    and(
                        eq(WorkspaceMembers.workspaceId, workspaceId as string),
                        eq(WorkspaceMembers.userId, userId)
                    )
                );

            // If they aren't in the table, they don't belong to the workspace at all
            if (!membership) {
                res.status(403).json({ error: 'Access Denied: You are not a member of this workspace.' });
                return;
            }

            // 🛑 THE CRITICAL CHECK: Verify if their role is explicitly inside the allowed list
            const hasPermission = allowedRoles.includes(membership.role as 'OWNER' | 'ADMIN' | 'MEMBER');

            if (!hasPermission) {
                res.status(403).json({ error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}` });
                return;
            }

            // Access granted! Move to the controller
            next();
        } catch (error) {
            console.error('Role validation error:', error);
            res.status(500).json({ error: 'Internal Server Error during permission clearing.' });
        }
    };
};